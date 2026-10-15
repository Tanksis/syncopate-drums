// The metronome: its own screen's settings, and the clicks they make (ADR 0014).

import { MAX_VOLUME, TICKS_PER_BEAT, clampBpm } from './units'
import type { PlayPosition, ScheduledEvent, ScheduleResult } from './schedule'
import type { Duration, Item } from './model'

/** The metronome goes slower than an exercise; both top out at MAX_BPM. */
export const MIN_METRONOME_BPM = 20

/** The most beats a bar of the metronome holds. */
export const MAX_BEATS = 16

/** Keeps a metronome tempo inside MIN_METRONOME_BPM–MAX_BPM, as a whole number. */
export function clampMetronomeBpm(bpm: number): number {
  return clampBpm(bpm, MIN_METRONOME_BPM)
}

/** How a beat block plays: tapping a block cycles it through these, in this order. */
export type BeatLevel = 'accent' | 'normal' | 'soft' | 'off'

export const BEAT_LEVELS: readonly BeatLevel[] = ['accent', 'normal', 'soft', 'off']

/** The note value a time signature counts in: the bottom number. */
export type NoteValue = 2 | 4 | 8 | 16

export const NOTE_VALUES: readonly NoteValue[] = [2, 4, 8, 16]

/** The click's sounds: Beep, Wood block and Cowbell are synthesized, Hi-hat and Ride bell are the kit's samples. */
export type MetronomeSound = 'beep' | 'woodBlock' | 'cowbell' | 'hihat' | 'rideBell'

export const METRONOME_SOUNDS: readonly MetronomeSound[] = ['beep', 'woodBlock', 'cowbell', 'hihat', 'rideBell']

/** The subdivisions, in the order the Rhythm sheet's grid shows them. */
export type SubdivisionId =
  | 'quarter'
  | 'eighths'
  | 'offbeatEighth'
  | 'dottedEighth'
  | 'triplet'
  | 'tripletFirstRest'
  | 'tripletMiddleRest'
  | 'tripletLastRest'
  | 'sixteenths'
  | 'eighthTwoSixteenths'
  | 'twoSixteenthsEighth'
  | 'sixteenthEighthSixteenth'

export interface Subdivision {
  id: SubdivisionId
  /** What the picture shows, in words: its accessible name. */
  name: string
  /**
   * Where the picture's notes fall within one beat, as fractions of it. Onset 0 is the beat
   * itself; the others are subdivision clicks. A picture whose first onset is rested still plays
   * the beat: its block decides that.
   */
  onsets: readonly number[]
}

export const SUBDIVISIONS: readonly Subdivision[] = [
  { id: 'quarter', name: 'Quarter notes', onsets: [0] },
  { id: 'eighths', name: 'Eighth notes', onsets: [0, 1 / 2] },
  { id: 'offbeatEighth', name: 'Off-beat eighth', onsets: [1 / 2] },
  { id: 'dottedEighth', name: 'Dotted eighth and sixteenth', onsets: [0, 3 / 4] },
  { id: 'triplet', name: 'Triplet', onsets: [0, 1 / 3, 2 / 3] },
  { id: 'tripletFirstRest', name: 'Triplet, first rested', onsets: [1 / 3, 2 / 3] },
  { id: 'tripletMiddleRest', name: 'Triplet, middle rested', onsets: [0, 2 / 3] },
  { id: 'tripletLastRest', name: 'Triplet, last rested', onsets: [0, 1 / 3] },
  { id: 'sixteenths', name: 'Sixteenth notes', onsets: [0, 1 / 4, 1 / 2, 3 / 4] },
  { id: 'eighthTwoSixteenths', name: 'Eighth and two sixteenths', onsets: [0, 1 / 2, 3 / 4] },
  { id: 'twoSixteenthsEighth', name: 'Two sixteenths and eighth', onsets: [0, 1 / 4, 1 / 2] },
  { id: 'sixteenthEighthSixteenth', name: 'Sixteenth, eighth, sixteenth', onsets: [0, 1 / 4, 3 / 4] },
]

/** A subdivision by its id. */
export function subdivisionOf(id: SubdivisionId): Subdivision {
  return SUBDIVISIONS.find((s) => s.id === id)!
}

/** One note or rest of a subdivision's picture. */
export type PictureNote = Pick<Item, 'duration' | 'dotted'> & { rest: boolean }

/** What a subdivision's picture draws for one beat: its notes and rests, and whether they are a triplet. */
export interface SubdivisionNotation {
  triplet: boolean
  notes: PictureNote[]
}

/** A straight note's length, as a fraction of the beat, and how it is written. */
const STRAIGHT_LENGTHS: readonly [number, Duration, boolean][] = [
  [1, 'quarter', false],
  [3 / 4, 'eighth', true],
  [1 / 2, 'eighth', false],
  [1 / 4, 'sixteenth', false],
]

/** A straight note or rest lasting `length` of the beat. */
function straightNote(length: number, rest: boolean): PictureNote {
  const [, duration, dotted] = STRAIGHT_LENGTHS.find(([l]) => Math.abs(l - length) < 1e-9)!
  return { duration, dotted, rest }
}

