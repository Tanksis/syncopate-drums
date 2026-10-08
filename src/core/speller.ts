// The auto-speller: the editor's view of each beat, derived from the bars, and writing a beat
// back by re-spelling the bars. The drummer never chooses note values, rests, dots or ties.
// Each row (snare and kick) is spelled on its own, but a beat's grid is shared by both (ADR 0005).

import type { Figure } from './figures'
import { figureOfHits, isTripletHits } from './figures'
import type { Bar, Hand, Item, Row } from './model'
import { BEATS_PER_BAR, ROWS, TICKS_PER_BAR, TICKS_PER_BEAT, beatIndex, itemTicks } from './model'

/** What the grid editor shows for one beat: its grid, shared by both rows, and each row on it. */
export type BeatView = {
  /** On the triplet grid (three triplet eighths) rather than the sixteenth grid (four sixteenths). */
  triplet: boolean
} & Record<Row, RowView>

/** One row of a beat as the grid editor shows it, on the beat's grid. */
export interface RowView {
  /** Undefined only for a beat no figure can write. */
  figure: Figure | undefined
  hits: string
  /** The beat's first note continues the previous beat's last note rather than being struck. */
  tiedInto: boolean
  /** The beat's last note ends early, with a rest after it. */
  cutShort: boolean
  /** One per grid position of the beat, in order. */
  positions: PositionState[]
}

/**
 * A grid position: a note struck there, a note still sounding there (including a tied
 * continuation on the downbeat), or silence.
 */
export type PositionState = 'hit' | 'hold' | 'empty'

/** One tick of the timeline: a struck note, a note still sounding, or silence. */
type Cell = { state: 'hit'; override?: Hand } | { state: 'hold' } | { state: 'rest' }

/** One row's items, bar by bar. */
type Line = readonly (readonly Item[])[]

const lineOf = (bars: readonly Bar[], row: Row): Line => bars.map((bar) => bar[row])

/** The bars with one row's items replaced. */
const withLine = (bars: readonly Bar[], row: Row, line: Item[][]): Bar[] => bars.map((bar, b) => ({ ...bar, [row]: line[b] }))

const otherRow = (row: Row): Row => (row === 'snare' ? 'kick' : 'snare')

/** One row of the bars as a timeline: one cell per tick, and which beats are triplet groups. */
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

/** One row's items, each placed in its bar. */
export function placeItems(bars: readonly Bar[], row: Row): PlacedItem[] {
  return placeLine(lineOf(bars, row))
}

function placeLine(line: Line): PlacedItem[] {
  const placed: PlacedItem[] = []
  let previous: Item | undefined
  line.forEach((items, b) => {
    let start = 0
    for (const item of items) {
      const continuation = item.kind === 'note' && previous?.kind === 'note' && previous.tiedToNext
      placed.push({ item, bar: b, start, continuation })
      start += itemTicks(item)
      previous = item
    }
  })
  return placed
}

function toTimeline(line: Line): Timeline {
  const cells: Cell[] = []
  const triplet = Array.from({ length: line.length * BEATS_PER_BAR }, () => false)
  const placed = placeLine(line)
  const at = (p: PlacedItem) => p.bar * TICKS_PER_BAR + p.start
  // A triplet group of rests alone is just a rest beat.
  for (const p of placed) {
    if (p.item.triplet && p.item.kind === 'note') triplet[Math.floor(at(p) / TICKS_PER_BEAT)] = true
  }
  let i = 0
  for (let tick = 0; tick < line.length * TICKS_PER_BAR; tick++) {
    while (i + 1 < placed.length && at(placed[i + 1]) <= tick) i++
    const p = placed[i]
    if (p.item.kind === 'rest') cells.push({ state: 'rest' })
    else if (at(p) === tick && !p.continuation) cells.push({ state: 'hit', override: p.item.override })
    else cells.push({ state: 'hold' })
  }
  return { cells, triplet }
}

/**
 * Reads the given beats (indices across the exercise, bar × 4 + beat) on the triplet grid whatever
 * their notes say. Indices outside the exercise are ignored.
 */
function readAsTriplets(timeline: Timeline, tripletBeats: readonly number[]): void {
  for (const index of tripletBeats) if (index >= 0 && index < timeline.triplet.length) timeline.triplet[index] = true
}

