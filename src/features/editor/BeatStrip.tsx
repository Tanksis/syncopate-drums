import type { PointerEvent } from 'react'
import { useRef, useState } from 'react'
import { useAppStore } from '@/app/store'
import { keepFocus } from '@/components/keepFocus'
import type { BeatView, Figure, GridPoint, PositionState, Row, RowView } from '@/core'
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
 * The grid position of a row under the pointer, anywhere in the strip: in the beat card nearest the
 * pointer (so a drag follows the strip onto the bars below), kept to that card's first and last
 * position in the row.
 */
function pointUnder(strip: Element, row: Row, clientX: number, clientY: number): GridPoint | null {
  let nearest: { box: HTMLElement; distance: number } | null = null
  for (const box of strip.querySelectorAll<HTMLElement>('[data-beat-box]')) {
    const r = box.getBoundingClientRect()
    const distance = Math.hypot(Math.max(r.left - clientX, 0, clientX - r.right), Math.max(r.top - clientY, 0, clientY - r.bottom))
    if (!nearest || distance < nearest.distance) nearest = { box, distance }
  }
  if (!nearest) return null
  const positions = [...nearest.box.querySelectorAll(`[data-position][data-row="${row}"]`)]
  const i = positions.findIndex((position) => clientX < position.getBoundingClientRect().right)
  const { bar, beat } = nearest.box.dataset
  return { row, bar: Number(bar), beat: Number(beat), position: i === -1 ? positions.length - 1 : i }
}

const samePoint = (a: GridPoint | null, b: GridPoint | null) =>
  a?.row === b?.row && a?.bar === b?.bar && a?.beat === b?.beat && a?.position === b?.position

const ROW_NAME: Record<Row, string> = { snare: 'Snare', kick: 'Kick' }

/** What each grid position of a beat is counted as: 1 e & a, or 1 trip let. */
const countLabels = (beat: number, triplet: boolean) =>
  triplet ? [`${beat + 1}`, 'trip', 'let'] : [`${beat + 1}`, 'e', '&', 'a']

