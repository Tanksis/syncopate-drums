import { describe, expect, it } from 'vitest'
import type { Bar, GroovePresetId, StaffEvent } from './index'
import { FIGURES, TICKS_PER_BAR, itemTicks, restBar, restItems, setBeat, setHold, staffParts, toggleCutShort, toggleTie } from './index'

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
  return hits.reduce<Bar[]>((bars, h, beat) => setBeat(bars, 'snare', 0, beat, h), [restBar()])
}

/** The same line in the kick row, over a resting snare row. */
const asKicks = (bars: Bar[]): Bar[] => bars.map((b) => ({ snare: restItems(), kick: b.snare }))

const hands = (bars: Bar[], groove: GroovePresetId, b = 0) => show(staffParts(bars, groove)[b].hands)
const feet = (bars: Bar[], groove: GroovePresetId, b = 0) => show(staffParts(bars, groove)[b].feet)

describe('one voice where the feet only play with the hands (ADR 0004)', () => {
  it("hangs the jazz hi-hat foot on the ride's stems, with no feet part", () => {
    const parts = staffParts(bar('....', '..x.', '....', 'x...'), 'jazz')[0]
    expect(show(parts.hands)).toEqual([
      '0 q ride',
      '12 e ride+hihatFoot',
      '18 e ride+snare',
      '24 q ride',
      '36 e ride+snare+hihatFoot',
      '42 e ride',
    ])
    expect(parts.feet).toEqual([])
  })

  it("hangs a kick row on the hi-hat's stems where every kick lands with the hands", () => {
    const parts = staffParts(asKicks(bar('x...', '..x.', 'x...', '..x.')), 'hihatEighths')[0]
    expect(show(parts.hands).slice(0, 4)).toEqual(['0 e hihat+bass', '6 e hihat', '12 e hihat', '18 e hihat+bass'])
    expect(parts.feet).toEqual([])
  })
})

describe('two voices where a foot plays on its own (ADR 0004)', () => {
  it("holds the hi-hat foot until the feet part's next note, not the ride's, and rests the feet where they are silent", () => {
    // The kick on the e of 3 falls between the ride's notes, so the feet keep their own voice.
    expect(show(staffParts(asKicks(bar('....', '....', '.x..', '....')), 'jazz')[0].feet)).toEqual([
      '0 q rest',
      '12 q hihatFoot',
      '24 s rest',
      '27 e. bass',
      '36 q hihatFoot',
    ])
  })
})

