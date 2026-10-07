import type { PointerEvent } from 'react'
import { useRef, useState } from 'react'
import { useAppStore } from '@/app/store'
import { keepFocus } from '@/components/keepFocus'
import type { BeatView, GridPoint, PositionState } from '@/core'
import { REST_FIGURE, applyEdit, editorBeatViews, inLoopRange } from '@/core'

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

/**
 * The grid position under the pointer, anywhere in the strip: in the beat box nearest the pointer
 * (so a drag follows the strip onto the lines it wraps to), kept to that box's first and last
 * position.
 */
function pointUnder(strip: Element, clientX: number, clientY: number): GridPoint | null {
  let nearest: { box: HTMLElement; distance: number } | null = null
  for (const box of strip.querySelectorAll<HTMLElement>('[data-beat-box]')) {
    const r = box.getBoundingClientRect()
    const distance = Math.hypot(Math.max(r.left - clientX, 0, clientX - r.right), Math.max(r.top - clientY, 0, clientY - r.bottom))
    if (!nearest || distance < nearest.distance) nearest = { box, distance }
  }
  if (!nearest) return null
  const positions = [...nearest.box.querySelectorAll('[data-position]')]
  const i = positions.findIndex((position) => clientX < position.getBoundingClientRect().right)
  const { bar, beat } = nearest.box.dataset
  return { bar: Number(bar), beat: Number(beat), position: i === -1 ? positions.length - 1 : i }
}

const samePoint = (a: GridPoint | null, b: GridPoint | null) =>
  a?.bar === b?.bar && a?.beat === b?.beat && a?.position === b?.position

/**
 * The bars and beats of the exercise, the main editor. Each beat box shows its grid positions: a
 * hit, a hold bar for a note still sounding, or an empty dot. Clicking a position turns a hit on or
 * off; pressing on a note and dragging sets where its hold ends, on into later beats and bars (tied),
 * shown live and written on release.
 * Clicking elsewhere on a beat moves the cursor to it. A beat's 3/16 toggle, or a right-click on
 * its box, switches it between the triplet and the sixteenth grid. The cursor, the bar selection
 * and a set loop range are shaded, and a bar's ✕ (shown on hover) deletes it.
 */
