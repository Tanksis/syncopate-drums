// The schedule: an exercise and its settings turned into timed events for one lookahead window.
// Musical position (bar, tick) is the source of truth. Each call converts ticks to seconds from
// the position it is given, at the BPM it is given, so a tempo change only affects what comes next.

import type { DeviceSettings, Exercise, LoopRange, PracticeSettings, Row } from './model'
import { ROWS, TICKS_PER_BAR, TICKS_PER_BEAT, loopBars, noteId } from './model'
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
  accent: boolean
  /** How hard a groove hit is played, 0–1 of the instrument's usual level; other events always play at 1. */
  velocity?: number
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
 * count-in on, one bar of clicks comes before the loop range. Playback wraps from the end of the
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
  const swing = effectiveSwing(practice.swing, practice.bpm)
  const struck = ROWS.map((row) => ({ row, ticks: struckTicks(exercise, row) }))
  const groove = grooveHitsByTick(practice.groove)
  const loop = loopBars(practice.loopRange, exercise.bars.length)
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
    const strikes = bar >= 0 ? struck.filter(({ ticks }) => ticks[bar]?.has(tick)).map(({ row }) => row) : []
    for (const row of strikes) {
      const instrument = ROW_INSTRUMENT[row]
      events.push({ time, kind: 'exercise', instrument, accent: false, noteId: noteId(row, bar, tick), position })
    }
    if (bar >= 0) {
      for (const { instrument, velocity } of groove.get(tick) ?? []) {
        // One drum is played once: a kick row's hit replaces the groove's bass drum there.
        if (strikes.includes('kick') && BASS_DRUMS.has(instrument)) continue
        events.push({ time, kind: 'groove', instrument, accent: false, velocity, position })
      }
    }
    position = advance(position, loop)
  }
  // Swing can move a groove's & past a triplet note later in the beat, so put the events in time order.
  events.sort((a, b) => a.time - b.time)
  return { events, next: position, nextTime: elapsed * secondsPerTick }
}

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
function advance({ bar, tick }: PlayPosition, loop: LoopRange): PlayPosition {
  if (tick + 1 < TICKS_PER_BAR) return { bar, tick: tick + 1 }
  return { bar: bar < 0 || bar >= loop.last ? loop.first : bar + 1, tick: 0 }
}

/** The instrument each row is played on. */
export const ROW_INSTRUMENT: Record<Row, Instrument> = { snare: 'snare', kick: 'kick' }

const BASS_DRUMS: ReadonlySet<Instrument> = new Set(['kick', 'kickFeathered'])

/** Per bar, the ticks where a row strikes a note (tied continuations are held, not struck). */
function struckTicks(exercise: Exercise, row: Row): Set<number>[] {
  const struck = exercise.bars.map(() => new Set<number>())
  for (const p of placeItems(exercise.bars, row)) {
    if (p.item.kind === 'note' && !p.continuation) struck[p.bar].add(p.start)
  }
  return struck
}