describe('the staff parts: hands up, feet down', () => {
  it('shares the stem of the jazz ride with a snare on the & of 2, with no rests in the hands part', () => {
    expect(hands(bar('....', '..x.', '....', '....'), 'jazz')).toEqual([
      '0 q ride',
      '12 e ride+hihatFoot',
      '18 e ride+snare',
      '24 q ride',
      '36 e ride+hihatFoot',
      '42 e ride',
    ])
  })

  it('hangs the feathered bass drum and the hi-hat foot on the ride, in one voice', () => {
    const line = bar('....', '..x.', '....', '....')
    expect(hands(line, 'jazzFeathered')).toEqual([
      '0 q ride+bass',
      '12 e ride+bass+hihatFoot',
      '18 e ride+snare',
      '24 q ride+bass',
      '36 e ride+bass+hihatFoot',
      '42 e ride',
    ])
    expect(feet(line, 'jazzFeathered')).toEqual([])
  })

  it("shares the hi-hat eighths' stems with the snare, with no rests", () => {
    // An eighth on 1, cut short, so the & of 1 is the hi-hat's alone.
    const line = toggleCutShort(bar('x...', '....', 'xxxx', '....'), 'snare', 0, 0)
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
    const tied = toggleTie(bar('x...', 'x.x.', '....', '....'), 'snare', 0, 1)
    expect(hands(tied, 'jazz').slice(0, 3)).toEqual(['0 q ride+snare', '12 e ride+hihatFoot', '18 e ride+snare'])
    expect(hands(tied, 'hihatEighths').slice(0, 4)).toEqual(['0 e hihat+snare', '6 e hihat', '12 e hihat', '18 e hihat+snare'])
  })

  it('keeps exact holds and ties where nothing else in the part strikes', () => {
    const tied = toggleTie(bar('x...', 'x.x.', '....', '....'), 'snare', 0, 1)
    expect(hands(tied, 'off').slice(0, 2)).toEqual(['0 q. snare', '18 e snare'])
    // Tied over the bar line: under jazz the snare stops at the ride on the & of 4; bare, it is tied on.
    const overBar = toggleTie(setBeat(setBeat([restBar(), restBar()], 'snare', 0, 3, 'x...'), 'snare', 1, 0, 'x...'), 'snare', 1, 0)
    expect(hands(overBar, 'jazz', 0).slice(-2)).toEqual(['36 e ride+snare+hihatFoot', '42 e ride'])
    expect(hands(overBar, 'jazz', 1)[0]).toBe('0 q ride')
    expect(hands(overBar, 'off', 0).at(-1)).toBe('36 q snare')
    expect(hands(overBar, 'off', 1)[0]).toBe('0 q ~snare')
  })

  it('writes the groove on the triplet grid in a triplet beat of the line, struck where it sounds', () => {
    const parts = staffParts(bar('....', 'xxx', '....', '....'), 'jazz')[0]
    expect(show(parts.hands).slice(1, 4)).toEqual(['12 e3 ride+snare+hihatFoot', '16 e3 snare', '20 e3 ride+snare'])
    expect(parts.hands.find((e) => e.start === 20)).toMatchObject({ strikes: [18, 20] })
    expect(hands(bar('x.x', '....', '....', '....'), 'hihatEighths').slice(0, 2)).toEqual([
      '0 q3 hihat+snare',
      '8 e3 hihat+snare',
    ])
  })

  it.each(['jazz', 'jazzFeathered', 'hihatEighths'] as const)(
    'fills every bar of each part it writes and never rests the hands under the %s groove, whatever the figures',
    (groove) => {
      const line = FIGURES.reduce<Bar[]>(
        (bars, figure, i) => setBeat(bars, 'snare', Math.floor(i / 4), i % 4, figure.hits),
        Array.from({ length: Math.ceil(FIGURES.length / 4) }, restBar),
      )
      const fills = (part: StaffEvent[]) => expect([0, TICKS_PER_BAR]).toContain(part.reduce((ticks, e) => ticks + itemTicks(e), 0))
      for (const { hands: h, feet: f } of staffParts(line, groove)) {
        expect(h.reduce((ticks, e) => ticks + itemTicks(e), 0)).toBe(TICKS_PER_BAR)
        fills(f)
        expect([...h, ...f].filter((e) => e.kind === 'rest')).toEqual([])
      }
      // As a kick row alone, the parts still fill every bar and the hands part never rests.
      for (const { hands: h, feet: f } of staffParts(asKicks(line), groove)) {
        expect(h.reduce((ticks, e) => ticks + itemTicks(e), 0)).toBe(TICKS_PER_BAR)
        fills(f)
        expect(h.filter((e) => e.kind === 'rest')).toEqual([])
      }
    },
  )

  it("labels only the exercise's notes with their ids, and each chord with the ticks it strikes", () => {
    const chord = staffParts(bar('....', '..x.', '....', '....'), 'jazz')[0].hands[2]
    expect(chord).toMatchObject({ kind: 'chord', start: 18, strikes: [18] })
    expect(chord.kind === 'chord' && chord.notes).toEqual([
      { drum: 'ride', key: 'f/5', notehead: 'x', tied: false },
      { drum: 'snare', key: 'c/5', notehead: 'normal', noteId: '0:18', tied: false },
    ])
  })
})

describe('a kick row alone: the feet part', () => {
  const bassFeet = (bars: Bar[], groove: GroovePresetId) => show(staffParts(asKicks(bars), groove)[0].feet)
  const bassHands = (bars: Bar[], groove: GroovePresetId) => show(staffParts(asKicks(bars), groove)[0].hands)
  const line = bar('x...', '..x.', '....', 'xx.x')
  const bare = ['0 q bass', '12 e rest', '18 e bass', '24 q rest', '36 s bass', '39 e bass', '45 s bass']

  it('rests a kick row alone in the feet part, even in a bar where it is silent, as a bass drum line was', () => {
    const [, silent] = staffParts(asKicks(setBeat([restBar(), restBar()], 'snare', 0, 0, 'x...')), 'off')
    expect(show(silent.feet)).toEqual(['0 q rest', '12 q rest', '24 q rest', '36 q rest'])
    expect(show(silent.hands)).toEqual(['0 q space', '12 q space', '24 q space', '36 q space'])
  })

  it('writes a bare kick row in the feet part with its rests, and the hands part as space', () => {
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
    // One voice: the line's bass drum on 1 hangs on the ride's stem.
    const [first] = staffParts(asKicks(bar('x...')), 'jazzFeathered')[0].hands
    expect(first).toMatchObject({ kind: 'chord', start: 0, strikes: [0] })
    expect(first.kind === 'chord' && first.notes).toEqual([
      { drum: 'ride', key: 'f/5', notehead: 'x', tied: false },
      { drum: 'bass', key: 'f/4', notehead: 'normal', noteId: 'kick:0:0', tied: false },
    ])
  })

  it('leaves the feet part to the line under the hi-hat eighths, with the hi-hat above and no rests', () => {
    expect(bassFeet(line, 'hihatEighths')).toEqual(bare)
    expect(bassHands(line, 'hihatEighths')).toEqual([0, 6, 12, 18, 24, 30, 36, 42].map((t) => `${t} e hihat`))
  })

  it('ends a held bass drum note at the next chord of the feet part, untied', () => {
    const held = toggleTie(bar('x...', 'x...', '....', '....'), 'snare', 0, 1)
    expect(bassFeet(held, 'off').slice(0, 3)).toEqual(['0 q. bass', '18 e ~bass', '24 q rest'])
    // A kick on the e of 3 keeps the feet apart under the jazz groove.
    const apart = setBeat(held, 'snare', 0, 2, '.x..')
    expect(bassFeet(apart, 'jazz').slice(0, 3)).toEqual(['0 q bass', '12 q hihatFoot', '24 s rest'])
    // Every kick with the ride: one voice, and the held bass drum ends at the ride's next stem.
    expect(bassHands(held, 'jazz').slice(0, 3)).toEqual(['0 q ride+bass', '12 e ride+hihatFoot', '18 e ride'])
  })
})

