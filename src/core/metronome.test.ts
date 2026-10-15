import { describe, expect, it } from 'vitest'
import type { MetronomeSettings, ScheduledEvent } from './index'
import { DEFAULT_DEVICE_SETTINGS, DEFAULT_METRONOME_SETTINGS, SUBDIVISIONS, deviceSettingsFrom, cycleLevel, dialBpm, dialTurn, metronomeBeat, metronomeClickGain, metronomeSchedule, tapTempo, tempoName, playheadAt, recordEvents, withTimeSignature } from './index'

const at120: MetronomeSettings = { ...DEFAULT_METRONOME_SETTINGS, bpm: 120 }

/** Each event as its time, level and bar:tick, for comparing against a worked example. */
const heard = (events: ScheduledEvent[]) => events.map((e) => [e.time, e.level, `${e.position.bar}:${e.position.tick}`])

describe('metronome defaults', () => {
  it('are 92 BPM in 4/4, beat 1 accented, quarters, on the wood block', () => {
    expect(DEFAULT_METRONOME_SETTINGS).toMatchObject({
      bpm: 92,
      beats: 4,
      noteValue: 4,
      levels: ['accent', 'normal', 'normal', 'normal'],
      subdivision: 'quarter',
      sound: 'woodBlock',
    })
  })
})

describe('cycleLevel', () => {
  it('goes Accent, Normal, Soft, Off and back to Accent', () => {
    expect(cycleLevel('accent')).toBe('normal')
    expect(cycleLevel('normal')).toBe('soft')
    expect(cycleLevel('soft')).toBe('off')
    expect(cycleLevel('off')).toBe('accent')
  })
})

describe('withTimeSignature', () => {
  it('resets the blocks to beat 1 accented and the rest normal', () => {
    const edited = { ...DEFAULT_METRONOME_SETTINGS, levels: ['off', 'accent', 'soft', 'soft'] as const }
    const six = withTimeSignature({ ...edited, levels: [...edited.levels] }, 6, 8)
    expect(six.beats).toBe(6)
    expect(six.noteValue).toBe(8)
    expect(six.levels).toEqual(['accent', 'normal', 'normal', 'normal', 'normal', 'normal'])
  })

  it('keeps the other settings', () => {
    const fast = { ...DEFAULT_METRONOME_SETTINGS, bpm: 160, subdivision: 'triplet' as const }
    expect(withTimeSignature(fast, 3, 4)).toMatchObject({ bpm: 160, subdivision: 'triplet', levels: ['accent', 'normal', 'normal'] })
  })
})

describe('metronomeSchedule', () => {
  it('clicks once per beat at the BPM, beat 1 accented', () => {
    const { events, next, nextTime } = metronomeSchedule(at120, 'start', 2)
    expect(heard(events)).toEqual([
      [0, 'accent', '0:0'],
      [0.5, 'normal', '0:12'],
      [1, 'normal', '0:24'],
      [1.5, 'normal', '0:36'],
    ])
    expect(events.every((e) => e.kind === 'click' && e.instrument === 'click')).toBe(true)
    expect(events.map((e) => e.accent)).toEqual([true, false, false, false])
    expect(next).toEqual({ bar: 1, tick: 0 })
    expect(nextTime).toBe(2)
  })

  it('loops over bars forever', () => {
    const { events } = metronomeSchedule({ ...at120, beats: 2, levels: ['accent', 'normal'] }, { bar: 41, tick: 0 }, 2)
    expect(heard(events)).toEqual([
      [0, 'accent', '41:0'],
      [0.5, 'normal', '41:12'],
      [1, 'accent', '42:0'],
      [1.5, 'normal', '42:12'],
    ])
  })

  it('keeps a beat at 60 / BPM in 6/8, with six blocks to a bar', () => {
    const six = withTimeSignature(at120, 6, 8)
    const { events, next } = metronomeSchedule(six, 'start', 3)
    expect(events.map((e) => e.time)).toEqual([0, 0.5, 1, 1.5, 2, 2.5])
    expect(next).toEqual({ bar: 1, tick: 0 })
  })

  it('accents the start of each bar of 7/8', () => {
    const seven = withTimeSignature({ ...DEFAULT_METRONOME_SETTINGS, bpm: 240 }, 7, 8)
    const { events } = metronomeSchedule(seven, 'start', 3.5)
    expect(events.map((e) => e.time)).toEqual([0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25])
    expect(events.filter((e) => e.level === 'accent').map((e) => e.time)).toEqual([0, 1.75])
  })

  it('gives each beat its block level, Off included', () => {
    const levels: MetronomeSettings['levels'] = ['soft', 'off', 'accent', 'normal']
    const { events } = metronomeSchedule({ ...at120, levels }, 'start', 2)
    expect(events.map((e) => e.level)).toEqual(['soft', 'off', 'accent', 'normal'])
    expect(events.map((e) => e.accent)).toEqual([false, false, true, false])
  })

  it('carries on from where a window that splits a beat stopped', () => {
    const first = metronomeSchedule(at120, 'start', 0.7)
    expect(heard(first.events)).toEqual([
      [0, 'accent', '0:0'],
      [0.5, 'normal', '0:12'],
    ])
    const second = metronomeSchedule(at120, first.next, 1)
    const times = second.events.map((e) => first.nextTime + e.time)
    expect(times.map((t) => Math.round(t * 1000) / 1000)).toEqual([1, 1.5])
    expect(second.events.map((e) => e.position)).toEqual([
      { bar: 0, tick: 24 },
      { bar: 0, tick: 36 },
    ])
  })

  it('applies a new BPM from the position it is given', () => {
    const { events } = metronomeSchedule({ ...at120, bpm: 60 }, { bar: 0, tick: 12 }, 2)
    expect(heard(events)).toEqual([
      [0, 'normal', '0:12'],
      [1, 'normal', '0:24'],
    ])
  })

  it('starts the next bar when the time signature shrank under the position', () => {
    const three = withTimeSignature(at120, 3, 4)
    const { events } = metronomeSchedule(three, { bar: 5, tick: 36 }, 0.5)
    expect(heard(events)).toEqual([[0, 'accent', '6:0']])
  })
})

