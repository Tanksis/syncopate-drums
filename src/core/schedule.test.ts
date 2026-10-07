import { describe, expect, it } from 'vitest'
import type { DeviceSettings, Exercise, GroovePresetId, PlayPosition, ScheduledEvent } from './index'
import { DEFAULT_DEVICE_SETTINGS, newExercise, schedule, setBeat, toggleTie } from './index'

const device: DeviceSettings = DEFAULT_DEVICE_SETTINGS

/** A blank exercise, played straight unless a test swings it. */
const blank = (bpm = 120): Exercise => {
  const ex = newExercise({ id: 'e1', now: 0 })
  return { ...ex, practice: { ...ex.practice, bpm, swing: 0.5 } }
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

/** An exercise from beat figures, one string per beat: `['x.x.', 'xxx', '....', …]`. */
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

  it('places triplet notes at thirds of the beat, next to straight beats', () => {
    const ex = line(['x.x.', 'xxx', 'x.x', '....'], 60)
    const { events } = schedule(ex, ex.practice, device, { bar: 0, tick: 0 }, 3.1)
    expect(show(events)).toEqual([
      '0.000 click click accent',
      '0.000 exercise snare 0:0',
      '0.500 exercise snare 0:6',
      '1.000 click click',
      '1.000 exercise snare 0:12',
      '1.333 exercise snare 0:16',
      '1.667 exercise snare 0:20',
      '2.000 click click',
      '2.000 exercise snare 0:24',
      '2.667 exercise snare 0:32',
      '3.000 click click',
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

describe('ties', () => {
  it("doesn't strike tied continuations, also across a bar line", () => {
    const ex = line(['x...', '..x.', 'x...', '..x.', 'x.x.'], 60)
    const bars = toggleTie(toggleTie(ex.bars, 0, 2), 1, 0)
    const tied = { ...ex, bars }
    const { events } = schedule(tied, tied.practice, device, { bar: 0, tick: 0 }, 5)
    expect(events.filter((e) => e.kind === 'exercise').map((e) => e.noteId)).toEqual(['0:0', '0:18', '0:42', '1:6'])
  })
})

describe('a loop range', () => {
  // Bars 1–4, each with a note on beat 1 and one on beat 4's last sixteenth.
  const four = () => line(Array.from({ length: 4 }, () => ['x...', '....', '....', '...x']).flat())
  const looping = (ex: Exercise, first: number, last: number) => ({ ...ex.practice, loopRange: { first, last } })
  /** The bar each downbeat click falls in. */
  const downbeats = (events: ScheduledEvent[]) => events.filter((e) => e.kind === 'click' && e.accent).map((e) => e.position.bar)

  it('wraps from the end of its last bar back to its first bar', () => {
    const ex = four()
    const { events, next } = schedule(ex, looping(ex, 1, 2), device, { bar: 2, tick: 36 }, 0.6)
    expect(show(events)).toEqual([
      '0.000 click click',
      '0.375 exercise snare 2:45',
      '0.500 click click accent',
      '0.500 exercise snare 1:0',
    ])
    expect(next).toEqual({ bar: 1, tick: 3 })
  })

  it('goes from the count-in to the first bar of the range, and does not count in again on wraps', () => {
    const ex = four()
    const { events } = schedule(ex, looping(ex, 2, 2), device, 'start', 4.1)
    expect(downbeats(events)).toEqual([-1, 2, 2])
    expect(events.filter((e) => e.kind === 'exercise').map((e) => e.noteId)).toEqual(['2:0', '2:45', '2:0'])
  })

  it('applies a change at the next wrap when the playhead is inside the new range', () => {
    const ex = four()
    // Playing the whole exercise, halfway through bar 2; the loop narrows to bars 1–2.
    const { events } = schedule(ex, looping(ex, 0, 1), device, { bar: 1, tick: 24 }, 1.1)
    expect(downbeats(events)).toEqual([0])
    expect(events.filter((e) => e.kind === 'exercise').map((e) => e.noteId)).toEqual(['1:45', '0:0'])
  })

  it('jumps to the start of the range at once when the playhead is past its new end', () => {
    const ex = four()
    const { events } = schedule(ex, looping(ex, 0, 1), device, { bar: 3, tick: 24 }, 0.1)
    expect(show(events)).toEqual(['0.000 click click accent', '0.000 exercise snare 0:0'])
  })

  it('keeps inside the exercise when bars beyond the range were deleted', () => {
    const ex = line(['x...', '....', '....', '....'])
    const { events } = schedule(ex, looping(ex, 2, 5), device, { bar: 0, tick: 36 }, 0.6)
    expect(downbeats(events)).toEqual([0])
  })
})

describe('swing', () => {
  /** Where each struck note lands, as a fraction of the beat it is in. */
  const landings = (ex: Exercise) => {
    const beat = 60 / ex.practice.bpm
    const { events } = schedule(ex, ex.practice, device, { bar: 0, tick: 0 }, 4 * beat)
    return events.filter((e) => e.kind === 'exercise').map((e) => +((e.time / beat) % 4).toFixed(3))
  }
  const swung = (beats: string[], bpm: number, swing: number) => {
    const ex = line(beats, bpm)
    return { ...ex, practice: { ...ex.practice, swing } }
  }

  it('at 180 BPM with 66.7% swing puts the & of 1 at 0.62 of the beat and leaves a triplet at 2/3', () => {
    expect(landings(swung(['x.x.', 'xxx', '....', '....'], 180, 2 / 3))).toEqual([0, 0.617, 1, 1.333, 1.667])
  })

  it('applies the full amount at 120 BPM and below', () => {
    expect(landings(swung(['x.x.', 'x.x.', '....', '....'], 120, 0.75))).toEqual([0, 0.75, 1, 1.75])
    expect(landings(swung(['x.x.', 'x.x.', '....', '....'], 60, 0.58))).toEqual([0, 0.58, 1, 1.58])
  })

  it('plays straight by 320 BPM', () => {
    expect(landings(swung(['x.x.', '....', '....', '....'], 320, 0.75))).toEqual([0, 0.5])
  })

  it('puts the e halfway through the long eighth and the a halfway through the short one', () => {
    expect(landings(swung(['xxxx', '....', '....', '....'], 100, 2 / 3))).toEqual([0, 0.333, 0.667, 0.833])
  })

  it('swings the binary part of every beat, beside unmoved triplet beats', () => {
    expect(landings(swung(['xxx', 'x.x.', 'xxx', '.xxx'], 120, 0.62))).toEqual([
      0, 0.333, 0.667, 1, 1.62, 2, 2.333, 2.667, 3.31, 3.62, 3.81,
    ])
  })
})

describe('the groove layer', () => {
  /** A blank exercise at 60 BPM (a beat a second) with a groove preset, played straight unless swung. */
  const grooved = (groove: GroovePresetId, swing = 0.5): Exercise => {
    const ex = blank(60)
    return { ...ex, practice: { ...ex.practice, groove, swing } }
  }
  const grooveHits = (ex: Exercise, from: PlayPosition | 'start' = { bar: 0, tick: 0 }, window = 4) =>
    show(schedule(ex, ex.practice, device, from, window).events.filter((e) => e.kind === 'groove'))

  it('plays the jazz ride pattern with the hi-hat foot on 2 and 4', () => {
    expect(grooveHits(grooved('jazz'))).toEqual([
      '0.000 groove ride',
      '1.000 groove ride',
      '1.000 groove hihatPedal',
      '1.500 groove ride',
      '2.000 groove ride',
      '3.000 groove ride',
      '3.000 groove hihatPedal',
      '3.500 groove ride',
    ])
  })

  it('adds the feathered bass drum on all four beats to the jazz pattern', () => {
    expect(grooveHits(grooved('jazzFeathered'))).toEqual([
      '0.000 groove ride',
      '0.000 groove kickFeathered',
      '1.000 groove ride',
      '1.000 groove hihatPedal',
      '1.000 groove kickFeathered',
      '1.500 groove ride',
      '2.000 groove ride',
      '2.000 groove kickFeathered',
      '3.000 groove ride',
      '3.000 groove hihatPedal',
      '3.000 groove kickFeathered',
      '3.500 groove ride',
    ])
  })

  it('plays straight eighths on the closed hi-hat', () => {
    expect(grooveHits(grooved('hihatEighths'))).toEqual(
      [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map((t) => `${t.toFixed(3)} groove hihatClosed`),
    )
  })

  it('plays nothing when off', () => {
    expect(grooveHits(grooved('off'))).toEqual([])
  })

  it('swings with the exercise', () => {
    expect(grooveHits(grooved('jazz', 2 / 3))).toContain('1.667 groove ride')
    expect(grooveHits(grooved('hihatEighths', 0.75)).slice(0, 2)).toEqual([
      '0.000 groove hihatClosed',
      '0.750 groove hihatClosed',
    ])
  })

  it('plays in every bar of every pass round the loop, but not in the count-in', () => {
    const ex = grooved('hihatEighths')
    const { events } = schedule(ex, ex.practice, device, 'start', 12)
    const bars = events.filter((e) => e.kind === 'groove').map((e) => e.position.bar)
    expect(bars).toEqual([...Array(8).fill(0), ...Array(8).fill(0)])
    expect(events.find((e) => e.kind === 'groove')?.time).toBe(4)
  })

  it('keeps the events in time order when a swung & lands after a triplet', () => {
    const ex = { ...line(['....', 'xxx', '....', '....'], 60), practice: { ...grooved('hihatEighths', 0.75).practice } }
    const { events } = schedule(ex, ex.practice, device, { bar: 0, tick: 0 }, 4)
    const times = events.map((e) => e.time)
    expect(times).toEqual([...times].sort((a, b) => a - b))
    expect(show(events).slice(4, 8)).toEqual([
      '1.000 exercise snare 0:12',
      '1.000 groove hihatClosed',
      '1.333 exercise snare 0:16',
      '1.667 exercise snare 0:20',
    ])
  })
})
