// The exercise model: what an exercise contains and how it is practised.

import type { MetronomeSettings } from './metronome'
import { DEFAULT_METRONOME_SETTINGS, metronomeSettingsFrom } from './metronome'
import { TICKS_PER_BEAT, clampBpm } from './units'

export { MAX_BPM, MAX_VOLUME, MIN_BPM, TICKS_PER_BEAT, clampBpm } from './units'

/** An exercise's time signature, as written at the start of the staff. */
export type TimeSignature = '4/4' | '3/4' | '2/4' | '6/8' | '12/8'

/** The time signatures, in the order the Time group offers them. */
export const TIME_SIGNATURES: readonly TimeSignature[] = ['4/4', '3/4', '2/4', '6/8', '12/8']

/**
 * What a time signature means for the bar: how many beats it has, each `TICKS_PER_BEAT` long, and
 * whether it is compound time, where a beat is a dotted quarter of three eighths: the triplet
 * grid's three positions, written as eighths (ADR 0015).
 */
export interface Meter {
  beats: number
  compound: boolean
}

const METERS: Record<TimeSignature, Meter> = {
  '4/4': { beats: 4, compound: false },
  '3/4': { beats: 3, compound: false },
  '2/4': { beats: 2, compound: false },
  '6/8': { beats: 2, compound: true },
  '12/8': { beats: 4, compound: true },
}

/** The bar a time signature gives each bar of an exercise. */
export function meter(timeSignature: TimeSignature): Meter {
  return METERS[timeSignature]
}

/** How long a bar of this many beats lasts, in ticks. */
export const barTicks = (beats: number) => beats * TICKS_PER_BEAT

/**
 * How many beats the bars have, read from the first one: every bar of an exercise lasts as long
 * as its time signature's bar.
 */
export function barBeats(bars: readonly Bar[]): number {
  return rowBeats(bars[0]?.snare ?? [])
}

/** How many beats one bar's row of items lasts; an exercise with no bars is taken as 4/4. */
export function rowBeats(items: readonly Item[]): number {
  return items.reduce((ticks, item) => ticks + itemTicks(item), 0) / TICKS_PER_BEAT || 4
}

/** A beat's index across the whole exercise: bar × beats + beat. */
export function beatIndex(bar: number, beat: number, beats: number): number {
  return bar * beats + beat
}

/** Swing amounts, as the first eighth's share of the beat: 0.5 is straight. */
export const MIN_SWING = 0.5
export const MAX_SWING = 0.75
/** Triplet swing: the first eighth takes two thirds of the beat. */
export const TRIPLET_SWING = 2 / 3

/** Bumped whenever the stored shape changes; storage and import migrate through it. */
export const SCHEMA_VERSION = 5

export type Hand = 'R' | 'L'

/** An exercise's two rhythms over the same bars: the snare row on top, the kick row under it (ADR 0005). */
export type Row = 'snare' | 'kick'

export const ROWS: readonly Row[] = ['snare', 'kick']

/** A limb of the drummer, and the part of the staff it plays: hands stems up, feet stems down. */
export type Limb = 'hands' | 'feet'

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

/** The hi-hat foot ostinato played in every bar, or none; with any but off, it replaces a groove's own hi-hat foot (ADR 0010). */
export type HihatFoot = 'off' | 'one' | 'quarters' | 'twoAndFour' | 'ands'

export const HIHAT_FOOT_SETTINGS: readonly HihatFoot[] = ['off', 'one', 'quarters', 'twoAndFour', 'ands']

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

/** One measure: each row's items in order, each row adding up to the time signature's beats. */
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

/** Bar indexes as a drummer counts them, mid-sentence: "bar 2" or "bars 2–3". */
export function barRange(first: number, last: number): string {
  return first === last ? `bar ${first + 1}` : `bars ${first + 1}–${last + 1}`
}

/** The loop range as the header's chip reads it: "All bars", "Bar 2" or "Bars 2–3". */
export function loopLabel(range: LoopRange | null, barCount: number): string {
  if (!range) return 'All bars'
  const { first, last } = loopBars(range, barCount)
  const bars = barRange(first, last)
  return bars[0].toUpperCase() + bars.slice(1)
}