/** The beats (indices across the exercise) a row writes as triplet groups. */
function tripletBeatsOf({ triplet }: Timeline): number[] {
  return triplet.flatMap((t, index) => (t ? [index] : []))
}

/** The beats the other row writes as triplet groups, whose grid this row's beats share. */
function sharedTripletBeats(bars: readonly Bar[], row: Row): number[] {
  return tripletBeatsOf(toTimeline(lineOf(bars, otherRow(row))))
}

/**
 * Whether a row's beat reads the same on either grid: silent throughout, or one note sounding
 * throughout with nothing struck off the downbeat.
 */
function readsOnEitherGrid(timeline: Timeline, index: number): boolean {
  const [first, ...rest] = beatCells(timeline, index)
  return rest.every((c) => c.state === (first.state === 'rest' ? 'rest' : 'hold'))
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

/** A note value (or rest) spelled at a tick of the whole exercise. */
export interface SpelledPiece {
  start: number
  value: Value & Pick<Item, 'triplet'>
}

/**
 * Spells one note held (or one silence) from `start` to `end`, ticks of the whole exercise, as
 * the values written one after another, tied for a note. A note is cut at bar lines (and tied
 * across) and at a triplet group's edges, where this beat or the one before it is a triplet group;
 * a rest at every beat. `triplet` says which beats of the exercise are triplet groups.
 */
export function spellSpan(start: number, end: number, note: boolean, triplet: readonly boolean[]): SpelledPiece[] {
  const tripletAt = (tick: number) => triplet[Math.floor(tick / TICKS_PER_BEAT)] ?? false
  const cutsAt = (beatStart: number) =>
    !note || beatStart % TICKS_PER_BAR === 0 || tripletAt(beatStart) || tripletAt(beatStart - TICKS_PER_BEAT)
  const cuts = [start]
  for (let t = (Math.floor(start / TICKS_PER_BEAT) + 1) * TICKS_PER_BEAT; t < end; t += TICKS_PER_BEAT) {
    if (cutsAt(t)) cuts.push(t)
  }
  cuts.push(end)
  return cuts.slice(1).flatMap((to, i) => spell(cuts[i], to, !note, tripletAt(cuts[i])))
}

function fromTimeline({ cells, triplet }: Timeline): Item[][] {
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

  const bars: Item[][] = Array.from({ length: cells.length / TICKS_PER_BAR }, () => [])
  for (const seg of segments) {
    const pieces = spellSpan(seg.start, seg.end, seg.note, triplet)
    pieces.forEach((piece, i) => {
      const item: Item = seg.note
        ? {
            kind: 'note',
            ...piece.value,
            tiedToNext: i < pieces.length - 1,
            ...(i === 0 && seg.override ? { override: seg.override } : {}),
          }
        : { kind: 'rest', ...piece.value }
      bars[Math.floor(piece.start / TICKS_PER_BAR)].push(item)
    })
  }
  return bars
}

/** The ticks within a beat where a figure's characters fall: sixteenths, or triplet eighths. */
function slotTicks(triplet: boolean): number[] {
  return triplet ? [0, 4, 8] : [0, 3, 6, 9]
}

function beatCells({ cells }: Timeline, beat: number): Cell[] {
  return cells.slice(beat * TICKS_PER_BEAT, (beat + 1) * TICKS_PER_BEAT)
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

/**
 * Do the beat's holds read as its figure's defaults? Every note holds on to the next hit, and the
 * last to the end of the beat, or (cut short) for an eighth on 1 or &, a sixteenth elsewhere, or a
 * triplet eighth.
 */
function hasDefaultHolds(timeline: Timeline, beat: number, hits: string): boolean {
  const cells = beatCells(timeline, beat)
  const triplet = timeline.triplet[beat]
  const hitTicks = slotTicks(triplet).filter((_, i) => hits[i] === 'x')
  const sounds = (end: number) => cells.map((_, t) => t >= hitTicks[0] && t < end)
  const matches = (sounding: boolean[]) => cells.every((cell, t) => (cell.state !== 'rest') === sounding[t])
  if (hitTicks.length === 0 || matches(sounds(TICKS_PER_BEAT))) return true
  const last = hitTicks.at(-1)!
  return matches(sounds(last + (triplet ? TRIPLET_EIGHTH : last % EIGHTH === 0 ? EIGHTH : SIXTEENTH)))
}

const POSITION_OF: Record<Cell['state'], PositionState> = { hit: 'hit', hold: 'hold', rest: 'empty' }

/**
 * Each bar's four beats as the grid editor sees them. A beat is on the triplet grid where either
 * row writes it as a triplet group, and both rows are read on that grid. `tripletBeats` (beat
 * indices across the exercise, bar × 4 + beat) are read on the triplet grid whatever their notes
 * say: the editor's pending grid, for beats that read the same on either grid.
 */
export function beatViews(bars: readonly Bar[], tripletBeats: readonly number[] = []): BeatView[][] {
  const timelines = ROWS.map((row) => toTimeline(lineOf(bars, row)))
  const shared = [...tripletBeats, ...timelines.flatMap(tripletBeatsOf)]
  for (const timeline of timelines) readAsTriplets(timeline, shared)
  const [snare, kick] = timelines
  return bars.map((_, b) =>
    Array.from({ length: BEATS_PER_BAR }, (_, beat) => {
      const index = beatIndex(b, beat)
      return { triplet: snare.triplet[index], snare: rowView(snare, index), kick: rowView(kick, index) }
    }),
  )
}

function rowView(timeline: Timeline, index: number): RowView {
  const hits = hitsOf(timeline, index)
  const cells = beatCells(timeline, index)
  return {
    figure: hasDefaultHolds(timeline, index, hits) ? figureOfHits(hits) : undefined,
    hits,
    tiedInto: cells[0].state === 'hold',
    cutShort: cells.at(-1)!.state === 'rest' && cells.some((c) => c.state !== 'rest'),
    positions: slotTicks(timeline.triplet[index]).map((t) => POSITION_OF[cells[t].state]),
  }
}

/**
 * Writes a figure's hits into one beat of a row and re-spells the bars. Three characters make the
 * beat a triplet group, four a straight beat. A hit that lands where a note already started keeps
 * that note's sticking override, and a tie into the beat is kept if the figure starts with a hit.
 * Where the figure puts the beat on the other grid from the other row's, the other row's beat is
 * cleared to its downbeat, as a grid switch does: a beat never mixes grids.
 */
export function setBeat(bars: readonly Bar[], row: Row, bar: number, beat: number, hits: string): Bar[] {
  const timeline = toTimeline(lineOf(bars, row))
  const { cells } = timeline
  const index = beatIndex(bar, beat)
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
  const written = withLine(bars, row, fromTimeline(timeline))
  const other = toTimeline(lineOf(written, otherRow(row)))
  const clash = !readsOnEitherGrid(timeline, index) && !readsOnEitherGrid(other, index) && other.triplet[index] !== triplet
  return clash ? clearRowToDownbeat(written, otherRow(row), bar, beat) : written
}

/**
 * Turns a hit on or off at one grid position of a beat in a row (on the beat's grid) and re-spells
 * the bars.
 *
 * - A hit on an empty position holds until the next hit or the end of the beat.
 * - A hit inside a note's hold (a tied-into downbeat among them) splits it: the earlier note stops
 *   there and the new one takes the rest of the hold.
 * - Removing a hit that the previous note ran right up to lets that note hold on through the
 *   removed note's span; otherwise the span (with any tied continuation) becomes empty. A downbeat
 *   is never held on into from the beat before, so a tie never points at a rest.
 *
 * A removed note's sticking override goes with it. Off the grid, the same bars are returned.
 *
 * `triplet` picks the grid to click on, by default the beat's own, which both rows share. A triplet
 * beat left with no hit off the downbeat reads the same on either grid, so it is written as a
 * plain beat.
 */
export function toggleHit(bars: Bar[], row: Row, bar: number, beat: number, position: number, triplet?: boolean): Bar[] {
  const timeline = toTimeline(lineOf(bars, row))
  const { cells } = timeline
  const index = beatIndex(bar, beat)
  if (index >= timeline.triplet.length) return bars
  const onTriplets = triplet ?? (timeline.triplet[index] || sharedTripletBeats(bars, row).includes(index))
  const offset = slotTicks(onTriplets)[position]
  if (offset === undefined) return bars
  timeline.triplet[index] = onTriplets
  const first = index * TICKS_PER_BEAT
  const tick = first + offset
  if (cells[tick].state === 'hit') {
    const state = offset > 0 && cells[tick - 1].state !== 'rest' ? 'hold' : 'rest'
    cells[tick] = { state }
    for (let t = tick + 1; t < cells.length && cells[t].state === 'hold'; t++) cells[t] = { state }
  } else {
    cells[tick] = { state: 'hit' }
    for (let t = tick + 1; t < first + TICKS_PER_BEAT && cells[t].state === 'rest'; t++) cells[t] = { state: 'hold' }
  }
  if (onTriplets) timeline.triplet[index] = hitsOf(timeline, index).slice(1).includes('x')
  return withLine(bars, row, fromTimeline(timeline))
}

/** A grid position of one beat in a row: bar, beat in the bar, and position on the beat's grid (from 0). */
export interface GridPoint {
  row: Row
  bar: number
  beat: number
  position: number
}

/**
 * Sets where a note's hold ends and re-spells the bars. `from` is any grid position the note sounds
 * at (its hit or its hold); `to` is the grid position the hold stops at, which is not held. A `to`
 * one past the beat's last position is the end of the beat. The note holds on through every
 * position before `to`; positions it no longer reaches become empty, spelled as rests.
 *
 * `to` may be in a later beat or bar, on that beat's own grid: the beats the hold reaches become
 * tied continuations (not struck), and shortening it back past a beat line removes the tie. The
 * hold stops before the next hit. A `from` with no note, or a hold of no length, returns the same
 * bars, as does a hold that already ends there.
 *
 * The hold is in `from`'s row, and `to` is read in that row. Beats the other row writes as triplet
 * groups are read on the triplet grid, and so are `tripletBeats` (beat indices across the exercise,
 * bar × 4 + beat) whatever their notes say: the editor's pending grid. A triplet beat the change
 * leaves with no hit off the downbeat and sounding to its end reads the same on either grid, so it
 * is written as a plain beat.
 */
export function setHold(bars: Bar[], from: GridPoint, to: GridPoint, tripletBeats: readonly number[] = []): Bar[] {
  const { row } = from
  const timeline = toTimeline(lineOf(bars, row))
  const { cells } = timeline
  const written = [...timeline.triplet]
  readAsTriplets(timeline, [...tripletBeats, ...sharedTripletBeats(bars, row)])
  const tickOf = ({ bar, beat, position }: GridPoint, allowEnd: boolean) => {
    const index = beatIndex(bar, beat)
    if (beat < 0 || beat >= BEATS_PER_BAR || index < 0 || index >= timeline.triplet.length) return undefined
    const slots = slotTicks(timeline.triplet[index])
    if (allowEnd && position === slots.length) return (index + 1) * TICKS_PER_BEAT
    const offset = slots[position]
    return offset === undefined ? undefined : index * TICKS_PER_BEAT + offset
  }
  const pressed = tickOf(from, false)
  const target = tickOf(to, true)
  if (pressed === undefined || target === undefined || cells[pressed].state === 'rest') return bars
  // The note's start: back over its hold to its hit, or to where its sound begins.
  let start = pressed
  while (cells[start].state === 'hold' && start > 0 && cells[start - 1].state !== 'rest') start--
  let end = start + 1
  while (end < cells.length && cells[end].state === 'hold') end++
  // No further than the next hit.
  let limit = end
  while (limit < cells.length && cells[limit].state === 'rest') limit++
  const stop = Math.min(target, limit)
  if (stop <= start || stop === end) return bars
  const changedEnd = Math.max(stop, end)
  for (let t = start + 1; t < changedEnd; t++) cells[t] = { state: t < stop ? 'hold' : 'rest' }
  // Beats the hold doesn't reach keep the grid they are written on; the ones it does reach stay
  // triplet groups only where that grid still shows.
  const firstBeat = Math.floor(start / TICKS_PER_BEAT)
  const lastBeat = Math.floor((changedEnd - 1) / TICKS_PER_BEAT)
  timeline.triplet.forEach((triplet, index) => {
    if (index < firstBeat || index > lastBeat) timeline.triplet[index] = written[index]
    else if (triplet) {
      const beat = beatCells(timeline, index)
      const offBeat = hitsOf(timeline, index).slice(1).includes('x')
      const silent = beat.every((c) => c.state === 'rest')
      timeline.triplet[index] = !silent && (offBeat || beat.at(-1)!.state === 'rest')
    }
  })
  return withLine(bars, row, fromTimeline(timeline))
}

/**
 * Clears a beat in both rows for a switch between the sixteenth and the triplet grid. Only the
 * downbeat is on both, so in each row a note on the downbeat (struck, or tied into the beat) is
 * kept and holds to the end of the beat, and the other positions are cleared. With nothing off the
 * downbeat the beat reads the same on either grid, so it is written as a plain beat: the grid it's
 * on is the editor's to remember.
 */
export function clearBeatToDownbeat(bars: readonly Bar[], bar: number, beat: number): Bar[] {
  return ROWS.reduce((cleared, row) => clearRowToDownbeat(cleared, row, bar, beat), [...bars])
}

function clearRowToDownbeat(bars: readonly Bar[], row: Row, bar: number, beat: number): Bar[] {
  const downbeat = hitsOf(toTimeline(lineOf(bars, row)), beatIndex(bar, beat))[0] === 'x'
  return setBeat(bars, row, bar, beat, downbeat ? 'x...' : '....')
}

/**
 * Ties the beat's first note in a row to the previous beat's last note, or unties it. A tie needs
 * the beat to start with a hit and the previous beat to end with a note; otherwise the same bars
 * are returned.
 */
export function toggleTie(bars: Bar[], row: Row, bar: number, beat: number): Bar[] {
  const timeline = toTimeline(lineOf(bars, row))
  const first = beatIndex(bar, beat) * TICKS_PER_BEAT
  const cell = timeline.cells[first]
  if (cell.state === 'hold') timeline.cells[first] = { state: 'hit' }
  else if (cell.state === 'hit' && first > 0 && timeline.cells[first - 1].state !== 'rest') {
    timeline.cells[first] = { state: 'hold' }
  } else return bars
  return withLine(bars, row, fromTimeline(timeline))
}

const EIGHTH = 6
const SIXTEENTH = 3
const TRIPLET_EIGHTH = 4

/**
 * Cuts the beat's last note in a row short, or lets it ring to the end of the beat again. Cut
 * short, the note lasts an eighth if it starts on 1 or & of a straight beat, a sixteenth otherwise,
 * and one triplet eighth in a triplet beat (on the grid the beat shares with the other row), with a
 * rest after it. A note already that short can't be cut, so the same bars are returned.
 */
export function toggleCutShort(bars: Bar[], row: Row, bar: number, beat: number): Bar[] {
  const timeline = toTimeline(lineOf(bars, row))
  const index = beatIndex(bar, beat)
  if (sharedTripletBeats(bars, row).includes(index)) timeline.triplet[index] = true
  const first = index * TICKS_PER_BEAT
  const { cells } = timeline
  let lastSounding = TICKS_PER_BEAT - 1
  while (lastSounding >= 0 && cells[first + lastSounding].state === 'rest') lastSounding--
  if (lastSounding < 0) return bars
  if (lastSounding < TICKS_PER_BEAT - 1) {
    for (let t = lastSounding + 1; t < TICKS_PER_BEAT; t++) cells[first + t] = { state: 'hold' }
  } else {
    const triplet = timeline.triplet[index]
    const hits = hitsOf(timeline, index)
    const start = slotTicks(triplet)[hits.lastIndexOf('x')]
    const end = start + (triplet ? TRIPLET_EIGHTH : start % EIGHTH === 0 ? EIGHTH : SIXTEENTH)
    if (end >= TICKS_PER_BEAT) return bars
    for (let t = end; t < TICKS_PER_BEAT; t++) cells[first + t] = { state: 'rest' }
  }
  // Rung on to its end again, a beat that reads the same on either grid is written as a plain beat.
  if (readsOnEitherGrid(timeline, index)) timeline.triplet[index] = false
  return withLine(bars, row, fromTimeline(timeline))
}
