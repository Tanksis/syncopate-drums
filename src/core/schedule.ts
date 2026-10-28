// The schedule: an exercise and its settings turned into timed events for one lookahead window.
// Musical position (bar, tick) is the source of truth. Each call converts ticks to seconds from
// the position it is given, at the BPM it is given, so a tempo change only affects what comes next.

import type { DeviceSettings, Exercise, Grace, LoopRange, Note, PracticeSettings, Row } from './model'
import type { BeatLevel } from './metronome'
import { MIN_SWING, ROWS, TICKS_PER_BEAT, barTicks, itemTicks, loopBars, meter, noteId } from './model'
import { grooveHitsByTick } from './groove'
import { placeItems } from './speller'

/** A place in the playback: bar index (negative during the count-in) and tick within the bar. */
export interface PlayPosition {
  bar: number
  tick: number
}

export type Instrument =
  | 'click'
  | 'snare'
  | 'kick'
  | 'kickFeathered'
  | 'ride'
  | 'rideBell'
  | 'hihatClosed'
  | 'hihatPedal'

export interface ScheduledEvent {
  /** Seconds after the position the window started from. */
  time: number
  kind: 'click' | 'exercise' | 'groove'
  instrument: Instrument
  /** A bar's first click, played high; or an accented note of the exercise, played from the snare's accent band. */
  accent: boolean
  /**
   * A grace note of a flam or drag, played from the snare's grace band just ahead of its note. It
   * isn't a struck note: it has no note id and moves no playhead.
   */
  grace?: true
  /** A buzzed note of the exercise, played from the snare's buzz strokes. */
  buzz?: true
  /**
   * A double's second stroke, played halfway through its note by the same hand. It isn't a struck
   * note: it has no note id and moves no playhead.
   */
  second?: true
  /** How hard a groove hit is played, 0–1 of the instrument's usual level; other events always play at 1. */
  velocity?: number
  /** A metronome click's beat block level, or `subdivision` for a click between the beats. */
  level?: BeatLevel | 'subdivision'
  /** The struck note's id (see `noteId`). */
  noteId?: string
  position: PlayPosition
}

export interface ScheduleResult {
  /** In time order. */
  events: ScheduledEvent[]
  /** The first position not yet scheduled: pass it to the next call. */
  next: PlayPosition
  /** Seconds from the window's start position to `next`. */
  nextTime: number
}

/**
 * Every event from `from` up to `window` seconds later. `'start'` begins playback: with the
 * count-in on, one bar of clicks, in the exercise's time signature, comes before the loop range. Playback wraps from the end of the
 * loop range to its start, so a changed range applies at the next wrap, or at once from a
 * position already past its end.
 */
export function schedule(
  exercise: Exercise,
  practice: PracticeSettings,
  device: DeviceSettings,
  from: PlayPosition | 'start',
  window: number,
): ScheduleResult {
  const secondsPerTick = 60 / practice.bpm / TICKS_PER_BEAT
  // In compound time each beat is already three eighths, so nothing is swung (ADR 0015).
  const swing = meter(exercise.timeSignature).compound ? MIN_SWING : effectiveSwing(practice.swing, practice.bpm)
  const struck = ROWS.map((row) => ({ row, notes: struckNotes(exercise, row) }))
  const barMeter = meter(exercise.timeSignature)
  const { beats } = barMeter
  const groove = grooveHitsByTick(practice, barMeter)
  const loop = loopBars(practice.loopRange, exercise.bars.length)
  const ticksPerBar = barTicks(beats)
  let position: PlayPosition
  if (from === 'start') position = device.countIn ? { bar: -1, tick: 0 } : { bar: loop.first, tick: 0 }
  else position = from.bar > loop.last ? { bar: loop.first, tick: 0 } : from
  let elapsed = 0
  const events: ScheduledEvent[] = []
  // Time is counted in whole ticks from the start position, so no rounding error builds up.
  // Swing moves an event off its straight time, but never moves where the window ends.
  for (let straight = 0; straight < window; straight = ++elapsed * secondsPerTick) {
    const { bar, tick } = position
    const time = straight + swingShift(tick % TICKS_PER_BEAT, swing) * secondsPerTick
    if (tick % TICKS_PER_BEAT === 0) {
      events.push({ time, kind: 'click', instrument: 'click', accent: tick === 0, position })
    }
    // The count-in (a negative bar) strikes nothing.
    const strikes = struck.flatMap(({ row, notes }) => {
      const strike = bar >= 0 ? notes[bar]?.get(tick) : undefined
      return strike ? [{ row, ...strike }] : []
    })
    for (const { row, note, ticks } of strikes) {
      const instrument = ROW_INSTRUMENT[row]
      const accent = note.dynamic === 'accent'
      // A grace note before the window's start goes out with its note, a moment late at worst.
      for (const ahead of note.grace ? GRACE_AHEAD[note.grace] : []) {
        events.push({ time: time - ahead, kind: 'exercise', instrument, accent: false, grace: true, position })
      }
      const buzz = note.roll === 'buzz' ? { buzz: true as const } : {}
      events.push({ time, kind: 'exercise', instrument, accent, ...buzz, noteId: noteId(row, bar, tick), position })
      if (note.roll === 'double') {
        events.push({ time: time + (ticks / 2) * secondsPerTick, kind: 'exercise', instrument, accent: false, second: true, position })
      }
    }
    if (bar >= 0) {
      for (const { instrument, velocity } of groove.get(tick) ?? []) {
        // One drum is played once: a kick row's hit replaces the groove's bass drum there.
        if (strikes.some((s) => s.row === 'kick') && BASS_DRUMS.has(instrument)) continue
        events.push({ time, kind: 'groove', instrument, accent: false, velocity, position })
      }
    }
    position = advance(position, loop, ticksPerBar)
  }
  // Swing can move a groove's & past a triplet note later in the beat, so put the events in time order.
  events.sort((a, b) => a.time - b.time)
  return { events, next: position, nextTime: elapsed * secondsPerTick }
}