export function BeatStrip() {
  const editor = useAppStore((s) => s.editor)
  const { cursor, selection } = editor
  const { loopRange } = editor.exercise.practice
  const dispatch = useAppStore((s) => s.dispatch)
  const [press, setPress] = useState<Press | null>(null)
  // The press as the handlers last left it, which the next event sees even before it has rendered.
  const pressRef = useRef<Press | null>(null)
  const track = (next: Press | null) => {
    pressRef.current = next
    setPress(next)
  }
  // While dragging, the strip shows the hold as the editor would write it on release.
  const shown = press?.to ? applyEdit(editor, { type: 'setHold', from: press.from, to: press.to }) : editor
  const views = editorBeatViews(shown)

  const startPress = (e: PointerEvent<HTMLElement>, from: GridPoint, position: PositionState) => {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    track({ pointerId: e.pointerId, from, onNote: position !== 'empty', moved: false, to: null })
  }
  /** The press followed to the pointer: the hold runs through the position under it, in this beat or a later one. */
  const follow = (e: PointerEvent<HTMLElement>, press: Press): Press => {
    const strip = e.currentTarget.closest('[data-beat-strip]')
    const under = strip && pointUnder(strip, e.clientX, e.clientY)
    if (!under) return press
    const moved = press.moved || !samePoint(under, press.from)
    const to = press.onNote && moved ? { ...under, position: under.position + 1 } : null
    return moved !== press.moved || !samePoint(to, press.to) ? { ...press, moved, to } : press
  }
  const movePress = (e: PointerEvent<HTMLElement>) => {
    const press = pressRef.current
    if (!press || e.pointerId !== press.pointerId) return
    const next = follow(e, press)
    if (next !== press) track(next)
  }
  const endPress = (e: PointerEvent<HTMLElement>) => {
    const press = pressRef.current
    if (!press || e.pointerId !== press.pointerId) return
    track(null)
    // The release's own position counts too.
    const last = follow(e, press)
    if (!last.moved) dispatch({ type: 'toggleGridPosition', ...last.from })
    else if (last.to) dispatch({ type: 'setHold', from: last.from, to: last.to })
  }
  /** The beat after this one, if any, to run a hold bar on into it. */
  const nextBeat = (b: number, beat: number): BeatView | undefined =>
    beat < views[b].length - 1 ? views[b][beat + 1] : views[b + 1]?.[0]

  return (
    // The strip's right-click switches grids, so the browser's menu stays shut over it.
    <div aria-label="Beat strip" data-beat-strip className="flex flex-wrap gap-2" onContextMenu={(e) => e.preventDefault()}>
      {views.map((beats, b) => {
        const selected = selection !== null && b >= selection.first && b <= selection.last
        const looped = inLoopRange(loopRange, b)
        return (
          <div
            key={b}
            aria-selected={selected || undefined}
            title={looped ? 'In the loop range' : undefined}
            // A selected bar in the loop range keeps the loop shading inside the selection's border.
            className={`group relative flex items-center gap-0.5 rounded-lg border px-1 pt-1 pb-3 ${
              selected ? 'border-accent' : looped ? 'border-loop-line' : 'border-line'
            } ${looped ? 'bg-loop' : selected ? 'bg-sky-100' : 'bg-card'}`}
          >
            <span className="w-5 text-center font-mono text-[11px] text-mute">{b + 1}</span>
            {beats.map((view, beat) => {
              const current = cursor.bar === b && cursor.beat === beat
              const tiedOn = nextBeat(b, beat)?.positions[0] === 'hold'
              const switchGrid = () => dispatch({ type: 'setBeatGrid', bar: b, beat, triplet: !view.triplet })
              return (
                <div
                  key={beat}
                  aria-label={`Bar ${b + 1}, beat ${beat + 1}`}
                  data-beat-box
                  data-bar={b}
                  data-beat={beat}
                  aria-current={current || undefined}
                  title={[view.tiedInto && 'tied into', view.cutShort && 'cut short'].filter(Boolean).join(', ') || undefined}
                  onClick={() => dispatch({ type: 'moveTo', bar: b, beat })}
                  onContextMenu={switchGrid}
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
                    <GridPositionButton
                      key={i}
                      label={`Bar ${b + 1}, beat ${beat + 1}, position ${i + 1}: ${position}`}
                      position={position}
                      holdsOn={i < view.positions.length - 1 ? view.positions[i + 1] === 'hold' : tiedOn}
                      onPointerDown={(e) => startPress(e, { bar: b, beat, position: i }, position)}
                      onPointerMove={movePress}
                      onPointerUp={endPress}
                      onPointerCancel={() => track(null)}
                    />
                  ))}
                  <button
                    type="button"
                    aria-label={`Bar ${b + 1}, beat ${beat + 1}: ${view.triplet ? 'triplet' : 'sixteenth'} grid`}
                    title={`On the ${view.triplet ? 'triplet' : 'sixteenth'} grid: switch to ${view.triplet ? 'sixteenths' : 'triplets'} (or right-click the beat)`}
                    tabIndex={-1}
                    onMouseDown={keepFocus}
                    onClick={(e) => {
                      e.stopPropagation()
                      switchGrid()
                    }}
                    className={`absolute -bottom-2 left-1/2 min-w-4 -translate-x-1/2 cursor-pointer rounded border bg-card px-0.5 font-mono text-[9px]/[11px] hover:border-accent hover:text-accent ${
                      view.triplet ? 'border-accent text-accent' : 'border-line text-mute'
                    }`}
                  >
                    {view.triplet ? '3' : '16'}
                  </button>
                </div>
              )
            })}
            <button
              type="button"
              title={`Delete bar ${b + 1} (Ctrl+Backspace)`}
              aria-label={`Delete bar ${b + 1}`}
              tabIndex={-1}
              // Keep focus off the button, so Space and Enter go to the editor rather than clicking it.
              onMouseDown={keepFocus}
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
function GridPositionButton({
  label,
  position,
  holdsOn,
  ...pointer
}: {
  label: string
  position: PositionState
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
      onMouseDown={keepFocus}
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
        <span className="relative size-1 rounded-full bg-mute/70 group-hover/pos:size-2 group-hover/pos:bg-accent" />
      ) : (
        <span className="relative size-2 rounded-full group-hover/pos:bg-accent/60" />
      )}
    </button>
  )
}
