// The exercise model: what an exercise contains and how it is practised.

/** Exercises are in 4/4. */
export const BEATS_PER_BAR = 4

/** Ticks are derived, never stored: 12 per beat fits both the sixteenth and the triplet grid. */
export const TICKS_PER_BEAT = 12

export const TICKS_PER_BAR = BEATS_PER_BAR * TICKS_PER_BEAT

export const MIN_BPM = 30
export const MAX_BPM = 300

/** Bumped whenever the stored shape changes; storage and import migrate through it. */
export const SCHEMA_VERSION = 1

export type Hand = 'R' | 'L'
export type Voice = 'snare' | 'bass'
export type StickingMode = 'natural' | 'alternate' | 'off'
export type Duration = 'quarter' | 'eighth' | 'sixteenth'

/** The groove presets arrive in a later ticket; until then the groove layer is always off. */
export type GroovePresetId = 'off'

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

/** One measure: items in order, adding up to four beats. */
export interface Bar {
  items: Item[]
}

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
  voice: Voice
  sticking: StickingMode
  leadHand: Hand
  practice: PracticeSettings
  /** Epoch milliseconds. */
  lastOpened: number
}

/** Settings kept per device rather than per exercise, and never exported. */
export interface DeviceSettings {
  countIn: boolean
  /** The exercise open when the app was last used, reopened at launch. */
  lastOpenedId: string | null
}

export const DEFAULT_DEVICE_SETTINGS: DeviceSettings = { countIn: true, lastOpenedId: null }

const BASE_TICKS: Record<Duration, number> = { quarter: 12, eighth: 6, sixteenth: 3 }

/** How many ticks an item lasts. */
export function itemTicks(item: Item): number {
  const ticks = BASE_TICKS[item.duration] * (item.dotted ? 1.5 : 1)
  return item.triplet ? (ticks * 2) / 3 : ticks
}

export function restBar(): Bar {
  return {
    items: Array.from({ length: BEATS_PER_BAR }, () => ({
      kind: 'rest',
      duration: 'quarter',
      dotted: false,
      triplet: false,
    })),
  }
}

/** A new exercise always starts from the same fixed defaults. */
export function newExercise({ id, now }: { id: string; now: number }): Exercise {
  return {
    id,
    name: 'Untitled',
    schemaVersion: SCHEMA_VERSION,
    bars: [restBar()],
    voice: 'snare',
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

/** The exercise with a new loop range; `null` loops the whole exercise. */
export function withLoopRange(exercise: Exercise, loopRange: LoopRange | null): Exercise {
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

/** The exercise with its loop range kept inside its bars, as it was if it already is. */
export function withLoopRangeKept(exercise: Exercise): Exercise {
  const range = exercise.practice.loopRange
  if (!range || range.last < exercise.bars.length) return exercise
  return withLoopRange(exercise, loopBars(range, exercise.bars.length))
}
