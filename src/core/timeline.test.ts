import { describe, expect, it } from 'vitest'
import type { Exercise, GroovePresetId, TimelineEntry } from './index'
import { DEFAULT_DEVICE_SETTINGS, newExercise, playheadAt, positionLabel, recordEvents, schedule, trimTimeline } from './index'

/** Count-in beat 4 at 0, then bar 1: a note with the click at 1, a click at 1.5, a note at 1.75. */
const timeline: TimelineEntry[] = [
  { time: 0, position: { bar: -1, tick: 36 } },
  { time: 1, position: { bar: 0, tick: 0 } },
  { time: 1, staffHit: true, position: { bar: 0, tick: 0 } },
  { time: 1.5, position: { bar: 0, tick: 12 } },
  { time: 1.75, staffHit: true, position: { bar: 0, tick: 18 } },
]

/** A blank exercise (the line rests throughout) at 60 BPM, a beat a second, over a groove. */
const resting = (groove: GroovePresetId): Exercise => {
  const ex = newExercise({ id: 'e1', now: 0 })
  return { ...ex, practice: { ...ex.practice, bpm: 60, swing: 0.5, groove } }
}

/** What the engine records for the first `seconds` of playback from the count-in, starting at time 0. */
const played = (ex: Exercise, seconds: number) =>
  recordEvents([], schedule(ex, ex.practice, DEFAULT_DEVICE_SETTINGS, 'start', seconds).events, 0)

describe('the playhead', () => {
  it('is nowhere before the first event sounds', () => {
    expect(playheadAt(timeline, -0.1)).toBeUndefined()
  })

  it('marks no hit during the count-in', () => {
    expect(playheadAt(timeline, 0.5)).toEqual({ position: { bar: -1, tick: 36 } })
  })

  it('marks a hit from the moment it sounds', () => {
    expect(playheadAt(timeline, 1)).toEqual({ hit: { bar: 0, tick: 0 }, position: { bar: 0, tick: 0 } })
  })

  it('stays on the hit through a click-only moment, while the position moves on with the clicks', () => {
    expect(playheadAt(timeline, 1.6)).toEqual({ hit: { bar: 0, tick: 0 }, position: { bar: 0, tick: 12 } })
    expect(playheadAt(timeline, 1.8)).toEqual({ hit: { bar: 0, tick: 18 }, position: { bar: 0, tick: 18 } })
  })

  it('follows the groove while the line rests: at the ride on the & of 2 it is at bar 1, tick 18', () => {
    // A bar of count-in (4 s), then bar 1: the & of 2 sounds at 5.5 s.
    expect(playheadAt(played(resting('jazz'), 8), 5.6)?.hit).toEqual({ bar: 0, tick: 18 })
  })

  it("doesn't move on the count-in's clicks", () => {
    expect(playheadAt(played(resting('jazz'), 8), 3.5)).toEqual({ position: { bar: -1, tick: 36 } })
  })
})

describe('recording the timeline', () => {
  it('records exercise and groove hits as staff hits, and clicks as not', () => {
    const ex = resting('jazz')
    const { events } = schedule(ex, ex.practice, DEFAULT_DEVICE_SETTINGS, { bar: 0, tick: 0 }, 1)
    expect(recordEvents([], events, 10)).toEqual([
      { time: 10, position: { bar: 0, tick: 0 } },
      { time: 10, staffHit: true, position: { bar: 0, tick: 0 } },
    ])
  })

  it('keeps the timeline in time order when a swung & lands after the next window starts', () => {
    const late: TimelineEntry = { time: 2.2, staffHit: true, position: { bar: 0, tick: 18 } }
    const ex = resting('off')
    const { events } = schedule(ex, ex.practice, DEFAULT_DEVICE_SETTINGS, { bar: 0, tick: 24 }, 0.5)
    expect(recordEvents([late], events, 2).map((e) => e.time)).toEqual([2, 2.2])
  })
})

describe('trimming the timeline', () => {
  it('drops what has sounded but keeps the latest hit and the current position', () => {
    expect(trimTimeline(timeline, 1.6)).toEqual([
      { time: 1, staffHit: true, position: { bar: 0, tick: 0 } },
      { time: 1.5, position: { bar: 0, tick: 12 } },
      { time: 1.75, staffHit: true, position: { bar: 0, tick: 18 } },
    ])
  })

  it('keeps everything before the first event sounds', () => {
    expect(trimTimeline(timeline, -1)).toEqual(timeline)
  })
})

describe('the position shown in the header', () => {
  it('counts the beats of the count-in', () => {
    expect(positionLabel({ bar: -1, tick: 0 })).toBe('count-in · 1')
    expect(positionLabel({ bar: -1, tick: 47 })).toBe('count-in · 4')
  })

  it('shows bar · beat, counting from 1', () => {
    expect(positionLabel({ bar: 0, tick: 0 })).toBe('1 · 1')
    expect(positionLabel({ bar: 6, tick: 30 })).toBe('7 · 3')
  })
})
