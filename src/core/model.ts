// The exercise model: what an exercise contains and how it is practised.

/** Exercises are in 4/4. */
export const BEATS_PER_BAR = 4

/** Ticks are derived, never stored: 12 per beat fits both the sixteenth and the triplet grid. */
export const TICKS_PER_BEAT = 12

export const TICKS_PER_BAR = BEATS_PER_BAR * TICKS_PER_BEAT

/** A beat's index across the whole exercise: bar × 4 + beat. */
export function beatIndex(bar: number, beat: number): number {
  return bar * BEATS_PER_BAR + beat
}

export const MIN_BPM = 30
export const MAX_BPM = 300

/** Swing amounts, as the first eighth's share of the beat: 0.5 is straight. */
export const MIN_SWING = 0.5
export const MAX_SWING = 0.75

/** Bumped whenever the stored shape changes; storage and import migrate through it. */
export const SCHEMA_VERSION = 2

export type Hand = 'R' | 'L'

/** An exercise's two rhythms over the same bars: the snare row on top, the kick row under it (ADR 0005). */
export type Row = 'snare' | 'kick'

export const ROWS: readonly Row[] = ['snare', 'kick']

/** A limb of the drummer, and the part of the staff it plays: hands stems up, feet stems down. */
export type Limb = 'hands' | 'feet'

/** The limb that plays each row: the snare row with the hands, the kick row with the feet. */
export const ROW_LIMB: Record<Row, Limb> = { snare: 'hands', kick: 'feet' }

/**
 * A struck note's id: `bar:tick` in the snare row, which sticking overrides are keyed by, and
 * `kick:bar:tick` in the kick row.
 */
export function noteId(row: Row, bar: number, tick: number): string {
  return row === 'snare' ? `${bar}:${tick}` : `${row}:${bar}:${tick}`
}
export type StickingMode = 'natural' | 'alternate' | 'off'
export type Duration = 'quarter' | 'eighth' | 'sixteenth'

/** The groove layer under the exercise, or none; the presets themselves are in `groove.ts`. */
export type GroovePresetId = 'off' | 'jazz' | 'jazzFeathered' | 'hihatEighths'

interface ItemBase {
  duration: Duration
  dotted: boolean
  /** Part of the triplet group that fills this item's beat. */
  triplet: boolean
}

export interface Note extends ItemBase {
  kind: 'note'
  /** Held into the next item, which is then a tied continuation rather than a new note. */
  tiedToNext: boolean
  override?: Hand
}

export interface Rest extends ItemBase {
  kind: 'rest'
}

export type Item = Note | Rest

/** One measure: each row's items in order, each row adding up to four beats. */
export type Bar = Record<Row, Item[]>

/** First and last bar index, inclusive. */
export interface LoopRange {
  first: number
  last: number
}

/** The bars that loop: the loop range kept inside the exercise, or else every bar. */
export function loopBars(range: LoopRange | null, barCount: number): LoopRange {
  const end = barCount - 1
  if (!range) return { first: 0, last: end }
  const last = Math.min(range.last, end)
  return { first: Math.min(range.first, last), last }
}

export interface PracticeSettings {
  bpm: number
  loopRange: LoopRange | null
  groove: GroovePresetId
  /** The first eighth's share of the beat: 0.5 is straight, 2/3 is triplet swing. */
  swing: number
}

export interface Exercise {
  id: string
  name: string
  schemaVersion: number
  bars: Bar[]
  sticking: StickingMode
  leadHand: Hand
  practice: PracticeSettings
  /** Epoch milliseconds. */
  lastOpened: number
}

/** Settings kept per device rather than per exercise, and never exported. */
export interface DeviceSettings {
  countIn: boolean
  /** The click's volume, from 0 (silent) to MAX_VOLUME; 1 is its usual level. */
  clickVolume: number
  /** The exercise's volume, as for the click. */
  exerciseVolume: number
  /** The groove layer's volume, as for the click. */
  grooveVolume: number
  /** Silences the exercise, so the drummer can play the line over the click and the groove. */
  exerciseMuted: boolean
  /** The grid editor's vim keys: Normal mode and its commands. Off, there's no Normal mode. */
  vimKeys: boolean
  /** The grid editor's "Figures" panel of palette tiles is open. */
  figuresPanelOpen: boolean
  /** The exercise open when the app was last used, reopened at launch. */
  lastOpenedId: string | null
}

export const DEFAULT_DEVICE_SETTINGS: DeviceSettings = {
  countIn: true,
  clickVolume: 1,
  exerciseVolume: 1,
  grooveVolume: 1,
  exerciseMuted: false,
  vimKeys: true,
  figuresPanelOpen: false,
  lastOpenedId: null,
}

/** The device settings that are a playback layer's volume. */
export type VolumeSetting = 'clickVolume' | 'exerciseVolume' | 'grooveVolume'

/** The loudest a layer's volume goes: a little headroom above its usual level. */
export const MAX_VOLUME = 1.5

