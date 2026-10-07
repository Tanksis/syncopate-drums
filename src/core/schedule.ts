// The schedule: an exercise and its settings turned into timed events for one lookahead window.
// Musical position (bar, tick) is the source of truth. Each call converts ticks to seconds from
// the position it is given, at the BPM it is given, so a tempo change only affects what comes next.

import type { DeviceSettings, Exercise, LoopRange, PracticeSettings, Voice } from './model'
import { TICKS_PER_BAR, TICKS_PER_BEAT, loopBars } from './model'
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
  /** The struck note, as `bar:tick`. */
  noteId?: string
  position: PlayPosition
}

export interface ScheduleResult {
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
  const struck = struckTicks(exercise)
  const loop = loopBars(practice.loopRange, exercise.bars.length)
  let position: PlayPosition
  if (from === 'start') position = device.countIn ? { bar: -1, tick: 0 } : { bar: loop.first, tick: 0 }
  else position = from.bar > loop.last ? { bar: loop.first, tick: 0 } : from
  let elapsed = 0
  const events: ScheduledEvent[] = []
  // Time is counted in whole ticks from the start position, so no rounding error builds up.
  for (let time = 0; time < window; time = ++elapsed * secondsPerTick) {
    const { bar, tick } = position
    if (tick % TICKS_PER_BEAT === 0) {
      events.push({ time, kind: 'click', instrument: 'click', accent: tick === 0, position })
    }
    if (bar >= 0 && struck[bar]?.has(tick)) {
      const instrument = VOICE_INSTRUMENT[exercise.voice]
      events.push({ time, kind: 'exercise', instrument, accent: false, noteId: `${bar}:${tick}`, position })
    }
    position = advance(position, loop)
  }
  return { events, next: position, nextTime: elapsed * secondsPerTick }
}

/** The next tick: from the count-in into the loop range, and from its last bar back to its first. */
function advance({ bar, tick }: PlayPosition, loop: LoopRange): PlayPosition {
  if (tick + 1 < TICKS_PER_BAR) return { bar, tick: tick + 1 }
  return { bar: bar < 0 || bar >= loop.last ? loop.first : bar + 1, tick: 0 }
}

const VOICE_INSTRUMENT: Record<Voice, Instrument> = { snare: 'snare', bass: 'kick' }

/** Per bar, the ticks where a note is struck (tied continuations are held, not struck). */
function struckTicks(exercise: Exercise): Set<number>[] {
  const struck = exercise.bars.map(() => new Set<number>())
  for (const p of placeItems(exercise.bars)) {
    if (p.item.kind === 'note' && !p.continuation) struck[p.bar].add(p.start)
  }
  return struck
}