/**
 * A subdivision's onsets written out as one beat of notation. A triplet is three eighths, each
 * played or rested; otherwise each note lasts until the next onset, and a gap before the first is a rest.
 */
export function subdivisionNotation(id: SubdivisionId): SubdivisionNotation {
  const onsets = subdivisionOf(id).onsets
  const onThird = (onset: number, third: number) => Math.abs(onset * 3 - third) < 1e-9
  if (onsets.some((onset) => onThird(onset, 1) || onThird(onset, 2))) {
    // Each third of the beat is an eighth, played or rested.
    const notes = [0, 1, 2].map((third) => ({ duration: 'eighth' as const, dotted: false, rest: !onsets.some((o) => onThird(o, third)) }))
    return { triplet: true, notes }
  }
  const ends = [...onsets.slice(1), 1]
  const notes = onsets.map((onset, i) => straightNote(ends[i] - onset, false))
  return { triplet: false, notes: onsets[0] > 0 ? [straightNote(onsets[0], true), ...notes] : notes }
}

export interface MetronomeSettings {
  /** MIN_METRONOME_BPM–MAX_BPM, counting the time signature's note value. */
  bpm: number
  /** The top number of the time signature, 1–MAX_BEATS. */
  beats: number
  noteValue: NoteValue
  /** One per beat. */
  levels: BeatLevel[]
  subdivision: SubdivisionId
  sound: MetronomeSound
  /** The beats' volume, from 0 (silent) to MAX_VOLUME; 1 is its usual level. */
  beatVolume: number
  /** The subdivision clicks' volume, as for the beats. */
  subdivisionVolume: number
}

/** A bar of levels for a time signature: beat 1 accented, the rest normal. */
function freshLevels(beats: number): BeatLevel[] {
  return Array.from({ length: beats }, (_, beat) => (beat === 0 ? 'accent' : 'normal'))
}

export const DEFAULT_METRONOME_SETTINGS: MetronomeSettings = {
  bpm: 92,
  beats: 4,
  noteValue: 4,
  levels: freshLevels(4),
  subdivision: 'quarter',
  sound: 'woodBlock',
  beatVolume: 1,
  subdivisionVolume: 1,
}

/**
 * A metronome as stored, over the defaults for any setting added since. A sound or subdivision the
 * app doesn't have falls back to the default, numbers are kept in range, and the levels are padded
 * with Normal or cut to the beats.
 */
export function metronomeSettingsFrom(stored: unknown): MetronomeSettings {
  const s: Record<string, unknown> = typeof stored === 'object' && stored !== null ? { ...stored } : {}
  const defaults = DEFAULT_METRONOME_SETTINGS
  const number = (value: unknown) => (typeof value === 'number' && !Number.isNaN(value) ? value : undefined)
  const oneOf = <T>(value: unknown, options: readonly T[], fallback: T) => (options.includes(value as T) ? (value as T) : fallback)
  const volume = (value: unknown, fallback: number) => Math.min(MAX_VOLUME, Math.max(0, number(value) ?? fallback))
  const storedBeats = number(s.beats)
  const beats = storedBeats !== undefined && Number.isInteger(storedBeats) && storedBeats >= 1 && storedBeats <= MAX_BEATS ? storedBeats : defaults.beats
  const storedLevels: unknown = s.levels
  const levels = Array.isArray(storedLevels)
    ? Array.from({ length: beats }, (_, beat): BeatLevel => oneOf(storedLevels[beat], BEAT_LEVELS, 'normal'))
    : freshLevels(beats)
  return {
    bpm: clampMetronomeBpm(number(s.bpm) ?? defaults.bpm),
    beats,
    noteValue: oneOf(s.noteValue, NOTE_VALUES, defaults.noteValue),
    levels,
    subdivision: oneOf(
      s.subdivision,
      SUBDIVISIONS.map((sub) => sub.id),
      defaults.subdivision,
    ),
    sound: oneOf(s.sound, METRONOME_SOUNDS, defaults.sound),
    beatVolume: volume(s.beatVolume, defaults.beatVolume),
    subdivisionVolume: volume(s.subdivisionVolume, defaults.subdivisionVolume),
  }
}

/** A block's next level when tapped: Accent → Normal → Soft → Off → Accent. */
export function cycleLevel(level: BeatLevel): BeatLevel {
  return BEAT_LEVELS[(BEAT_LEVELS.indexOf(level) + 1) % BEAT_LEVELS.length]
}

/** A new time signature, with the blocks reset to beat 1 accented and the rest normal. */
export function withTimeSignature(settings: MetronomeSettings, beats: number, noteValue: NoteValue): MetronomeSettings {
  return { ...settings, beats, noteValue, levels: freshLevels(beats) }
}

/**
 * Every click from `from` up to `window` seconds later, looping bar after bar forever. A position's
 * tick counts TICKS_PER_BEAT to a beat, whatever the note value: a beat lasts 60 / BPM seconds, so
 * in 6/8 the BPM counts eighths. An Off beat is still scheduled, silent, so the blocks keep time.
 */
