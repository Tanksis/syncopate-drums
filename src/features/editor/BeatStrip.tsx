import type { PointerEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/app/store'
import { keepFocus } from '@/components/keepFocus'
import type { MenuItem } from '@/components/Menu'
import { Menu } from '@/components/Menu'
import type { BeatView, EditCommand, EditorState, GridPoint, Hand, PositionState, Row, RowView } from '@/core'
import { ROWS, applyEdit, canTieOverBarline, editorBeatViews, inLoopRange, isExample, sticking, stickingNoteAt } from '@/core'

/** A press on a grid position, and (once it moves to another position) the hold end it drags to. */
interface Press {
  pointerId: number
  from: GridPoint
  /** Pressed on a hit or hold bar, so the press can drag that note's hold. */
  onNote: boolean
  /** The pointer has left the pressed position, so the release is not a click. */
  moved: boolean
  to: GridPoint | null
  /** Where the pointer went down, to tell a still long-press from the start of a drag. */
  down: { x: number; y: number }
  /** The struck snare note a long-press here would flip, or null where it would do nothing. */
  flipNoteId: string | null
  /** The long-press took: the note's sticking is flipped, and the release does nothing more. */
  flipped: boolean
}

/** How long a still press on a hit lasts before it flips the note's sticking. */
const LONG_PRESS_MS = 500
/** How far the pointer may wander, in pixels, and still be a long-press. */
const LONG_PRESS_SLOP = 8
/** How long the flipped hand shows on its cell. */
const FLASH_MS = 700

/**
 * The grid position of a row under the pointer, anywhere in the strip: in the beat card nearest the
 * pointer (so a drag follows the strip onto later beats), kept to that card's first and last
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

/** How each row is named and coloured: the kick row in its own colour, apart from the snare row's ink. */
const ROW_LOOK: Record<Row, { name: string; disc: string; hold: string }> = {
  snare: { name: 'Snare', disc: 'bg-ink', hold: 'bg-ink/70' },
  kick: { name: 'Kick', disc: 'bg-kick', hold: 'bg-kick/70' },
}

/** What each grid position of a beat is counted as: 1 e & a, or 1 trip let. */
const countLabels = (beat: number, triplet: boolean) =>
  triplet ? [`${beat + 1}`, 'trip', 'let'] : [`${beat + 1}`, 'e', '&', 'a']

/**
 * The bars and beats of the exercise, the main editor. It shows one bar at a time, the cursor's
 * (the bar tabs go to another), so it stays the same height however long the exercise is: a header
 * with the bar's number and delete button, over its beats, each a card. A card shows the snare
 * row's grid positions as big cells (a hit, a hold bar for a note still sounding, or a ghost hit on
 * hover), their count labels, and the kick row's cells under them, as the staff writes hands over
 * feet. Clicking a cell turns a hit on or off in its row; pressing on a note and dragging sets
 * where its hold ends, on into later beats of the bar in the same row, shown live and written on
 * release. Holding still on a snare hit for half a second flips its sticking instead, flashing the
 * new hand on the cell. Clicking elsewhere on a card moves the cursor to it. A card's 16ths | trip switch puts
 * it on the sixteenth or the triplet grid, and its ⋯ menu (not on an example) switches the grid,
 * rests the beat, or ties a bar's first beat over the barline. The cursor's card is outlined with a
 * mark beside its row, and the bar selection and a set loop range are shaded. `twoPerRow`, on a
 * phone, lays the cards out two to a row with cells tall enough for a finger, and leaves the bar's
 * number and delete button to the bar tabs and the bar menu above.
 */
export function BeatStrip({ twoPerRow = false }: { twoPerRow?: boolean }) {
  const editor = useAppStore((s) => s.editor)
  const { cursor, selection } = editor
  const { loopRange } = editor.exercise.practice
  const dispatch = useAppStore((s) => s.dispatch)
  const example = useAppStore((s) => isExample(s.editor.exercise.id))
  const [press, setPress] = useState<Press | null>(null)
  // The press as the handlers last left it, which the next event sees even before it has rendered.
  const pressRef = useRef<Press | null>(null)
  const track = (next: Press | null) => {
    pressRef.current = next
    setPress(next)
  }
  // A pending long-press, and the note whose flipped hand is flashing on its cell.
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [flash, setFlash] = useState<{ point: GridPoint; noteId: string } | null>(null)
  const flashTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(
    () => () => {
      clearTimeout(longPressTimer.current)
      clearTimeout(flashTimer.current)
    },
    [],
  )
  const flashedHand = (flash && sticking(editor.exercise).find((n) => n.noteId === flash.noteId)?.shown) ?? null
  // While dragging, the strip shows the hold as the editor would write it on release.
  const shown = press?.to ? applyEdit(editor, { type: 'setHold', from: press.from, to: press.to }) : editor
  const views = editorBeatViews(shown)

  const startPress = (e: PointerEvent<HTMLElement>, from: GridPoint, position: PositionState) => {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const flipNoteId = example ? null : stickingNoteAt(editor, from)
    track({
      pointerId: e.pointerId,
      from,
      onNote: position !== 'empty',
      moved: false,
      to: null,
      down: { x: e.clientX, y: e.clientY },
      flipNoteId,
      flipped: false,
    })
    clearTimeout(longPressTimer.current)
    if (flipNoteId) longPressTimer.current = setTimeout(() => longPress(e.pointerId), LONG_PRESS_MS)
  }
  const cancelPress = () => {
    clearTimeout(longPressTimer.current)
    track(null)
  }
  /** The press has stayed still on its hit long enough: flip the note's sticking, and flash its new hand. */
  const longPress = (pointerId: number) => {
    const press = pressRef.current
    if (!press?.flipNoteId || press.pointerId !== pointerId) return
    track({ ...press, flipped: true })
    dispatch({ type: 'flipOverride', note: { id: press.flipNoteId } })
    setFlash({ point: press.from, noteId: press.flipNoteId })
    clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setFlash(null), FLASH_MS)
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
    if (!press || e.pointerId !== press.pointerId || press.flipped) return
    if (press.flipNoteId) {
      // Jitter while waiting for a long-press, even over the cell's edge, is still holding still.
      if (Math.hypot(e.clientX - press.down.x, e.clientY - press.down.y) <= LONG_PRESS_SLOP) return
      // Wandering off ends the wait; the press goes on as a click or a drag.
      clearTimeout(longPressTimer.current)
      return track(follow(e, { ...press, flipNoteId: null }))
    }
    const next = follow(e, press)
    if (next !== press) track(next)
  }
  const endPress = (e: PointerEvent<HTMLElement>) => {
    const press = pressRef.current
    if (!press || e.pointerId !== press.pointerId) return
    cancelPress()
    if (press.flipped) return
    // The release's own position counts too, unless it is still within a long-press's slop: a click.
    const last = press.flipNoteId ? press : follow(e, press)
    if (!last.moved) dispatch({ type: 'toggleGridPosition', ...last.from })
    else if (last.to) dispatch({ type: 'setHold', from: last.from, to: last.to })
  }
  /** The beat after this one, if any, to run a hold bar on into it. */
  const nextBeat = (b: number, beat: number): BeatView | undefined =>
    beat < views[b].length - 1 ? views[b][beat + 1] : views[b + 1]?.[0]

  /**
   * One row of a card's cells, its ⌒ mark at the start when the beat is tied into, and a bar beside
   * it when the cursor is in it.
   */
  const rowCells = (row: Row, view: RowView, b: number, beat: number) => {
    const tiedOn = nextBeat(b, beat)?.[row].positions[0] === 'hold'
    const cursorHere = cursor.bar === b && cursor.beat === beat && cursor.row === row
    return (
      <div
        aria-label={`${ROW_LOOK[row].name} row`}
        aria-current={cursorHere || undefined}
        title={[view.tiedInto && 'tied into', view.cutShort && 'cut short'].filter(Boolean).join(', ') || undefined}
        className="relative flex gap-1"
      >
        {cursorHere && <span aria-hidden className="absolute inset-y-1 -left-1.5 w-1 rounded-full bg-accent" />}
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
            onPointerCancel={cancelPress}
            tall={twoPerRow}
            flashedHand={flash && samePoint(flash.point, { row, bar: b, beat, position: i }) ? flashedHand : null}
          />
        ))}
      </div>
    )
  }

  const b = cursor.bar
  const beats = views[b]
  const selected = selection !== null && b >= selection.first && b <= selection.last
  const looped = inLoopRange(loopRange, b)
  return (
    <div aria-label="Beat strip" data-beat-strip className="flex flex-col gap-2">
      <div
        aria-label={`Bar ${b + 1}`}
        aria-selected={selected || undefined}
        title={looped ? 'In the loop range' : undefined}
        // A selected bar in the loop range keeps the loop shading inside the selection's border.
        className={`flex flex-col gap-1.5 rounded-lg border px-2 pb-2 ${twoPerRow ? 'pt-2' : 'pt-1'} ${
          selected ? 'border-accent' : looped ? 'border-loop-line' : 'border-line'
        } ${looped ? 'bg-loop' : selected ? 'bg-sky-100' : 'bg-panel'}`}
      >
        {!twoPerRow && (
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
        )}
        <div className={`grid gap-2 ${twoPerRow ? 'grid-cols-2' : 'grid-cols-4'}`}>
          {beats.map((view, beat) => {
            const current = cursor.beat === beat
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
                className={`relative flex min-w-0 cursor-pointer flex-col gap-1 rounded-xl border p-2 ${looped || selected ? 'bg-card/60' : 'bg-card'} ${
                  current ? 'border-accent ring-2 ring-accent' : 'border-line'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-lg/none font-bold">{beat + 1}</span>
                  <GridSwitch bar={b} beat={beat} triplet={view.triplet} onSwitch={switchGrid} />
                  {!example && <Menu label={`Bar ${b + 1}, beat ${beat + 1} menu`} items={beatMenu(editor, b, beat, view, switchGrid, dispatch)} />}
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
    </div>
  )
}

/**
 * A beat card's ⋯ menu: the other grid, a rest in both rows, and, on a bar's first beat, a tie over
 * the barline for each row the core offers one in, ticked when tied.
 */
function beatMenu(
  editor: EditorState,
  bar: number,
  beat: number,
  view: BeatView,
  switchGrid: () => void,
  dispatch: (command: EditCommand) => void,
): MenuItem[] {
  const ties = beat === 0 ? ROWS.filter((row) => canTieOverBarline(editor, bar, row)) : []
  return [
    { label: view.triplet ? 'Switch to sixteenths' : 'Switch to triplets', onSelect: switchGrid },
    { label: 'Rest the beat', onSelect: () => dispatch({ type: 'restBeat', bar, beat }) },
    ...ties.map((row) => ({
      label: `Tie ${ROW_LOOK[row].name.toLowerCase()} over the barline`,
      checked: view[row].tiedInto,
      onSelect: () => dispatch({ type: 'tieOverBarline', bar, row }),
    })),
  ]
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
        title={on ? `On the ${grid} grid` : `Switch to the ${grid} grid`}
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
  tall,
  flashedHand,
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
  /** At least 44 px tall, for a finger on a phone. */
  tall: boolean
  /** The hand a long-press here just flipped the note to, shown for a moment. */
  flashedHand: Hand | null
  /** A press here is a click on release, or a drag of the note's hold once it moves. */
  onPointerDown: (e: PointerEvent<HTMLElement>) => void
  onPointerMove: (e: PointerEvent<HTMLElement>) => void
  onPointerUp: (e: PointerEvent<HTMLElement>) => void
  onPointerCancel: () => void
}) {
  const sounding = position !== 'empty'
  // To the middle of the 4px gap between cells, or across the card's padding and border to the middle of the gap between cards.
  const holdLine = `pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 ${ROW_LOOK[row].hold}`
  const disc = `relative size-4 rounded-full ${ROW_LOOK[row].disc}`
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
      // A long-press is the strip's own: no context menu, callout or text selection on top of it.
      onContextMenu={(e) => e.preventDefault()}
      className={`group/cell relative flex min-w-0 flex-1 cursor-pointer touch-none items-center justify-center rounded border border-line bg-card select-none [-webkit-touch-callout:none] hover:border-accent ${tall ? 'h-11' : 'h-10'}`}
    >
      {position === 'hold' && <span className={`${holdLine} right-1/2 ${first ? '-left-[14px]' : '-left-[3px]'}`} />}
      {sounding && holdsOn && <span className={`${holdLine} left-1/2 ${last ? '-right-[14px]' : '-right-[3px]'}`} />}
      {position === 'hit' ? (
        <span className={`${disc} group-hover/cell:bg-accent`} />
      ) : position === 'empty' ? (
        <span className={`${disc} opacity-0 group-hover/cell:opacity-25`} />
      ) : null}
      {flashedHand && (
        <span
          aria-hidden
          data-flashed-hand
          className="pointer-events-none absolute inset-0 flex animate-pulse items-center justify-center rounded bg-accent text-sm font-bold text-white"
        >
          {flashedHand}
        </span>
      )}
    </button>
  )
}
