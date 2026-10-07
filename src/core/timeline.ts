// The playback timeline: what the engine has scheduled, on the audio clock, so the notation can
// place the playhead on the hit the drummer is hearing and the header can show where playback is.

import { TICKS_PER_BEAT } from './model'
import type { PlayPosition, ScheduledEvent } from './schedule'

/** One scheduled event: when it sounds, where it is and whether it's a hit on the staff. */
export interface TimelineEntry {
  time: number
  /** An exercise or groove hit, as opposed to a click. */
  staffHit?: boolean
  position: PlayPosition
}

/** Where playback is at a moment, and where the latest hit on the staff is. */
export interface Playhead {
  position: PlayPosition
  /** The latest staff hit, where the notation draws the playhead line. */
  hit?: PlayPosition
}

/**
 * The timeline with a window of scheduled events added, the window starting at audio-clock time
 * `start`. Exercise and groove events are staff hits; clicks are not. The result stays in time
 * order, even when a swung & from the last window lands after the start of this one.
 */
export function recordEvents(
  timeline: readonly TimelineEntry[],
  events: readonly ScheduledEvent[],
  start: number,
): TimelineEntry[] {
  const result = [...timeline]
  for (const event of events) {
    const entry: TimelineEntry = { time: start + event.time, position: event.position }
    if (event.kind !== 'click') entry.staffHit = true
    let i = result.length
    while (i > 0 && result[i - 1].time > entry.time) i--
    result.splice(i, 0, entry)
  }
  return result
}

/**
 * The playhead at `time`, from a timeline in time order: the position of the latest event that
 * has sounded, and the latest staff hit, which holds until the next. Undefined before anything
 * has sounded.
 */
export function playheadAt(timeline: readonly TimelineEntry[], time: number): Playhead | undefined {
  const last = lastAt(timeline, time)
  if (last < 0) return undefined
  const hit = lastHit(timeline, last)
  const { position } = timeline[last]
  return hit < 0 ? { position } : { hit: timeline[hit].position, position }
}

/** The position as the header shows it: the count-in's beat, then bar · beat, counted from 1. */
export function positionLabel({ bar, tick }: PlayPosition): string {
  const beat = Math.floor(tick / TICKS_PER_BEAT) + 1
  return `${bar < 0 ? 'count-in' : bar + 1} · ${beat}`
}

/**
 * The timeline without the entries that no longer matter at `time` or later: what's left gives
 * the same playhead from then on.
 */
export function trimTimeline(timeline: readonly TimelineEntry[], time: number): TimelineEntry[] {
  const last = lastAt(timeline, time)
  if (last < 0) return [...timeline]
  const hit = lastHit(timeline, last)
  return hit < 0 || hit === last ? timeline.slice(last) : [timeline[hit], ...timeline.slice(last)]
}

/** The index of the last entry sounding at or before `time`, or -1. */
function lastAt(timeline: readonly TimelineEntry[], time: number): number {
  let i = -1
  while (i + 1 < timeline.length && timeline[i + 1].time <= time) i++
  return i
}

/** The index of the last staff hit at or before index `from`, or -1. */
function lastHit(timeline: readonly TimelineEntry[], from: number): number {
  let i = from
  while (i >= 0 && !timeline[i].staffHit) i--
  return i
}