describe('subdivisions', () => {
  it('are the twelve pictures of the Rhythm sheet, in its order', () => {
    expect(SUBDIVISIONS.map((s) => s.id)).toEqual([
      'quarter',
      'eighths',
      'offbeatEighth',
      'dottedEighth',
      'triplet',
      'tripletFirstRest',
      'tripletMiddleRest',
      'tripletLastRest',
      'sixteenths',
      'eighthTwoSixteenths',
      'twoSixteenthsEighth',
      'sixteenthEighthSixteenth',
    ])
  })

  /** One beat at 60 BPM: each click's time and level. */
  const oneBeat = (subdivision: MetronomeSettings['subdivision']) =>
    metronomeSchedule({ ...DEFAULT_METRONOME_SETTINGS, bpm: 60, subdivision }, 'start', 1).events.map((e) => [
      Math.round(e.time * 1000) / 1000,
      e.level,
    ])

  it.each([
    ['quarter', [0]],
    ['eighths', [0, 0.5]],
    ['offbeatEighth', [0, 0.5]],
    ['dottedEighth', [0, 0.75]],
    ['triplet', [0, 0.333, 0.667]],
    ['tripletFirstRest', [0, 0.333, 0.667]],
    ['tripletMiddleRest', [0, 0.667]],
    ['tripletLastRest', [0, 0.333]],
    ['sixteenths', [0, 0.25, 0.5, 0.75]],
    ['eighthTwoSixteenths', [0, 0.5, 0.75]],
    ['twoSixteenthsEighth', [0, 0.25, 0.5]],
    ['sixteenthEighthSixteenth', [0, 0.25, 0.75]],
  ] as const)('%s clicks the beat and then its subdivision onsets', (id, times) => {
    expect(oneBeat(id)).toEqual(times.map((t, i) => [t, i === 0 ? 'accent' : 'subdivision']))
  })

  it('keep a rested first onset in the picture but leave the beat to its block', () => {
    expect(SUBDIVISIONS.find((s) => s.id === 'offbeatEighth')?.onsets).toEqual([1 / 2])
    expect(SUBDIVISIONS.find((s) => s.id === 'tripletFirstRest')?.onsets).toEqual([1 / 3, 2 / 3])
  })

  it('click on every beat of the bar, an Off beat included', () => {
    const levels: MetronomeSettings['levels'] = ['accent', 'off']
    const { events } = metronomeSchedule({ ...at120, beats: 2, levels, subdivision: 'eighths' }, 'start', 1)
    expect(heard(events)).toEqual([
      [0, 'accent', '0:0'],
      [0.25, 'subdivision', '0:6'],
      [0.5, 'off', '0:12'],
      [0.75, 'subdivision', '0:18'],
    ])
    expect(events.every((e) => !e.accent || e.level === 'accent')).toBe(true)
  })
})

