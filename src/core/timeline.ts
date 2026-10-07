// The playback timeline: what the engine has scheduled, on the audio clock, so the notation can
// light the note the drummer is hearing and the header can show where playback is.

import { TICKS_PER_BEAT } from './model'
import type { PlayPosition } from './schedule'

/** One scheduled event: when it sounds, where it is and, for a struck note, which note. */
export interface TimelineEntry {
  time: number
  noteId?: string
  position: PlayPosition
}

/** Where playback is at a moment, and the note that is sounding then. */
export interface Playhead {
  position: PlayPosition
  noteId?: string
}

/**
 * The playhead at `time`, from a timeline in time order: the position of the latest event that
 * has sounded, and the latest note struck, which stays lit until the next. Undefined before
 * anything has sounded.
 */
export function playheadAt(timeline: readonly TimelineEntry[], time: number): Playhead | undefined {
  const last = lastAt(timeline, time)
  if (last < 0) return undefined
  const note = lastNote(timeline, last)
  const { position } = timeline[last]
  return note < 0 ? { position } : { noteId: timeline[note].noteId, position }
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
  const note = lastNote(timeline, last)
  return note < 0 || note === last ? timeline.slice(last) : [timeline[note], ...timeline.slice(last)]
}

/** The index of the last entry sounding at or before `time`, or -1. */
function lastAt(timeline: readonly TimelineEntry[], time: number): number {
  let i = -1
  while (i + 1 < timeline.length && timeline[i + 1].time <= time) i++
  return i
}

/** The index of the last note at or before index `from`, or -1. */
function lastNote(timeline: readonly TimelineEntry[], from: number): number {
  let i = from
  while (i >= 0 && timeline[i].noteId === undefined) i--
  return i
}
