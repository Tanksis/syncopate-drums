import { describe, expect, it } from 'vitest'
import type { DeviceSettings, Exercise, ScheduledEvent } from './index'
import { newExercise, schedule, setBeat } from './index'

const device: DeviceSettings = { countIn: true, lastOpenedId: null }

const blank = (bpm = 120): Exercise => {
  const ex = newExercise({ id: 'e1', now: 0 })
  return { ...ex, practice: { ...ex.practice, bpm } }
}

/** A compact view of the events for readable assertions: "time kind instrument [accent] [noteId]". */
const show = (events: ScheduledEvent[]) =>
  events.map((e) =>
    [e.time.toFixed(3), e.kind, e.instrument, e.accent && 'accent', e.noteId].filter(Boolean).join(' '),
  )

describe('the count-in', () => {
  it('plays one bar of clicks before bar 1, with beat 1 accented', () => {
    const ex = blank(120)
    const { events } = schedule(ex, ex.practice, device, 'start', 2)
    expect(show(events)).toEqual([
      '0.000 click click accent',
      '0.500 click click',
      '1.000 click click',
      '1.500 click click',
    ])
    expect(events.map((e) => e.position)).toEqual([
      { bar: -1, tick: 0 },
      { bar: -1, tick: 12 },
      { bar: -1, tick: 24 },
      { bar: -1, tick: 36 },
    ])
  })
})

/** An exercise from beat figures on the sixteenth grid, one string per beat: `['x.x.', '....', …]`. */
const line = (beats: string[], bpm = 120): Exercise => {
  const ex = blank(bpm)
  let bars = ex.bars
  beats.forEach((hits, i) => {
    const bar = Math.floor(i / 4)
    while (bars.length <= bar) bars = [...bars, ...newExercise({ id: 'x', now: 0 }).bars]
    bars = setBeat(bars, bar, i % 4, hits)
  })
  return { ...ex, bars }
}

describe('playing the exercise', () => {
  it('clicks every quarter with beat 1 accented and strikes the notes on the snare', () => {
    const ex = line(['x.x.', '....', '.x.x', 'x...'])
    const { events } = schedule(ex, ex.practice, device, { bar: 0, tick: 0 }, 2)
    expect(show(events)).toEqual([
      '0.000 click click accent',
      '0.000 exercise snare 0:0',
      '0.250 exercise snare 0:6',
      '0.500 click click',
      '1.000 click click',
      '1.125 exercise snare 0:27',
      '1.375 exercise snare 0:33',
      '1.500 click click',
      '1.500 exercise snare 0:36',
    ])
  })

  it('plays the bass drum when that is the voice', () => {
    const ex = { ...line(['x...']), voice: 'bass' as const }
    const { events } = schedule(ex, ex.practice, device, { bar: 0, tick: 0 }, 0.1)
    expect(show(events)).toEqual(['0.000 click click accent', '0.000 exercise kick 0:0'])
  })

  it('goes straight from the count-in into bar 1', () => {
    const ex = line(['x...'])
    const { events } = schedule(ex, ex.practice, device, 'start', 2.1)
    expect(show(events).slice(-2)).toEqual(['2.000 click click accent', '2.000 exercise snare 0:0'])
  })
})

describe('looping', () => {
  it('wraps from the end of the exercise back to bar 1, without another count-in', () => {
    const ex = line(['x...', '....', '....', '....', '....', '....', '....', '...x'])
    const { events, next } = schedule(ex, ex.practice, device, { bar: 1, tick: 36 }, 0.6)
    expect(show(events)).toEqual([
      '0.000 click click',
      '0.375 exercise snare 1:45',
      '0.500 click click accent',
      '0.500 exercise snare 0:0',
    ])
    expect(events.at(-1)!.position).toEqual({ bar: 0, tick: 0 })
    expect(next).toEqual({ bar: 0, tick: 3 })
  })
})

describe('a tempo change while playing', () => {
  it('applies from the first position not yet scheduled, leaving earlier events where they were', () => {
    const ex = line(['x...', 'x...', 'x...', 'x...'], 120)
    const first = schedule(ex, ex.practice, device, { bar: 0, tick: 0 }, 0.6)
    expect(show(first.events)).toEqual([
      '0.000 click click accent',
      '0.000 exercise snare 0:0',
      '0.500 click click',
      '0.500 exercise snare 0:12',
    ])
    expect(first.next).toEqual({ bar: 0, tick: 15 })
    expect(first.nextTime).toBeCloseTo(0.625)

    // Halve the tempo a quarter of the way into beat 2: the rest of the beat stretches.
    const slower = { ...ex.practice, bpm: 60 }
    const second = schedule(ex, slower, device, first.next, 2)
    const absolute = second.events.map((e) => ({ ...e, time: first.nextTime + e.time }))
    expect(show(absolute)).toEqual([
      '1.375 click click',
      '1.375 exercise snare 0:24',
      '2.375 click click',
      '2.375 exercise snare 0:36',
    ])
  })
})

describe('starting playback', () => {
  it('goes straight to bar 1 when the count-in is off', () => {
    const ex = line(['x...'])
    const { events } = schedule(ex, ex.practice, { ...device, countIn: false }, 'start', 0.1)
    expect(show(events)).toEqual(['0.000 click click accent', '0.000 exercise snare 0:0'])
  })
})