describe('tapTempo', () => {
  it('needs two taps', () => {
    expect(tapTempo([])).toBeUndefined()
    expect(tapTempo([1000])).toBeUndefined()
  })

  it('reads the BPM from the gap between taps, in milliseconds', () => {
    expect(tapTempo([1000, 1500])).toBe(120)
    expect(tapTempo([0, 600, 1200])).toBe(100)
  })

  it('averages the last four gaps at most', () => {
    // A slow first gap, then four at 500 ms.
    expect(tapTempo([0, 1000, 1500, 2000, 2500, 3000])).toBe(120)
    // Gaps of 400, 500, 600 and 500 ms average 500.
    expect(tapTempo([0, 400, 900, 1500, 2000])).toBe(120)
  })

  it('restarts after a gap over 2 seconds', () => {
    expect(tapTempo([0, 500, 2600])).toBeUndefined()
    expect(tapTempo([0, 500, 2600, 3100])).toBe(120)
  })

  it('keeps the BPM in the metronome range, as a whole number', () => {
    expect(tapTempo([0, 100])).toBe(300)
    expect(tapTempo([0, 700])).toBe(86)
  })
})

describe('tempoName', () => {
  it.each([
    [20, 'Largo'],
    [59, 'Largo'],
    [60, 'Adagio'],
    [75, 'Adagio'],
    [76, 'Andante'],
    [107, 'Andante'],
    [108, 'Moderato'],
    [119, 'Moderato'],
    [120, 'Allegro'],
    [167, 'Allegro'],
    [168, 'Presto'],
    [300, 'Presto'],
  ])('calls %i BPM %s', (bpm, name) => {
    expect(tempoName(bpm)).toBe(name)
  })
})

describe('stored device settings', () => {
  it('open on Practice with the default metronome when none is stored', () => {
    expect(deviceSettingsFrom({ countIn: false })).toMatchObject({ screen: 'practice', metronome: DEFAULT_METRONOME_SETTINGS })
  })

  it('keep the screen last used', () => {
    expect(deviceSettingsFrom({ screen: 'metronome' }).screen).toBe('metronome')
    expect(deviceSettingsFrom({ screen: 'tuner' }).screen).toBe('practice')
  })

  it('keep a stored metronome', () => {
    const metronome: MetronomeSettings = {
      bpm: 140,
      beats: 7,
      noteValue: 8,
      levels: ['accent', 'normal', 'soft', 'off', 'accent', 'normal', 'normal'],
      subdivision: 'tripletMiddleRest',
      sound: 'rideBell',
      beatVolume: 0.8,
      subdivisionVolume: 0.4,
    }
    expect(deviceSettingsFrom({ metronome }).metronome).toEqual(metronome)
  })

  it('fill in metronome settings added since it was stored', () => {
    expect(deviceSettingsFrom({ metronome: { bpm: 70 } }).metronome).toEqual({ ...DEFAULT_METRONOME_SETTINGS, bpm: 70 })
  })

  it('fall back to the default sound or subdivision for one the app does not have', () => {
    const { metronome } = deviceSettingsFrom({ metronome: { sound: 'gong', subdivision: 'quintuplet' } })
    expect(metronome).toMatchObject({ sound: 'woodBlock', subdivision: 'quarter' })
  })

  it('pad the levels with Normal, or cut them, to the beats', () => {
    expect(deviceSettingsFrom({ metronome: { beats: 5, levels: ['soft', 'off'] } }).metronome.levels).toEqual([
      'soft',
      'off',
      'normal',
      'normal',
      'normal',
    ])
    expect(deviceSettingsFrom({ metronome: { beats: 2, levels: ['soft', 'off', 'accent'] } }).metronome.levels).toEqual(['soft', 'off'])
  })

  it('reset the levels for the beats when they are not a list of levels', () => {
    expect(deviceSettingsFrom({ metronome: { beats: 3, levels: 'loud' } }).metronome.levels).toEqual(['accent', 'normal', 'normal'])
    expect(deviceSettingsFrom({ metronome: { levels: ['accent', 'loud', 'off', 'soft'] } }).metronome.levels).toEqual([
      'accent',
      'normal',
      'off',
      'soft',
    ])
  })

  it('keep the BPM, beats, note value and volumes in range', () => {
    const stored = { bpm: 500, beats: 40, noteValue: 3, beatVolume: 9, subdivisionVolume: -1 }
    expect(deviceSettingsFrom({ metronome: stored }).metronome).toMatchObject({
      bpm: 300,
      beats: 4,
      noteValue: 4,
      beatVolume: 1.5,
      subdivisionVolume: 0,
    })
    expect(deviceSettingsFrom({ metronome: { bpm: 'fast', beats: 2.5 } }).metronome).toMatchObject({ bpm: 92, beats: 4 })
  })

  it('use the default metronome when the stored one is not an object', () => {
    expect(deviceSettingsFrom({ metronome: 'loud' }).metronome).toEqual(DEFAULT_DEVICE_SETTINGS.metronome)
  })
})