const BASE_TICKS: Record<Duration, number> = { quarter: 12, eighth: 6, sixteenth: 3 }

/** How many ticks an item (or any value of a duration, dotted or not, triplet or not) lasts. */
export function itemTicks(item: Pick<Item, 'duration' | 'dotted' | 'triplet'>): number {
  const ticks = BASE_TICKS[item.duration] * (item.dotted ? 1.5 : 1)
  return item.triplet ? (ticks * 2) / 3 : ticks
}

/** A row's four beats of quarter rests. */
export function restItems(): Item[] {
  return Array.from({ length: BEATS_PER_BAR }, () => ({ kind: 'rest', duration: 'quarter', dotted: false, triplet: false }))
}

export function restBar(): Bar {
  return { snare: restItems(), kick: restItems() }
}

/** A new exercise always starts from the same fixed defaults. */
export function newExercise({ id, now }: { id: string; now: number }): Exercise {
  return {
    id,
    name: 'Untitled',
    schemaVersion: SCHEMA_VERSION,
    bars: [restBar()],
    sticking: 'natural',
    leadHand: 'R',
    practice: { bpm: 80, loopRange: null, groove: 'off', swing: 2 / 3 },
    lastOpened: now,
  }
}

/** Keeps a typed or dragged tempo inside the supported 30–300 BPM range, as a whole number. */
export function clampBpm(bpm: number): number {
  if (Number.isNaN(bpm)) return MIN_BPM
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)))
}

/** The exercise at a new tempo, kept inside the supported range. */
export function withBpm(exercise: Exercise, bpm: number): Exercise {
  return { ...exercise, practice: { ...exercise.practice, bpm: clampBpm(bpm) } }
}

/** Keeps a swing amount inside the supported 50–75% range. */
export function clampSwing(swing: number): number {
  if (Number.isNaN(swing)) return MIN_SWING
  return Math.min(MAX_SWING, Math.max(MIN_SWING, swing))
}

/** The exercise with a new swing amount, kept inside the supported range. */
export function withSwing(exercise: Exercise, swing: number): Exercise {
  return { ...exercise, practice: { ...exercise.practice, swing: clampSwing(swing) } }
}

/** The exercise with a groove preset, as it was if it already has that one. */
export function withGroove(exercise: Exercise, groove: GroovePresetId): Exercise {
  if (groove === exercise.practice.groove) return exercise
  return { ...exercise, practice: { ...exercise.practice, groove } }
}

/** The exercise with a new loop range; `null` loops the whole exercise. */
export function withLoopRange(exercise: Exercise, loopRange: LoopRange | null): Exercise {
  if (loopRange === exercise.practice.loopRange) return exercise
  return { ...exercise, practice: { ...exercise.practice, loopRange } }
}

/**
 * A click on a bar number loops just that bar. With `extend` (Shift+click) the range grows to take
 * the bar in, or loops just that bar when no range is set.
 */
export function loopAt(exercise: Exercise, bar: number, { extend = false } = {}): Exercise {
  const range = exercise.practice.loopRange
  if (!extend || !range) return withLoopRange(exercise, { first: bar, last: bar })
  return withLoopRange(exercise, { first: Math.min(range.first, bar), last: Math.max(range.last, bar) })
}

/** Whether a bar is in a set loop range. */
export function inLoopRange(range: LoopRange | null, bar: number): boolean {
  return range !== null && bar >= range.first && bar <= range.last
}

/** The loop range once `count` bars are inserted before bar `at`: it moves with its bars, or grows. */
export function loopRangeAfterInsert(range: LoopRange | null, at: number, count: number): LoopRange | null {
  if (!range) return null
  const moved = (bar: number) => (bar >= at ? bar + count : bar)
  return sameOrNew(range, moved(range.first), moved(range.last))
}

/**
 * The loop range once bars `first` to `last` are deleted: it moves with its bars, or shrinks. With
 * none of its bars left, the whole exercise loops again.
 */
export function loopRangeAfterDelete(range: LoopRange | null, first: number, last: number): LoopRange | null {
  if (!range) return null
  const count = last - first + 1
  const from = range.first < first ? range.first : Math.max(first, range.first - count)
  const to = range.last < first ? range.last : range.last > last ? range.last - count : first - 1
  return to < from ? null : sameOrNew(range, from, to)
}

/** The range itself when its bars are unchanged, so an unchanged exercise stays the same object. */
const sameOrNew = (range: LoopRange, first: number, last: number): LoopRange =>
  range.first === first && range.last === last ? range : { first, last }

/** The exercise with its loop range kept inside its bars, as it was if it already is. */
export function withLoopRangeInBars(exercise: Exercise): Exercise {
  const range = exercise.practice.loopRange
  if (!range || range.last < exercise.bars.length) return exercise
  return withLoopRange(exercise, loopBars(range, exercise.bars.length))
}
