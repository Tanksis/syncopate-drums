// The auto-speller: the editor's view of each beat, derived from the bars, and writing a beat
// back by re-spelling the bars. The drummer never chooses note values, rests, dots or ties.

import type { Figure } from './figures'
import { figureOfHits } from './figures'
import type { Bar, Hand, Item } from './model'
import { BEATS_PER_BAR, TICKS_PER_BAR, TICKS_PER_BEAT, itemTicks } from './model'

/** What the grid editor shows for one beat. */
export interface BeatView {
  /** Undefined only for a beat no figure can write. */
  figure: Figure | undefined
  hits: string
}

const CELLS_PER_BEAT = 4
const CELL_TICKS = TICKS_PER_BEAT / CELLS_PER_BEAT

/** One sixteenth of the timeline: a struck note, a note still sounding, or silence. */
type Cell = { state: 'hit'; override?: Hand } | { state: 'hold' } | { state: 'rest' }

/** An item with its position: bar index and start tick within the bar. */
export interface PlacedItem {
  item: Item
  bar: number
  start: number
  /** A tied continuation: not struck, just holds the previous note on. */
  continuation: boolean
}

export function placeItems(bars: readonly Bar[]): PlacedItem[] {
  const placed: PlacedItem[] = []
  let previous: Item | undefined
  bars.forEach((bar, b) => {
    let start = 0
    for (const item of bar.items) {
      const continuation = item.kind === 'note' && previous?.kind === 'note' && previous.tiedToNext
      placed.push({ item, bar: b, start, continuation })
      start += itemTicks(item)
      previous = item
    }
  })
  return placed
}

function toCells(bars: readonly Bar[]): Cell[] {
  const cells: Cell[] = []
  const placed = placeItems(bars)
  let i = 0
  for (let tick = 0; tick < bars.length * TICKS_PER_BAR; tick += CELL_TICKS) {
    const at = (p: PlacedItem) => p.bar * TICKS_PER_BAR + p.start
    while (i + 1 < placed.length && at(placed[i + 1]) <= tick) i++
    const p = placed[i]
    if (p.item.kind === 'rest') cells.push({ state: 'rest' })
    else if (at(p) === tick && !p.continuation) cells.push({ state: 'hit', override: p.item.override })
    else cells.push({ state: 'hold' })
  }
  return cells
}

/** Can a note (or rest) of this many ticks start here and still read well? */
function fits(start: number, ticks: number, rest: boolean): boolean {
  const inBeat = start % TICKS_PER_BEAT
  switch (ticks) {
    case 18: // dotted quarter
      return !rest && start % 6 === 0
    case 12: // quarter: a note may sit on the "&" (a syncopated quarter); a rest only on the beat
      return rest ? inBeat === 0 : start % 6 === 0
    case 9: // dotted eighth
      return inBeat === 0 || inBeat === 3
    case 6: // eighth
      return start % 6 === 0 || inBeat === 3
    default:
      return true
  }
}

const SPELLINGS: readonly [ticks: number, Pick<Item, 'duration' | 'dotted'>][] = [
  [18, { duration: 'quarter', dotted: true }],
  [12, { duration: 'quarter', dotted: false }],
  [9, { duration: 'eighth', dotted: true }],
  [6, { duration: 'eighth', dotted: false }],
  [3, { duration: 'sixteenth', dotted: false }],
]

/** The longest legal values, one after another, from `start` up to `end`. */
function spell(start: number, end: number, rest: boolean) {
  const out: { start: number; ticks: number; value: Pick<Item, 'duration' | 'dotted'> }[] = []
  while (start < end) {
    const [ticks, value] = SPELLINGS.find(([t]) => start + t <= end && fits(start, t, rest))!
    out.push({ start, ticks, value })
    start += ticks
  }
  return out
}

function fromCells(cells: readonly Cell[]): Bar[] {
  // Runs of sound or silence over the whole timeline, in ticks.
  type Segment = { note: boolean; start: number; end: number; override?: Hand }
  const segments: Segment[] = []
  cells.forEach((cell, c) => {
    const start = c * CELL_TICKS
    const last = segments.at(-1)
    if (cell.state === 'hit') segments.push({ note: true, start, end: start + CELL_TICKS, override: cell.override })
    else if (last && last.note === (cell.state === 'hold')) last.end += CELL_TICKS
    else segments.push({ note: false, start, end: start + CELL_TICKS })
  })

  const bars: Bar[] = Array.from({ length: cells.length / (CELLS_PER_BEAT * BEATS_PER_BAR) }, () => ({ items: [] }))
  for (const seg of segments) {
    // A note is cut only at bar lines (and tied across); a rest at every beat.
    const step = seg.note ? TICKS_PER_BAR : TICKS_PER_BEAT
    const cuts = [seg.start]
    for (let t = (Math.floor(seg.start / step) + 1) * step; t < seg.end; t += step) cuts.push(t)
    cuts.push(seg.end)
    const pieces = cuts.slice(1).flatMap((end, i) => spell(cuts[i], end, !seg.note))
    pieces.forEach((piece, i) => {
      const base = { ...piece.value, triplet: false }
      const item: Item = seg.note
        ? {
            kind: 'note',
            ...base,
            tiedToNext: i < pieces.length - 1,
            ...(i === 0 && seg.override ? { override: seg.override } : {}),
          }
        : { kind: 'rest', ...base }
      bars[Math.floor(piece.start / TICKS_PER_BAR)].items.push(item)
    })
  }
  return bars
}

function hitsOf(cells: readonly Cell[]): string {
  return cells.map((cell, i) => (cell.state === 'hit' || (i === 0 && cell.state === 'hold') ? 'x' : '.')).join('')
}

/** Each bar's four beats as the grid editor sees them. */
export function beatViews(bars: readonly Bar[]): BeatView[][] {
  const cells = toCells(bars)
  return bars.map((_, b) =>
    Array.from({ length: BEATS_PER_BAR }, (_, beat) => {
      const first = (b * BEATS_PER_BAR + beat) * CELLS_PER_BEAT
      const hits = hitsOf(cells.slice(first, first + CELLS_PER_BEAT))
      return { figure: figureOfHits(hits), hits }
    }),
  )
}

/**
 * Writes a figure's hits into one beat and re-spells the bars. A hit that lands where a note
 * already started keeps that note's sticking override.
 */
export function setBeat(bars: readonly Bar[], bar: number, beat: number, hits: string): Bar[] {
  const cells = toCells(bars)
  const first = (bar * BEATS_PER_BAR + beat) * CELLS_PER_BEAT
  let sounding = false
  ;[...hits].forEach((ch, i) => {
    const old = cells[first + i]
    if (ch === 'x') {
      sounding = true
      cells[first + i] = { state: 'hit', override: old.state === 'hit' ? old.override : undefined }
    } else {
      cells[first + i] = { state: sounding ? 'hold' : 'rest' }
    }
  })
  return fromCells(cells)
}
