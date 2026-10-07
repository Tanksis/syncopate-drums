import { describe, expect, it } from 'vitest'
import type { Bar, GroovePresetId, StaffEvent } from './index'
import { FIGURES, TICKS_PER_BAR, itemTicks, restBar, setBeat, staffParts, toggleCutShort, toggleTie } from './index'

/**
 * A part in shorthand, one event per entry: its start tick, its value (q e s, `.` for a dot, 3 for
 * a triplet), then its drums joined by `+` (a tied continuation prefixed `~`), `rest`, or `space`.
 */
function show(events: readonly StaffEvent[]): string[] {
  return events.map((e) => {
    const value = { quarter: 'q', eighth: 'e', sixteenth: 's' }[e.duration] + (e.dotted ? '.' : '') + (e.triplet ? '3' : '')
    const what = e.kind === 'chord' ? e.notes.map((n) => (n.tied ? '~' : '') + n.drum).join('+') : e.kind
    return `${e.start} ${value} ${what}`
  })
}

/** One bar written beat by beat with figure hits. */
function bar(...hits: string[]): Bar[] {
  return hits.reduce<Bar[]>((bars, h, beat) => setBeat(bars, 0, beat, h), [restBar()])
}

const hands = (bars: Bar[], groove: GroovePresetId, b = 0) => show(staffParts(bars, 'snare', groove)[b].hands)
const feet = (bars: Bar[], groove: GroovePresetId, b = 0) => show(staffParts(bars, 'snare', groove)[b].feet)

describe('the staff parts: hands up, feet down', () => {
  it('shares the stem of the jazz ride with a snare on the & of 2, with no rests in the hands part', () => {
    expect(hands(bar('....', '..x.', '....', '....'), 'jazz')).toEqual([
      '0 q ride',
      '12 e ride',
      '18 e ride+snare',
      '24 q ride',
      '36 e ride',
      '42 e ride',
    ])
  })

  it("writes the jazz groove's hi-hat foot in the feet part with space, not rests, where it is silent", () => {
    expect(feet(bar('....', '..x.', '....', '....'), 'jazz')).toEqual([
      '0 q space',
      '12 e hihatFoot',
      '18 e space',
      '24 q space',
      '36 e hihatFoot',
      '42 e space',
    ])
  })

  it('puts the feathered bass drum with the hi-hat foot in the feet part and keeps the hands as in jazz', () => {
    const line = bar('....', '..x.', '....', '....')
    expect(feet(line, 'jazzFeathered')).toEqual([
      '0 q bass',
      '12 e bass+hihatFoot',
      '18 e space',
      '24 q bass',
      '36 e bass+hihatFoot',
      '42 e space',
    ])
    expect(hands(line, 'jazzFeathered')).toEqual(hands(line, 'jazz'))
  })

  it("shares the hi-hat eighths' stems with the snare, with no rests", () => {
    // An eighth on 1, cut short, so the & of 1 is the hi-hat's alone.
    const line = toggleCutShort(bar('x...', '....', 'xxxx', '....'), 0, 0)
    expect(hands(line, 'hihatEighths')).toEqual([
      '0 e hihat+snare',
      '6 e hihat',
      '12 e hihat',
      '18 e hihat',
      '24 s hihat+snare',
      '27 s snare',
      '30 s hihat+snare',
      '33 s snare',
      '36 e hihat',
      '42 e hihat',
    ])
    expect(feet(bar('x...'), 'hihatEighths')).toEqual(['0 q space', '12 q space', '24 q space', '36 q space'])
  })

  it('writes a bare snare line stems up with its rests, as the speller spells it', () => {
    const line = bar('x...', '..x.', '....', 'xx.x')
    expect(hands(line, 'off')).toEqual([
      '0 q snare',
      '12 e rest',
      '18 e snare',
      '24 q rest',
      '36 s snare',
      '39 e snare',
      '45 s snare',
    ])
    expect(feet(line, 'off')).toEqual(['0 q space', '12 q space', '24 q space', '36 q space'])
  })

  it("ends a held snare note at its part's next chord, with no tie, under a groove", () => {
    // Decided 2026-10-07: a hold is not tied on through the groove's chords.
    const quarters = bar('x...', 'x...', 'x...', 'x...')
    expect(hands(quarters, 'hihatEighths')).toEqual([
      '0 e hihat+snare',
      '6 e hihat',
      '12 e hihat+snare',
      '18 e hihat',
      '24 e hihat+snare',
      '30 e hihat',
      '36 e hihat+snare',
      '42 e hihat',
    ])
    const tied = toggleTie(bar('x...', 'x.x.', '....', '....'), 0, 1)
    expect(hands(tied, 'jazz').slice(0, 3)).toEqual(['0 q ride+snare', '12 e ride', '18 e ride+snare'])
    expect(hands(tied, 'hihatEighths').slice(0, 4)).toEqual(['0 e hihat+snare', '6 e hihat', '12 e hihat', '18 e hihat+snare'])
  })

  it('keeps exact holds and ties where nothing else in the part strikes', () => {
    const tied = toggleTie(bar('x...', 'x.x.', '....', '....'), 0, 1)
    expect(hands(tied, 'off').slice(0, 2)).toEqual(['0 q. snare', '18 e snare'])
    // Tied over the bar line: under jazz the snare stops at the ride on the & of 4; bare, it is tied on.
    const overBar = toggleTie(setBeat(setBeat([restBar(), restBar()], 0, 3, 'x...'), 1, 0, 'x...'), 1, 0)
    expect(hands(overBar, 'jazz', 0).slice(-2)).toEqual(['36 e ride+snare', '42 e ride'])
    expect(hands(overBar, 'jazz', 1)[0]).toBe('0 q ride')
    expect(hands(overBar, 'off', 0).at(-1)).toBe('36 q snare')
    expect(hands(overBar, 'off', 1)[0]).toBe('0 q ~snare')
  })

  it('writes the groove on the triplet grid in a triplet beat of the line, struck where it sounds', () => {
    const parts = staffParts(bar('....', 'xxx', '....', '....'), 'snare', 'jazz')[0]
    expect(show(parts.hands).slice(1, 4)).toEqual(['12 e3 ride+snare', '16 e3 snare', '20 e3 ride+snare'])
    expect(parts.hands.find((e) => e.start === 20)).toMatchObject({ strikes: [18, 20] })
    // The feet part has no triplets of its own.
    expect(show(parts.feet).slice(1, 3)).toEqual(['12 e hihatFoot', '18 e space'])
    expect(hands(bar('x.x', '....', '....', '....'), 'hihatEighths').slice(0, 2)).toEqual([
      '0 q3 hihat+snare',
      '8 e3 hihat+snare',
    ])
  })

  it.each(['jazz', 'jazzFeathered', 'hihatEighths'] as const)(
    'fills every bar of both parts and never rests the hands under the %s groove, whatever the figures',
    (groove) => {
      const line = FIGURES.reduce<Bar[]>(
        (bars, figure, i) => setBeat(bars, Math.floor(i / 4), i % 4, figure.hits),
        Array.from({ length: Math.ceil(FIGURES.length / 4) }, restBar),
      )
      for (const { hands: h, feet: f } of staffParts(line, 'snare', groove)) {
        for (const part of [h, f]) {
          expect(part.reduce((ticks, e) => ticks + itemTicks(e), 0)).toBe(TICKS_PER_BAR)
        }
        expect([...h, ...f].filter((e) => e.kind === 'rest')).toEqual([])
      }
      // As a bass drum line, both parts still fill every bar and the hands part (groove only) never rests.
      for (const { hands: h, feet: f } of staffParts(line, 'bass', groove)) {
        for (const part of [h, f]) {
          expect(part.reduce((ticks, e) => ticks + itemTicks(e), 0)).toBe(TICKS_PER_BAR)
        }
        expect(h.filter((e) => e.kind === 'rest')).toEqual([])
      }
    },
  )

  it("labels only the exercise's notes with their ids, and each chord with the ticks it strikes", () => {
    const chord = staffParts(bar('....', '..x.', '....', '....'), 'snare', 'jazz')[0].hands[2]
    expect(chord).toMatchObject({ kind: 'chord', start: 18, strikes: [18] })
    expect(chord.kind === 'chord' && chord.notes).toEqual([
      { drum: 'ride', key: 'f/5', notehead: 'x', tied: false },
      { drum: 'snare', key: 'c/5', notehead: 'normal', noteId: '0:18', tied: false },
    ])
  })
})