describe('the snare row and the kick row together (ADRs 0004, 0005)', () => {
  /** The bars with kick-row figures, one per beat of bar 1. */
  const withKicks = (bars: Bar[], ...hits: string[]) => hits.reduce((b, h, beat) => setBeat(b, 'kick', 0, beat, h), bars)
  const quarters = bar('x...', 'x...', 'x...', 'x...')

  it('writes a kick off the snare\'s hits in a feet part, stems down, with its rests: two voices', () => {
    const parts = staffParts(withKicks(quarters, '....', '..x.'), 'off')[0]
    expect(show(parts.hands)).toEqual(['0 q snare', '12 q snare', '24 q snare', '36 q snare'])
    expect(show(parts.feet)).toEqual(['0 q rest', '12 e rest', '18 e bass', '24 q rest', '36 q rest'])
    expect(parts.feet.find((e) => e.kind === 'chord')).toMatchObject({ notes: [{ noteId: 'kick:0:18' }] })
  })

  it("hangs kicks that land on the snare's hits on its stems: one voice", () => {
    const parts = staffParts(withKicks(quarters, 'x...', '....', 'x...'), 'off')[0]
    expect(show(parts.hands)).toEqual(['0 q snare+bass', '12 q snare', '24 q snare+bass', '36 q snare'])
    expect(parts.feet).toEqual([])
  })

  it('rests the snare row in a bar where only the kick plays, once the snare row has notes elsewhere', () => {
    const twoBars = withKicks(setBeat([restBar(), restBar()], 'snare', 1, 0, 'x...'), '.x..')
    const [first] = staffParts(twoBars, 'off')
    expect(show(first.hands)).toEqual(['0 q rest', '12 q rest', '24 q rest', '36 q rest'])
    expect(show(first.feet).slice(0, 2)).toEqual(['0 s rest', '3 e. bass'])
  })

  it('writes each row on its own grid in a beat they share: triplets in the snare, a quarter kick', () => {
    const parts = staffParts(withKicks(bar('.xx'), 'x...'), 'off')[0]
    expect(show(parts.hands).slice(0, 3)).toEqual(['0 e3 rest', '4 e3 snare', '8 e3 snare'])
    expect(show(parts.feet).slice(0, 2)).toEqual(['0 q bass', '12 q rest'])
  })
})

