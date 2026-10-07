import type { PointerEvent } from 'react'
import { useState } from 'react'
import { useAppStore } from '@/app/store'
import type { BeatView, GridPoint, GridPosition } from '@/core'
import { REST_FIGURE, beatViews, inLoopRange, setHold } from '@/core'

/** A press on a grid position, and (once it moves to another position) the hold end it drags to. */
interface Press {
  pointerId: number
  from: GridPoint
  /** Pressed on a hit or hold bar, so the press can drag that note's hold. */
  onNote: boolean
  /** The pointer has left the pressed position, so the release is not a click. */
  moved: boolean
  to: GridPoint | null
}

/** The grid position of a beat box under the pointer, kept to the box's first and last. */
function positionUnder(box: Element, clientX: number): number {
  const cells = [...box.querySelectorAll('[data-position]')]
  const i = cells.findIndex((cell) => clientX < cell.getBoundingClientRect().right)
  return i === -1 ? cells.length - 1 : i
}

/**
 * The bars and beats of the exercise, the main editor. Each beat box shows its grid positions: a
 * hit, a hold bar for a note still sounding, or an empty dot. Clicking a position turns a hit on or
 * off; pressing on a note and dragging sets where its hold ends, shown live and written on release.
 * Clicking elsewhere on a beat moves the cursor to it. The cursor, the bar selection and a set loop
 * range are shaded, and a bar's ✕ (shown on hover) deletes it.
 */
export function BeatStrip() {
  const bars = useAppStore((s) => s.editor.exercise.bars)
  const cursor = useAppStore((s) => s.editor.cursor)
  const selection = useAppStore((s) => s.editor.selection)
  const loopRange = useAppStore((s) => s.editor.exercise.practice.loopRange)
  const dispatch = useAppStore((s) => s.dispatch)
  const [press, setPress] = useState<Press | null>(null)
  // While dragging, the strip shows the hold as the core would write it.
  const views = beatViews(press?.to ? setHold(bars, press.from, press.to) : bars)

  const startPress = (e: PointerEvent<HTMLElement>, from: GridPoint, position: GridPosition) => {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setPress({ pointerId: e.pointerId, from, onNote: position !== 'empty', moved: false, to: null })
  }
  const movePress = (e: PointerEvent<HTMLElement>) => {
    if (!press || e.pointerId !== press.pointerId || !e.currentTarget.parentElement) return
    // The hold runs through the position under the pointer, in the pressed beat for now.
    const under = positionUnder(e.currentTarget.parentElement, e.clientX)
    const moved = press.moved || under !== press.from.position
    const to = press.onNote && moved ? { ...press.from, position: under + 1 } : null
    if (moved !== press.moved || to?.position !== press.to?.position) setPress({ ...press, moved, to })
  }
  const endPress = (e: PointerEvent<HTMLElement>) => {
    if (!press || e.pointerId !== press.pointerId) return
    setPress(null)
    if (!press.moved) dispatch({ type: 'toggleGridPosition', ...press.from })
    else if (press.to) dispatch({ type: 'setHold', from: press.from, to: press.to })
  }
  /** The beat after this one, if any, to run a hold bar on into it. */
  const nextBeat = (b: number, beat: number): BeatView | undefined =>
    beat < views[b].length - 1 ? views[b][beat + 1] : views[b + 1]?.[0]

  return (
    <div aria-label="Beat strip" className="flex flex-wrap gap-2">
      {views.map((beats, b) => {
        const selected = selection !== null && b >= selection.first && b <= selection.last
        const looped = inLoopRange(loopRange, b)
        return (
          <div
            key={b}
            aria-selected={selected || undefined}
            title={looped ? 'In the loop range' : undefined}
            // A selected bar in the loop range keeps the loop shading inside the selection's border.
            className={`group relative flex items-center gap-0.5 rounded-lg border p-1 ${
              selected ? 'border-accent' : looped ? 'border-loop-line' : 'border-line'
            } ${looped ? 'bg-loop' : selected ? 'bg-sky-100' : 'bg-card'}`}
          >
            <span className="w-5 text-center font-mono text-[11px] text-mute">{b + 1}</span>
            {beats.map((view, beat) => {
              const current = cursor.bar === b && cursor.beat === beat
              const tiedOn = nextBeat(b, beat)?.positions[0] === 'hold'
              return (
                <div
                  key={beat}
                  aria-label={`Bar ${b + 1}, beat ${beat + 1}`}
                  aria-current={current || undefined}
                  title={[view.tiedInto && 'tied into', view.cutShort && 'cut short'].filter(Boolean).join(', ') || undefined}
                  onClick={() => dispatch({ type: 'moveTo', bar: b, beat })}
                  className={`relative flex h-9 w-16 cursor-pointer items-stretch rounded-md border border-stone-300 bg-card ${
                    current ? 'outline-3 -outline-offset-2 outline-accent' : ''
                  }`}
                >
                  {view.tiedInto && <span className="absolute -top-2 -left-2 text-sm text-accent">⌒</span>}
                  {view.figure && view.figure !== REST_FIGURE && (
                    <span className="pointer-events-none absolute top-0 right-0.5 font-mono text-[9px]/[1] text-mute">
                      {view.figure.key.toUpperCase()}
                    </span>
                  )}
                  {view.positions.map((position, i) => (
                    <PositionCell
                      key={i}
                      label={`Bar ${b + 1}, beat ${beat + 1}, position ${i + 1}: ${position}`}
                      position={position}
                      holdsOn={i < view.positions.length - 1 ? view.positions[i + 1] === 'hold' : tiedOn}
                      onPointerDown={(e) => startPress(e, { bar: b, beat, position: i }, position)}
                      onPointerMove={movePress}
                      onPointerUp={endPress}
                      onPointerCancel={() => setPress(null)}
                    />
                  ))}
                </div>
              )
            })}
            <button
              type="button"
              title={`Delete bar ${b + 1} (Ctrl+Backspace)`}
              aria-label={`Delete bar ${b + 1}`}
              tabIndex={-1}
              // Keep focus off the button, so Space and Enter go to the editor rather than clicking it.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => dispatch({ type: 'deleteBar', bar: b })}
              className="absolute -top-2 -right-2 hidden size-5 cursor-pointer items-center justify-center rounded-full border border-line bg-card text-[10px] text-mute group-hover:flex hover:border-accent hover:text-accent"
            >
              ✕
            </button>
          </div>
        )
      })}
    </div>
  )
}

