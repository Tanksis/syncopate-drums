// The metronome: its own screen's settings, and the clicks they make (ADR 0014).

import { MAX_BPM, MAX_VOLUME, TICKS_PER_BEAT } from './model'
import type { PlayPosition, ScheduledEvent, ScheduleResult } from './schedule'

/** The metronome goes slower than an exercise; both top out at MAX_BPM. */
export const MIN_METRONOME_BPM = 20

/** The most beats a bar of the metronome holds. */
export const MAX_BEATS = 16

/** Keeps a metronome tempo inside MIN_METRONOME_BPM–MAX_BPM, as a whole number. */
export function clampMetronomeBpm(bpm: number): number {
  if (Number.isNaN(bpm)) return MIN_METRONOME_BPM
  return Math.min(MAX_BPM, Math.max(MIN_METRONOME_BPM, Math.round(bpm)))
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
  /**
   * Where the picture's notes fall within one beat, as fractions of it. Onset 0 is the beat
   * itself; the others are subdivision clicks. A picture whose first onset is rested still plays
   * the beat: its block decides that.
   */
  onsets: readonly number[]
}

export const SUBDIVISIONS: readonly Subdivision[] = [
  { id: 'quarter', onsets: [0] },
  { id: 'eighths', onsets: [0, 1 / 2] },
  { id: 'offbeatEighth', onsets: [1 / 2] },
  { id: 'dottedEighth', onsets: [0, 3 / 4] },
  { id: 'triplet', onsets: [0, 1 / 3, 2 / 3] },
  { id: 'tripletFirstRest', onsets: [1 / 3, 2 / 3] },
  { id: 'tripletMiddleRest', onsets: [0, 2 / 3] },
  { id: 'tripletLastRest', onsets: [0, 1 / 3] },
  { id: 'sixteenths', onsets: [0, 1 / 4, 1 / 2, 3 / 4] },
  { id: 'eighthTwoSixteenths', onsets: [0, 1 / 2, 3 / 4] },
  { id: 'twoSixteenthsEighth', onsets: [0, 1 / 4, 1 / 2] },
  { id: 'sixteenthEighthSixteenth', onsets: [0, 1 / 4, 3 / 4] },
]

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
  const d = DEFAULT_METRONOME_SETTINGS
  const number = (value: unknown) => (typeof value === 'number' && !Number.isNaN(value) ? value : undefined)
  const oneOf = <T>(value: unknown, options: readonly T[], fallback: T) => (options.includes(value as T) ? (value as T) : fallback)
  const volume = (value: unknown, fallback: number) => Math.min(MAX_VOLUME, Math.max(0, number(value) ?? fallback))
  const storedBeats = number(s.beats)
  const beats = storedBeats !== undefined && Number.isInteger(storedBeats) && storedBeats >= 1 && storedBeats <= MAX_BEATS ? storedBeats : d.beats
  const storedLevels: unknown = s.levels
  const levels = Array.isArray(storedLevels)
    ? Array.from({ length: beats }, (_, beat): BeatLevel => oneOf(storedLevels[beat], BEAT_LEVELS, 'normal'))
    : freshLevels(beats)
  return {
    bpm: clampMetronomeBpm(number(s.bpm) ?? d.bpm),
    beats,
    noteValue: oneOf(s.noteValue, NOTE_VALUES, d.noteValue),
    levels,
    subdivision: oneOf(
      s.subdivision,
      SUBDIVISIONS.map((sub) => sub.id),
      d.subdivision,
    ),
    sound: oneOf(s.sound, METRONOME_SOUNDS, d.sound),
    beatVolume: volume(s.beatVolume, d.beatVolume),
    subdivisionVolume: volume(s.subdivisionVolume, d.subdivisionVolume),
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

/** The ticks within a beat where a subdivision clicks, leaving out the beat itself. */
function subdivisionBeatTicks(id: SubdivisionId): Set<number> {
  const onsets = SUBDIVISIONS.find((s) => s.id === id)?.onsets ?? []
  return new Set(onsets.map((onset) => Math.round(onset * TICKS_PER_BEAT)).filter((tick) => tick > 0))
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