describe('swing written as triplets (ADR 0006)', () => {
  const swung = (bars: Bar[], groove: GroovePresetId, b = 0) => staffParts(bars, groove, { swung: true })[b]

  it("writes the jazz ride's beat 2 as a triplet group: ride, rest, ride", () => {
    const parts = swung([restBar()], 'jazz')
    expect(show(parts.hands)).toEqual([
      '0 q ride',
      '12 e3 ride+hihatFoot',
      '16 e3 rest',
      '20 e3 ride',
      '24 q ride',
      '36 e3 ride+hihatFoot',
      '40 e3 rest',
      '44 e3 ride',
    ])
    expect(parts.hands.find((e) => e.start === 20)).toMatchObject({ strikes: [18] })
  })

  it('writes snare quarters under the jazz ride as Groove Scribe does: one voice, chord, rest, ride on 2 and 4', () => {
    const parts = swung(bar('x...', 'x...', 'x...', 'x...'), 'jazz')
    expect(show(parts.hands)).toEqual([
      '0 q ride+snare',
      '12 e3 ride+snare+hihatFoot',
      '16 e3 rest',
      '20 e3 ride',
      '24 q ride+snare',
      '36 e3 ride+snare+hihatFoot',
      '40 e3 rest',
      '44 e3 ride',
    ])
    expect(parts.feet).toEqual([])
  })

  it('writes the snare row and the kick row swung too, sharing a chord on the let', () => {
    const line = setBeat(bar('x.x.', 'x...'), 'kick', 0, 0, '..x.')
    const parts = swung(line, 'off')
    expect(show(parts.hands)).toEqual(['0 e3 snare', '4 e3 rest', '8 e3 snare+bass', '12 q snare', '24 q rest', '36 q rest'])
    expect(parts.feet).toEqual([])
    expect(parts.hands.find((e) => e.start === 8)).toMatchObject({ strikes: [6] })
  })

  it('writes a kick on the & of 2 in the feet part on the let', () => {
    const line = setBeat(bar('x...', 'x...', 'x...', 'x...'), 'kick', 0, 1, '..x.')
    const parts = swung(line, 'off')
    expect(show(parts.hands)).toEqual(['0 q snare', '12 q snare', '24 q snare', '36 q snare'])
    expect(show(parts.feet).slice(1, 3)).toEqual(['12 q3 rest', '20 e3 bass'])
  })

  it('keeps a beat on sixteenths for every source when any has an e or an a', () => {
    expect(hands(bar('....', 'x.xx'), 'jazz').slice(1, 4)).toEqual([
      '12 e ride+snare+hihatFoot',
      '18 s ride+snare',
      '21 s snare',
    ])
    expect(show(swung(bar('....', 'x.xx'), 'jazz').hands).slice(1, 4)).toEqual(hands(bar('....', 'x.xx'), 'jazz').slice(1, 4))
    expect(show(swung(bar('....', '...x'), 'off').hands)).toEqual(hands(bar('....', '...x'), 'off'))
  })

  it('writes beats with only a downbeat, and beats entered on the triplet grid, as entered', () => {
    const line = bar('x...', 'x.x', 'xxx', '.x.')
    expect(show(swung(line, 'off').hands)).toEqual(hands(line, 'off'))
  })

  it('moves holds to the nearest triplet position, and ties on across the beat', () => {
    // The downbeat held one sixteenth, the & held into beat 2.
    const point = (beat: number, position: number) => ({ row: 'snare' as const, bar: 0, beat, position })
    const line = toggleTie(setHold(bar('x.x.', 'x...'), point(0, 0), point(0, 1)), 'snare', 0, 1)
    expect(show(swung(line, 'off').hands).slice(0, 4)).toEqual(['0 e3 snare', '4 e3 rest', '8 e3 snare', '12 q ~snare'])
  })

  it('writes exactly the current notation with swing off', () => {
    const line = setBeat(bar('x.x.', '..x.', 'x.xx', 'x.x'), 'kick', 0, 1, 'x.x.')
    for (const groove of ['off', 'jazz', 'jazzFeathered', 'hihatEighths'] as const) {
      expect(staffParts(line, groove, { swung: false })).toEqual(staffParts(line, groove))
    }
    expect(hands(bar('x.x.'), 'off').slice(0, 2)).toEqual(['0 e snare', '6 e snare'])
  })

  it('writes the straight hi-hat eighths swung, and still fills every bar', () => {
    const parts = swung([restBar()], 'hihatEighths')
    expect(show(parts.hands).slice(0, 3)).toEqual(['0 e3 hihat', '4 e3 rest', '8 e3 hihat'])
    expect(parts.hands.reduce((ticks, e) => ticks + itemTicks(e), 0)).toBe(TICKS_PER_BAR)
  })

  it.each(['off', 'jazz', 'jazzFeathered', 'hihatEighths'] as const)(
    'fills every bar of each part swung under the %s groove, whatever the figures in either row',
    (groove) => {
      const line = FIGURES.reduce<Bar[]>(
        (bars, figure, i) => setBeat(bars, 'snare', Math.floor(i / 4), i % 4, figure.hits),
        Array.from({ length: Math.ceil(FIGURES.length / 4) }, restBar),
      )
      for (const bars of [line, asKicks(line)]) {
        for (const { hands: h, feet: f } of staffParts(bars, groove, { swung: true })) {
          expect(h.reduce((ticks, e) => ticks + itemTicks(e), 0)).toBe(TICKS_PER_BAR)
          expect([0, TICKS_PER_BAR]).toContain(f.reduce((ticks, e) => ticks + itemTicks(e), 0))
        }
      }
    },
  )
})