export interface PracticeSettings {
  bpm: number
  loopRange: LoopRange | null
  groove: GroovePresetId
  hihatFoot: HihatFoot
  /** The first eighth's share of the beat: 0.5 is straight, 2/3 is triplet swing. */
  swing: number
}

export interface Exercise {
  id: string
  name: string
  schemaVersion: number
  bars: Bar[]
  /** Every bar has its beats; changed through the editor, so it can be undone. */
  timeSignature: TimeSignature
  sticking: StickingMode
  leadHand: Hand
  practice: PracticeSettings
  /** Epoch milliseconds. */
  lastOpened: number
  /** The Library folder it's filed in, or null for none. */
  folderId: string | null
}

/** A Library folder: one level deep, holding exercises by their `folderId`. */
export interface Folder {
  id: string
  name: string
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
  /** Silences the click, so the drummer can keep time against the exercise or the groove alone. */
  clickMuted: boolean
  /** Silences the groove layer, as for the click. */
  grooveMuted: boolean
  /** The exercise open when the app was last used, reopened at launch. */
  lastOpenedId: string | null
  /** The library sidebar's tab: the drummer's own exercises, or the built-in examples. */
  libraryTab: LibraryTab
  /** The Library folders shown collapsed on this device. */
  collapsedFolderIds: string[]
  /** The library sidebar is open, not a rail, in a wide window. */
  librarySidebarOpen: boolean
  /** The settings sidebar is open, not a rail, in a wide window. */
  settingsSidebarOpen: boolean
  /** The General section at the foot of the desktop's settings sidebar is open, not folded to its heading. */
  settingsSectionOpen: boolean
  /** The grid editor is collapsed to its header, giving the notation the room. */
  editorCollapsed: boolean
  /** Light or dark, or `auto` to follow the device's own setting: the mode (ADR 0013). */
  theme: Theme
  /** How the app looks: a skin of colours, fonts and ornaments over the one layout (ADR 0013). */
  look: Look
  /** The screen showing, reopened at launch: Practice or the Metronome (ADR 0014). */
  screen: Screen
  /** The metronome's own settings, its BPM included: an exercise's tempo is never touched. */
  metronome: MetronomeSettings
  /** The first visit's welcome card has been closed, so it never shows again. */
  welcomeDismissed: boolean
  /** On a desktop, a short exercise grows, onto more lines if need be, to fill the notation card, centred in it. */
  fitNotation: boolean
  /** While an exercise plays, the notation card's corner counts the beats of the bar. */
  beatCount: boolean
}

/** The app's screens, switched in the header. */
export type Screen = 'practice' | 'metronome'

export const SCREENS: readonly Screen[] = ['practice', 'metronome']

/** The colour themes: `auto` follows the device's light or dark setting. */
export type Theme = 'auto' | 'light' | 'dark'

export const THEMES: readonly Theme[] = ['auto', 'light', 'dark']

/** The looks, in the order the Theme menu lists them; Warm is the default. */
export type Look = 'warm' | 'studio'

export const LOOKS: readonly Look[] = ['warm', 'studio']

/** The mode drawn: the setting, with `auto` resolved by the device's. */
export function drawnMode(theme: Theme, systemDark: boolean): 'light' | 'dark' {
  return theme === 'auto' ? (systemDark ? 'dark' : 'light') : theme
}

/**
 * Device settings as stored, over the defaults for any added since. A stored setting the app no
 * longer has (such as `vimKeys`, ADR 0009), a theme, look or screen it doesn't have, or a yes-or-no
 * setting that isn't a boolean, is dropped.
 * The metronome is filled in setting by setting (see `metronomeSettingsFrom`).
 */