/**
 * One grid position: a hit's dot, a plain dot when empty, and the hold bar running in from the
 * left where the note sounds on here and out to the right where it sounds on after.
 */
function PositionCell({
  label,
  position,
  holdsOn,
  ...pointer
}: {
  label: string
  position: GridPosition
  /** The note here (struck or held) still sounds at the next position, so the bar runs on. */
  holdsOn: boolean
  /** A press here is a click on release, or a drag of the note's hold once it moves. */
  onPointerDown: (e: PointerEvent<HTMLElement>) => void
  onPointerMove: (e: PointerEvent<HTMLElement>) => void
  onPointerUp: (e: PointerEvent<HTMLElement>) => void
  onPointerCancel: () => void
}) {
  const sounding = position !== 'empty'
  return (
    <button
      type="button"
      aria-label={label}
      data-position
      tabIndex={-1}
      // Keep focus off the position, so Space and Enter go to the editor rather than clicking it.
      onMouseDown={(e) => e.preventDefault()}
      {...pointer}
      // The press handles the click; the beat box's own click (moving the cursor) must not follow.
      onClick={(e) => e.stopPropagation()}
      className="group/pos relative flex flex-1 cursor-pointer touch-none items-center justify-center"
    >
      {position === 'hold' && <span className="absolute top-1/2 left-0 h-1 w-1/2 -translate-y-1/2 bg-ink/70" />}
      {sounding && holdsOn && <span className="absolute top-1/2 right-0 h-1 w-1/2 -translate-y-1/2 bg-ink/70" />}
      {position === 'hit' ? (
        <span className="relative size-2.5 rounded-full bg-ink group-hover/pos:bg-accent" />
      ) : position === 'empty' ? (
        <span className="relative size-1 rounded-full bg-stone-400 group-hover/pos:size-2 group-hover/pos:bg-accent" />
      ) : (
        <span className="relative size-2 rounded-full group-hover/pos:bg-accent/60" />
      )}
    </button>
  )
}