export function metronomeSchedule(settings: MetronomeSettings, from: PlayPosition | 'start', window: number): ScheduleResult {
  const ticksPerBar = settings.beats * TICKS_PER_BEAT
  // Time is counted in whole ticks from the start position, so no rounding error builds up.
  const secondsAfter = (ticks: number) => (ticks * 60) / (settings.bpm * TICKS_PER_BEAT)
  let position: PlayPosition = from === 'start' ? { bar: 0, tick: 0 } : from
  if (position.tick >= ticksPerBar) position = { bar: position.bar + 1, tick: 0 }
  const subdivisionTicks = subdivisionBeatTicks(settings.subdivision)
  let elapsed = 0
  const events: ScheduledEvent[] = []
  for (let time = 0; time < window; time = secondsAfter(++elapsed)) {
    const beatTick = position.tick % TICKS_PER_BEAT
    if (beatTick === 0) {
      const level = settings.levels[position.tick / TICKS_PER_BEAT] ?? 'normal'
      events.push({ time, kind: 'click', instrument: 'click', accent: level === 'accent', level, position })
    } else if (subdivisionTicks.has(beatTick)) {
      events.push({ time, kind: 'click', instrument: 'click', accent: false, level: 'subdivision', position })
    }
    position = position.tick + 1 < ticksPerBar ? { bar: position.bar, tick: position.tick + 1 } : { bar: position.bar + 1, tick: 0 }
  }
  return { events, next: position, nextTime: secondsAfter(elapsed) }
}

/** The bar and beat (both counted from 0) a metronome position falls in: what its block and dial dot light. */
export function metronomeBeat({ bar, tick }: PlayPosition): { bar: number; beat: number } {
  return { bar, beat: Math.floor(tick / TICKS_PER_BEAT) }
}

/** The ticks within a beat where a subdivision clicks, leaving out the beat itself. */
function subdivisionBeatTicks(id: SubdivisionId): Set<number> {
  const onsets = subdivisionOf(id).onsets
  return new Set(onsets.map((onset) => Math.round(onset * TICKS_PER_BEAT)).filter((tick) => tick > 0))
}

/** How loud each kind of click plays at its volume's usual level, relative to an accent. */
const CLICK_GAIN: Record<BeatLevel | 'subdivision', number> = { accent: 1, normal: 0.6, soft: 0.3, off: 0, subdivision: 0.4 }

/** How loud a click plays, 0–MAX_VOLUME: its level's gain at the beats' or the subdivision's volume. */
export function metronomeClickGain(level: BeatLevel | 'subdivision', settings: MetronomeSettings): number {
  return CLICK_GAIN[level] * (level === 'subdivision' ? settings.subdivisionVolume : settings.beatVolume)
}

/** Taps further apart than this start a new tempo. */
const TAP_RESTART_MS = 2000

/** How many of the latest gaps between taps the tempo is read from. */
const TAP_GAPS = 4

/**
 * The tempo tapped, from tap times in milliseconds, oldest first: the average of the last few
 * gaps since the taps last restarted. Undefined until there are two taps to measure.
 */
export function tapTempo(taps: readonly number[]): number | undefined {
  const gaps: number[] = []
  for (let i = taps.length - 1; i > 0 && gaps.length < TAP_GAPS; i--) {
    const gap = taps[i] - taps[i - 1]
    if (gap > TAP_RESTART_MS) break
    gaps.push(gap)
  }
  if (gaps.length === 0) return undefined
  const average = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length
  return clampMetronomeBpm(60000 / average)
}

/** The Italian tempo names, each up to (not including) the BPM after it. */
const TEMPO_NAMES: readonly [number, string][] = [
  [60, 'Largo'],
  [76, 'Adagio'],
  [108, 'Andante'],
  [120, 'Moderato'],
  [168, 'Allegro'],
  [Infinity, 'Presto'],
]

/** The tempo name shown under the dial's BPM. */
export function tempoName(bpm: number): string {
  return TEMPO_NAMES.find(([below]) => bpm < below)![1]
}

/** A point on the screen relative to the dial's centre, in px, y growing downwards. */
export interface DialPoint {
  x: number
  y: number
}

/** How far a drag around the dial turned it from one point to the next, in turns: clockwise is positive. */
export function dialTurn(from: DialPoint, to: DialPoint): number {
  const turn = (Math.atan2(to.y, to.x) - Math.atan2(from.y, from.x)) / (2 * Math.PI)
  // Across the left of the ring the angle jumps a whole turn; a move between two points is the shorter way round.
  return turn > 0.5 ? turn - 1 : turn < -0.5 ? turn + 1 : turn
}

/** How many BPM a whole turn of the dial moves the tempo. */
const BPM_PER_TURN = 60

/** The tempo once the dial has turned `turned` turns (clockwise faster) from a drag that began at `startBpm`. */
export function dialBpm(startBpm: number, turned: number): number {
  return clampMetronomeBpm(startBpm + turned * BPM_PER_TURN)
}
