import { describe, expect, it } from 'vitest'
import type { TimelineEntry } from './index'
import { playheadAt, positionLabel, trimTimeline } from './index'

/** Count-in beat 4 at 0, then bar 1: a note with the click at 1, a click at 1.5, a note at 1.75. */
const timeline: TimelineEntry[] = [
  { time: 0, position: { bar: -1, tick: 36 } },
  { time: 1, position: { bar: 0, tick: 0 } },
  { time: 1, noteId: '0:0', position: { bar: 0, tick: 0 } },
  { time: 1.5, position: { bar: 0, tick: 12 } },
  { time: 1.75, noteId: '0:18', position: { bar: 0, tick: 18 } },
]

describe('the playhead', () => {
  it('is nowhere before the first event sounds', () => {
    expect(playheadAt(timeline, -0.1)).toBeUndefined()
  })

  it('has no note during the count-in', () => {
    expect(playheadAt(timeline, 0.5)).toEqual({ position: { bar: -1, tick: 36 } })
  })

  it('lights a note from the moment it sounds', () => {
    expect(playheadAt(timeline, 1)).toEqual({ noteId: '0:0', position: { bar: 0, tick: 0 } })
  })

  it('keeps the note lit until the next one, while the position moves on with the clicks', () => {
    expect(playheadAt(timeline, 1.6)).toEqual({ noteId: '0:0', position: { bar: 0, tick: 12 } })
    expect(playheadAt(timeline, 1.8)).toEqual({ noteId: '0:18', position: { bar: 0, tick: 18 } })
  })
})

describe('trimming the timeline', () => {
  it('drops what has sounded but keeps the lit note and the current position', () => {
    expect(trimTimeline(timeline, 1.6)).toEqual([
      { time: 1, noteId: '0:0', position: { bar: 0, tick: 0 } },
      { time: 1.5, position: { bar: 0, tick: 12 } },
      { time: 1.75, noteId: '0:18', position: { bar: 0, tick: 18 } },
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
