// The auto-speller: the editor's view of each beat, derived from the bars, and writing a beat
// back by re-spelling the bars. The drummer never chooses note values, rests, dots or ties.

import type { Figure } from './figures'
import { figureOfHits, isTripletHits } from './figures'
import type { Bar, Hand, Item } from './model'
import { BEATS_PER_BAR, TICKS_PER_BAR, TICKS_PER_BEAT, itemTicks } from './model'

/** What the grid editor shows for one beat. */
export interface BeatView {
  /** Undefined only for a beat no figure can write. */
  figure: Figure | undefined
  hits: string
  /** The beat's first note continues the previous beat's last note rather than being struck. */
  tiedInto: boolean
}

/** One tick of the timeline: a struck note, a note still sounding, or silence. */
type Cell = { state: 'hit'; override?: Hand } | { state: 'hold' } | { state: 'rest' }

/** The bars as a timeline: one cell per tick, and which beats are triplet groups. */
interface Timeline {
  cells: Cell[]
  triplet: boolean[]
}

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

function toTimeline(bars: readonly Bar[]): Timeline {
  const cells: Cell[] = []
  const triplet = Array.from({ length: bars.length * BEATS_PER_BAR }, () => false)
  const placed = placeItems(bars)
  const at = (p: PlacedItem) => p.bar * TICKS_PER_BAR + p.start
  // A triplet group of rests alone is just a rest beat.
  for (const p of placed) {
    if (p.item.triplet && p.item.kind === 'note') triplet[Math.floor(at(p) / TICKS_PER_BEAT)] = true
  }
  let i = 0
  for (let tick = 0; tick < bars.length * TICKS_PER_BAR; tick++) {
    while (i + 1 < placed.length && at(placed[i + 1]) <= tick) i++
    const p = placed[i]
    if (p.item.kind === 'rest') cells.push({ state: 'rest' })
    else if (at(p) === tick && !p.continuation) cells.push({ state: 'hit', override: p.item.override })
    else cells.push({ state: 'hold' })
  }
  return { cells, triplet }
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

type Value = Pick<Item, 'duration' | 'dotted'>

const SPELLINGS: readonly [ticks: number, Value][] = [
  [18, { duration: 'quarter', dotted: true }],
  [12, { duration: 'quarter', dotted: false }],
  [9, { duration: 'eighth', dotted: true }],
  [6, { duration: 'eighth', dotted: false }],
  [3, { duration: 'sixteenth', dotted: false }],
]

/** Inside a triplet group: a triplet quarter (two slots) or a triplet eighth (one). */
const TRIPLET_SPELLINGS: readonly [ticks: number, Value][] = [
  [8, { duration: 'quarter', dotted: false }],
  [4, { duration: 'eighth', dotted: false }],
]

/** The longest legal values, one after another, from `start` up to `end`. */
function spell(start: number, end: number, rest: boolean, triplet: boolean) {
  const out: { start: number; value: Value & Pick<Item, 'triplet'> }[] = []
  while (start < end) {
    const [ticks, value] = triplet
      ? TRIPLET_SPELLINGS.find(([t]) => start + t <= end)!
      : SPELLINGS.find(([t]) => start + t <= end && fits(start, t, rest))!
    out.push({ start, value: { ...value, triplet } })
    start += ticks
  }
  return out
}

function fromTimeline({ cells, triplet }: Timeline): Bar[] {
  // Runs of sound or silence over the whole timeline, in ticks.
  type Segment = { note: boolean; start: number; end: number; override?: Hand }
  const segments: Segment[] = []
  cells.forEach((cell, start) => {
    const last = segments.at(-1)
    const note = cell.state !== 'rest'
    // A hold with no note sounding before it has nothing to continue, so it is struck.
    if (cell.state === 'hit' || (note && !last?.note)) {
      segments.push({ note: true, start, end: start + 1, override: cell.state === 'hit' ? cell.override : undefined })
    } else if (last && last.note === note) last.end++
    else segments.push({ note: false, start, end: start + 1 })
  })

  const tripletAt = (tick: number) => triplet[Math.floor(tick / TICKS_PER_BEAT)] ?? false
  // A note is cut at bar lines (and tied across) and at a triplet group's edges, where this beat or
  // the one before it is a triplet group; a rest at every beat.
  const cutsAt = (beatStart: number, note: boolean) =>
    !note || beatStart % TICKS_PER_BAR === 0 || tripletAt(beatStart) || tripletAt(beatStart - TICKS_PER_BEAT)

  const bars: Bar[] = Array.from({ length: cells.length / TICKS_PER_BAR }, () => ({ items: [] }))
  for (const seg of segments) {
    const cuts = [seg.start]
    for (let t = (Math.floor(seg.start / TICKS_PER_BEAT) + 1) * TICKS_PER_BEAT; t < seg.end; t += TICKS_PER_BEAT) {
      if (cutsAt(t, seg.note)) cuts.push(t)
    }
    cuts.push(seg.end)
    const pieces = cuts.slice(1).flatMap((end, i) => spell(cuts[i], end, !seg.note, tripletAt(cuts[i])))
    pieces.forEach((piece, i) => {
      const item: Item = seg.note
        ? {
            kind: 'note',
            ...piece.value,
            tiedToNext: i < pieces.length - 1,
            ...(i === 0 && seg.override ? { override: seg.override } : {}),
          }
        : { kind: 'rest', ...piece.value }
      bars[Math.floor(piece.start / TICKS_PER_BAR)].items.push(item)
    })
  }
  return bars
}

/** The ticks within a beat where a figure's characters fall: sixteenths, or triplet eighths. */
function slotTicks(triplet: boolean): number[] {
  return triplet ? [0, 4, 8] : [0, 3, 6, 9]
}

function hitsOf({ cells, triplet }: Timeline, beat: number): string {
  const first = beat * TICKS_PER_BEAT
  return slotTicks(triplet[beat])
    .map((t, i) => {
      const cell = cells[first + t]
      return cell.state === 'hit' || (i === 0 && cell.state === 'hold') ? 'x' : '.'
    })
    .join('')
}

/** Each bar's four beats as the grid editor sees them. */
export function beatViews(bars: readonly Bar[]): BeatView[][] {
  const timeline = toTimeline(bars)
  return bars.map((_, b) =>
    Array.from({ length: BEATS_PER_BAR }, (_, beat) => {
      const index = b * BEATS_PER_BAR + beat
      const hits = hitsOf(timeline, index)
      return { figure: figureOfHits(hits), hits, tiedInto: timeline.cells[index * TICKS_PER_BEAT].state === 'hold' }
    }),
  )
}

/**
 * Writes a figure's hits into one beat and re-spells the bars. Three characters make the beat a
 * triplet group, four a straight beat. A hit that lands where a note already started keeps that
 * note's sticking override, and a tie into the beat is kept if the figure starts with a hit.
 */
export function setBeat(bars: readonly Bar[], bar: number, beat: number, hits: string): Bar[] {
  const timeline = toTimeline(bars)
  const { cells } = timeline
  const index = bar * BEATS_PER_BAR + beat
  const first = index * TICKS_PER_BEAT
  const triplet = isTripletHits(hits)
  timeline.triplet[index] = triplet
  const hitTicks = new Set(slotTicks(triplet).filter((_, i) => hits[i] === 'x'))
  let sounding = false
  for (let t = 0; t < TICKS_PER_BEAT; t++) {
    const old = cells[first + t]
    if (t === 0 && hitTicks.has(t) && old.state === 'hold') {
      // A beat that was tied into stays tied when the new figure starts with a hit.
      sounding = true
    } else if (hitTicks.has(t)) {
      sounding = true
      cells[first + t] = { state: 'hit', override: old.state === 'hit' ? old.override : undefined }
    } else {
      cells[first + t] = { state: sounding ? 'hold' : 'rest' }
    }
  }
  return fromTimeline(timeline)
}

/**
 * Ties the beat's first note to the previous beat's last note, or unties it. A tie needs the beat
 * to start with a hit and the previous beat to end with a note; otherwise the bars are returned
 * unchanged.
 */
export function toggleTie(bars: readonly Bar[], bar: number, beat: number): Bar[] {
  const timeline = toTimeline(bars)
  const first = (bar * BEATS_PER_BAR + beat) * TICKS_PER_BEAT
  const cell = timeline.cells[first]
  if (cell.state === 'hold') timeline.cells[first] = { state: 'hit' }
  else if (cell.state === 'hit' && first > 0 && timeline.cells[first - 1].state !== 'rest') {
    timeline.cells[first] = { state: 'hold' }
  } else return [...bars]
  return fromTimeline(timeline)
}