/**
 * The bars and beats of the exercise, the main editor: one bar per row, under a header with its
 * number and delete button, and each beat a card. A card shows the snare row's grid positions as
 * big cells (a hit, a hold bar for a note still sounding, or a ghost hit on hover), their count
 * labels, and the kick row's cells under them, as the staff writes hands over feet. Clicking a
 * cell turns a hit on or off in its row; pressing on a note and dragging sets where its hold ends,
 * on into later beats and bars (tied) in the same row, shown live and written on release.
 * Clicking elsewhere on a card moves the cursor to it. A card's 16ths | trip switch, or a
 * right-click on it, switches it between the sixteenth and the triplet grid. The cursor's card is
 * outlined, and the bar selection and a set loop range are shaded.
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
    const under = strip && pointUnder(strip, press.from.row, e.clientX, e.clientY)
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

  /** One row of a card's cells, its ⌒ mark at the start when the beat is tied into. */
  const rowCells = (row: Row, view: RowView, b: number, beat: number) => {
    const tiedOn = nextBeat(b, beat)?.[row].positions[0] === 'hold'
    return (
      <div
        aria-label={`${ROW_NAME[row]} row`}
        title={[view.tiedInto && 'tied into', view.cutShort && 'cut short'].filter(Boolean).join(', ') || undefined}
        className="relative flex gap-1"
      >
        {view.tiedInto && <span className="absolute -top-3 -left-3.5 text-base text-accent">⌒</span>}
        {view.positions.map((position, i) => (
          <Cell
            key={i}
            row={row}
            label={`Bar ${b + 1}, beat ${beat + 1}, ${row} position ${i + 1}: ${position}`}
            position={position}
            holdsOn={i < view.positions.length - 1 ? view.positions[i + 1] === 'hold' : tiedOn}
            first={i === 0}
            last={i === view.positions.length - 1}
            onPointerDown={(e) => startPress(e, { row, bar: b, beat, position: i }, position)}
            onPointerMove={movePress}
            onPointerUp={endPress}
            onPointerCancel={() => track(null)}
          />
        ))}
      </div>
    )
  }

  return (
    // The strip's right-click switches grids, so the browser's menu stays shut over it.
    <div aria-label="Beat strip" data-beat-strip className="flex flex-col gap-2" onContextMenu={(e) => e.preventDefault()}>
      {views.map((beats, b) => {
        const selected = selection !== null && b >= selection.first && b <= selection.last
        const looped = inLoopRange(loopRange, b)
        return (
          <div
            key={b}
            aria-label={`Bar ${b + 1}`}
            aria-selected={selected || undefined}
            title={looped ? 'In the loop range' : undefined}
            // A selected bar in the loop range keeps the loop shading inside the selection's border.
            className={`flex flex-col gap-1.5 rounded-lg border px-2 pt-1 pb-2 ${
              selected ? 'border-accent' : looped ? 'border-loop-line' : 'border-line'
            } ${looped ? 'bg-loop' : selected ? 'bg-sky-100' : 'bg-panel'}`}
          >
            <div className="flex items-center text-xs">
              <span className={`font-semibold ${looped ? 'text-loop-ink' : 'text-ink'}`}>Bar {b + 1}</span>
              <button
                type="button"
                title={`Delete bar ${b + 1} (Ctrl+Backspace)`}
                aria-label={`Delete bar ${b + 1}`}
                tabIndex={-1}
                // Keep focus off the button, so Space and Enter go to the editor rather than clicking it.
                onMouseDown={keepFocus}
                onClick={() => dispatch({ type: 'deleteBar', bar: b })}
                className="ml-auto cursor-pointer rounded px-1.5 text-mute hover:bg-line hover:text-danger"
              >
                ✕ delete
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {beats.map((view, beat) => {
                const current = cursor.bar === b && cursor.beat === beat
                const switchGrid = () => dispatch({ type: 'setBeatGrid', bar: b, beat, triplet: !view.triplet })
                return (
                  <div
                    key={beat}
                    aria-label={`Bar ${b + 1}, beat ${beat + 1}`}
                    data-beat-box
                    data-bar={b}
                    data-beat={beat}
                    aria-current={current || undefined}
                    onClick={() => dispatch({ type: 'moveTo', bar: b, beat })}
                    onContextMenu={switchGrid}
                    className={`relative flex min-w-0 cursor-pointer flex-col gap-1 rounded-xl border p-2 ${looped || selected ? 'bg-card/60' : 'bg-card'} ${
                      current ? 'border-accent ring-2 ring-accent' : 'border-line'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg/none font-bold">{beat + 1}</span>
                      <FigureKey row="snare" figure={view.snare.figure} />
                      <FigureKey row="kick" figure={view.kick.figure} />
                      <GridSwitch bar={b} beat={beat} triplet={view.triplet} onSwitch={switchGrid} />
                    </div>
                    {rowCells('snare', view.snare, b, beat)}
                    <div aria-hidden className="flex gap-1">
                      {countLabels(beat, view.triplet).map((label, i) => (
                        <span key={i} className={`flex-1 text-center font-mono text-[11px] ${i === 0 ? 'font-bold text-ink' : 'text-mute'}`}>
                          {label}
                        </span>
                      ))}
                    </div>
                    {rowCells('kick', view.kick, b, beat)}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** The key of a row's figure in the beat, as a keycap; none for a rest or a beat no figure writes. */
function FigureKey({ row, figure }: { row: Row; figure: Figure | undefined }) {
  if (!figure || figure === REST_FIGURE) return null
  const key = figure.key.toUpperCase()
  return (
    <kbd
      title={`${ROW_NAME[row]} figure key ${key}`}
      className={`rounded border border-b-2 px-1 font-mono text-[10px]/[14px] ${row === 'kick' ? 'border-kick/40 text-kick' : 'border-line text-mute'}`}
    >
      {key}
    </kbd>
  )
}

/** A beat's 16ths | trip switch, its current grid lit. */
function GridSwitch({ bar, beat, triplet, onSwitch }: { bar: number; beat: number; triplet: boolean; onSwitch: () => void }) {
  const segment = (grid: 'sixteenth' | 'triplet', label: string) => {
    const on = (grid === 'triplet') === triplet
    return (
      <button
        type="button"
        aria-label={`Bar ${bar + 1}, beat ${beat + 1}: ${grid} grid`}
        aria-pressed={on}
        title={on ? `On the ${grid} grid` : `Switch to the ${grid} grid (or right-click the beat)`}
        tabIndex={-1}
        // Keep focus off the button, so Space and Enter go to the editor rather than clicking it.
        onMouseDown={keepFocus}
        onClick={(e) => {
          e.stopPropagation()
          if (!on) onSwitch()
        }}
        className={`cursor-pointer px-1.5 ${on ? 'bg-accent text-white' : 'text-mute hover:text-accent'}`}
      >
        {label}
      </button>
    )
  }
  return (
    <span className="ml-auto inline-flex overflow-hidden rounded border border-line bg-card text-[10px] leading-5">
      {segment('sixteenth', '16ths')}
      {segment('triplet', 'trip')}
    </span>
  )
}

/**
 * One grid position, a big cell: a hit's disc, a ghost hit on hover when empty, and the hold bar
 * running in from the left where the note sounds on here and out to the right where it sounds on
 * after. At the card's edges the bar runs on to meet the next card's.
 */
function Cell({
  row,
  label,
  position,
  holdsOn,
  first,
  last,
  ...pointer
}: {
  /** The kick row's hits are drawn in its own colour. */
  row: Row
  label: string
  position: PositionState
  /** The note here (struck or held) still sounds at the next position, so the bar runs on. */
  holdsOn: boolean
  /** The beat's first or last cell, whose bar runs on across the card's edge. */
  first: boolean
  last: boolean
  /** A press here is a click on release, or a drag of the note's hold once it moves. */
  onPointerDown: (e: PointerEvent<HTMLElement>) => void
  onPointerMove: (e: PointerEvent<HTMLElement>) => void
  onPointerUp: (e: PointerEvent<HTMLElement>) => void
  onPointerCancel: () => void
}) {
  const sounding = position !== 'empty'
  // To the middle of the 4px gap between cells, or across the card's padding and border to the middle of the gap between cards.
  const holdLine = `pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 ${row === 'kick' ? 'bg-kick/70' : 'bg-ink/70'}`
  const disc = `relative size-4 rounded-full ${row === 'kick' ? 'bg-kick' : 'bg-ink'}`
  return (
    <button
      type="button"
      aria-label={label}
      data-position
      data-row={row}
      tabIndex={-1}
      // Keep focus off the cell, so Space and Enter go to the editor rather than clicking it.
      onMouseDown={keepFocus}
      {...pointer}
      // The press handles the click; the card's own click (moving the cursor) must not follow.
      onClick={(e) => e.stopPropagation()}
      className="group/cell relative flex h-10 min-w-0 flex-1 cursor-pointer touch-none items-center justify-center rounded border border-line bg-card hover:border-accent"
    >
      {position === 'hold' && <span className={`${holdLine} right-1/2 ${first ? '-left-[14px]' : '-left-[3px]'}`} />}
      {sounding && holdsOn && <span className={`${holdLine} left-1/2 ${last ? '-right-[14px]' : '-right-[3px]'}`} />}
      {position === 'hit' ? (
        <span className={`${disc} group-hover/cell:bg-accent`} />
      ) : position === 'empty' ? (
        <span className={`${disc} opacity-0 group-hover/cell:opacity-25`} />
      ) : null}
    </button>
  )
}