export function deviceSettingsFrom(stored: Record<string, unknown> | undefined): DeviceSettings {
  const known = Object.entries(stored ?? {}).filter(
    ([key, value]) =>
      key in DEFAULT_DEVICE_SETTINGS &&
      (typeof DEFAULT_DEVICE_SETTINGS[key as keyof DeviceSettings] !== 'boolean' || typeof value === 'boolean') &&
      (key !== 'theme' || THEMES.includes(value as Theme)) &&
      (key !== 'look' || LOOKS.includes(value as Look)) &&
      (key !== 'screen' || SCREENS.includes(value as Screen)),
  )
  return { ...DEFAULT_DEVICE_SETTINGS, ...Object.fromEntries(known), metronome: metronomeSettingsFrom(stored?.metronome) }
}

/** The library sidebar's tabs: the drummer's own exercises, and the built-in examples. */
export type LibraryTab = 'library' | 'examples'

export const DEFAULT_DEVICE_SETTINGS: DeviceSettings = {
  countIn: true,
  clickVolume: 1,
  exerciseVolume: 1,
  grooveVolume: 1,
  exerciseMuted: false,
  clickMuted: false,
  grooveMuted: false,
  lastOpenedId: null,
  libraryTab: 'library',
  collapsedFolderIds: [],
  librarySidebarOpen: true,
  settingsSidebarOpen: true,
  settingsSectionOpen: true,
  editorCollapsed: false,
  theme: 'auto',
  look: 'warm',
  screen: 'practice',
  metronome: DEFAULT_METRONOME_SETTINGS,
  welcomeDismissed: false,
  fitNotation: true,
  beatCount: true,
}

/** The device settings that are a playback layer's volume. */
export type VolumeSetting = 'clickVolume' | 'exerciseVolume' | 'grooveVolume'

const BASE_TICKS: Record<Duration, number> = { quarter: 12, eighth: 6, sixteenth: 3 }

/** How many ticks an item (or any value of a duration, dotted or not, triplet or not) lasts. */
export function itemTicks(item: Pick<Item, 'duration' | 'dotted' | 'triplet'>): number {
  const ticks = BASE_TICKS[item.duration] * (item.dotted ? 1.5 : 1)
  return item.triplet ? (ticks * 2) / 3 : ticks
}

/** A row's beats of quarter rests, four unless given another number. */
export function restItems(beats = 4): Item[] {
  return Array.from({ length: beats }, () => ({ kind: 'rest', duration: 'quarter', dotted: false, triplet: false }))
}

export function restBar(beats = 4): Bar {
  return { snare: restItems(beats), kick: restItems(beats) }
}

/** A new exercise always starts from the same fixed defaults, in the folder given (none by default). */
export function newExercise({ id, now, folderId = null }: { id: string; now: number; folderId?: string | null }): Exercise {
  return {
    id,
    name: 'Untitled',
    schemaVersion: SCHEMA_VERSION,
    bars: [restBar()],
    timeSignature: '4/4',
    sticking: 'off',
    leadHand: 'R',
    practice: { bpm: 80, loopRange: null, groove: 'off', hihatFoot: 'off', swing: MIN_SWING },
    lastOpened: now,
    folderId,
  }
}

/** The exercise at a new tempo, kept inside the supported range. */
export function withBpm(exercise: Exercise, bpm: number): Exercise {
  return { ...exercise, practice: { ...exercise.practice, bpm: clampBpm(bpm) } }
}

/** Whether the swing feel is on: a swing amount above straight, which the notation writes as triplets (ADR 0006). */
export function swingOn(practice: PracticeSettings): boolean {
  return practice.swing > MIN_SWING
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

/** The exercise with a hi-hat foot setting, as it was if it already has that one. */
export function withHihatFoot(exercise: Exercise, hihatFoot: HihatFoot): Exercise {
  if (hihatFoot === exercise.practice.hihatFoot) return exercise
  return { ...exercise, practice: { ...exercise.practice, hihatFoot } }
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

/** Whether any row of any bar has a note. */
export function hasHits(exercise: Exercise): boolean {
  return exercise.bars.some((bar) => ROWS.some((row) => bar[row].some((item) => item.kind === 'note')))
}