describe('a bass drum line: the feet part', () => {
  const bassFeet = (bars: Bar[], groove: GroovePresetId) => show(staffParts(bars, 'bass', groove)[0].feet)
  const bassHands = (bars: Bar[], groove: GroovePresetId) => show(staffParts(bars, 'bass', groove)[0].hands)
  const line = bar('x...', '..x.', '....', 'xx.x')
  const bare = ['0 q bass', '12 e rest', '18 e bass', '24 q rest', '36 s bass', '39 e bass', '45 s bass']

  it('writes a bare bass drum line in the feet part with its rests, and the hands part as space', () => {
    expect(bassFeet(line, 'off')).toEqual(bare)
    expect(bassHands(line, 'off')).toEqual(['0 q space', '12 q space', '24 q space', '36 q space'])
  })

  it('shares stems with the jazz hi-hat foot, resting only where the feet are silent, with the ride above', () => {
    expect(bassFeet(line, 'jazz')).toEqual([
      '0 q bass',
      '12 e hihatFoot',
      '18 e bass',
      '24 q rest',
      '36 s bass+hihatFoot',
      '39 e bass',
      '45 s bass',
    ])
    expect(bassHands(line, 'jazz')).toEqual(['0 q ride', '12 e ride', '18 e ride', '24 q ride', '36 e ride', '42 e ride'])
  })

  it("writes one bass drum, the line's, where it meets the feathered bass drum", () => {
    expect(bassFeet(line, 'jazzFeathered')).toEqual([
      '0 q bass',
      '12 e bass+hihatFoot',
      '18 e bass',
      '24 q bass',
      '36 s bass+hihatFoot',
      '39 e bass',
      '45 s bass',
    ])
    const [first] = staffParts(bar('x...'), 'bass', 'jazzFeathered')[0].feet
    expect(first).toMatchObject({ kind: 'chord', start: 0, strikes: [0] })
    expect(first.kind === 'chord' && first.notes).toEqual([
      { drum: 'bass', key: 'f/4', notehead: 'normal', noteId: '0:0', tied: false },
    ])
  })

  it('leaves the feet part to the line under the hi-hat eighths, with the hi-hat above and no rests', () => {
    expect(bassFeet(line, 'hihatEighths')).toEqual(bare)
    expect(bassHands(line, 'hihatEighths')).toEqual([0, 6, 12, 18, 24, 30, 36, 42].map((t) => `${t} e hihat`))
  })

  it('ends a held bass drum note at the next chord of the feet part, untied', () => {
    const held = toggleTie(bar('x...', 'x...', '....', '....'), 0, 1)
    expect(bassFeet(held, 'off').slice(0, 3)).toEqual(['0 q. bass', '18 e ~bass', '24 q rest'])
    expect(bassFeet(held, 'jazz').slice(0, 3)).toEqual(['0 q bass', '12 e hihatFoot', '18 e rest'])
  })
})