describe('metronomeClickGain', () => {
  const gain = (level: Parameters<typeof metronomeClickGain>[0], settings: Partial<MetronomeSettings> = {}) =>
    metronomeClickGain(level, { ...DEFAULT_METRONOME_SETTINGS, ...settings })

  it('plays Accent loudest, then Normal, then Soft, and Off silent', () => {
    expect(gain('accent')).toBe(1)
    expect(gain('normal')).toBeLessThan(gain('accent'))
    expect(gain('soft')).toBeLessThan(gain('normal'))
    expect(gain('soft')).toBeGreaterThan(0)
    expect(gain('off')).toBe(0)
  })

  it('plays subdivision clicks quieter than a normal beat', () => {
    expect(gain('subdivision')).toBeGreaterThan(0)
    expect(gain('subdivision')).toBeLessThan(gain('normal'))
  })

  it('scales the beats by the beats volume and the subdivision clicks by theirs', () => {
    expect(gain('accent', { beatVolume: 0.5 })).toBe(0.5)
    expect(gain('normal', { beatVolume: 0 })).toBe(0)
    expect(gain('subdivision', { beatVolume: 0 })).toBe(gain('subdivision'))
    expect(gain('subdivision', { subdivisionVolume: 1.5 })).toBeCloseTo(gain('subdivision') * 1.5)
    expect(gain('accent', { subdivisionVolume: 0 })).toBe(1)
  })
})

describe('metronomeBeat', () => {
  // Eighths at 120 BPM in 4/4: a beat every 0.5 s, an & 0.25 s after each, scheduled from time 10.
  const eighths: MetronomeSettings = { ...at120, subdivision: 'eighths' }
  const timeline = recordEvents([], metronomeSchedule(eighths, 'start', 4).events, 10)
  const beatHeardAt = (time: number) => metronomeBeat(playheadAt(timeline, time)!.position)

  it('is the beat heard, counted from 0, held through its subdivision clicks', () => {
    expect(beatHeardAt(10)).toEqual({ bar: 0, beat: 0 })
    expect(beatHeardAt(10.3)).toEqual({ bar: 0, beat: 0 })
    expect(beatHeardAt(10.5)).toEqual({ bar: 0, beat: 1 })
    expect(beatHeardAt(11.9)).toEqual({ bar: 0, beat: 3 })
  })

  it('carries on into the next bar', () => {
    expect(beatHeardAt(12)).toEqual({ bar: 1, beat: 0 })
    expect(beatHeardAt(13.6)).toEqual({ bar: 1, beat: 3 })
  })
})

describe('the dial', () => {
  it('turns clockwise as positive, in turns, by points around its centre on the screen', () => {
    // From the top to the right is a quarter turn clockwise, with y growing downwards.
    expect(dialTurn({ x: 0, y: -10 }, { x: 10, y: 0 })).toBeCloseTo(0.25)
    expect(dialTurn({ x: 10, y: 0 }, { x: 0, y: -10 })).toBeCloseTo(-0.25)
  })

  it('reads a small move across the left of the ring as the small turn it is', () => {
    // Just above the left, then just below it: a little anticlockwise, not most of a turn.
    expect(dialTurn({ x: -10, y: -1 }, { x: -10, y: 1 })).toBeCloseTo(-0.0317, 3)
    expect(dialTurn({ x: -10, y: 1 }, { x: -10, y: -1 })).toBeCloseTo(0.0317, 3)
  })

  it('moves the BPM 60 for a whole turn from where the drag began, as a whole number', () => {
    expect(dialBpm(92, 0.25)).toBe(107)
    expect(dialBpm(92, -0.1)).toBe(86)
    expect(dialBpm(92, 1 / 120)).toBe(93) // half a BPM rounds up
  })

  it("stops at the metronome's slowest and fastest", () => {
    expect(dialBpm(30, -1)).toBe(20)
    expect(dialBpm(280, 2)).toBe(300)
  })
})