/**
 * Seconds each grace note is played ahead of its note, earliest first: a fixed time, so a flam
 * sounds the same at any tempo. Tuned by ear.
 */
const GRACE_AHEAD: Record<Grace, readonly number[]> = { flam: [0.025], drag: [0.05, 0.025] }

/** Swing eases from the full amount at this tempo and below… */
const FULL_SWING_BPM = 120
/** …to straight at this tempo and above. */
const STRAIGHT_BPM = 320

/** The first eighth's share of the beat at a tempo: 0.5 is straight. */
function effectiveSwing(amount: number, bpm: number): number {
  const ease = Math.min(1, Math.max(0, (STRAIGHT_BPM - bpm) / (STRAIGHT_BPM - FULL_SWING_BPM)))
  return 0.5 + (amount - 0.5) * ease
}

/**
 * How many ticks swing moves a position in the beat. Binary-grid positions (every third tick:
 * the e, & and a) stretch to put the & at the swing share, with the sixteenths halfway through
 * each eighth. Triplet-grid positions are never moved.
 */
function swingShift(beatTick: number, swing: number): number {
  if (beatTick % (TICKS_PER_BEAT / 4) !== 0) return 0
  const x = beatTick / TICKS_PER_BEAT
  const warped = x < 0.5 ? x * (swing / 0.5) : swing + (x - 0.5) * ((1 - swing) / 0.5)
  return (warped - x) * TICKS_PER_BEAT
}

/** The next tick: from the count-in into the loop range, and from its last bar back to its first. */
function advance({ bar, tick }: PlayPosition, loop: LoopRange, ticksPerBar: number): PlayPosition {
  if (tick + 1 < ticksPerBar) return { bar, tick: tick + 1 }
  return { bar: bar < 0 || bar >= loop.last ? loop.first : bar + 1, tick: 0 }
}

/** The instrument each row is played on. */
export const ROW_INSTRUMENT: Record<Row, Instrument> = { snare: 'snare', kick: 'kick' }

const BASS_DRUMS: ReadonlySet<Instrument> = new Set(['kick', 'kickFeathered'])

/** A struck note, and how long it sounds in ticks: its tied continuations too. */
interface Strike {
  note: Note
  ticks: number
}

/** Per bar, the notes a row strikes, by tick (tied continuations are held, not struck). */
function struckNotes(exercise: Exercise, row: Row): Map<number, Strike>[] {
  const struck = exercise.bars.map(() => new Map<number, Strike>())
  let last: Strike | undefined
  for (const p of placeItems(exercise.bars, row)) {
    if (p.continuation && last) last.ticks += itemTicks(p.item)
    else if (p.item.kind === 'note') struck[p.bar].set(p.start, (last = { note: p.item, ticks: itemTicks(p.item) }))
    else last = undefined
  }
  return struck
}
