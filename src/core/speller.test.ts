import { describe, expect, it } from 'vitest'
import type { Bar, Item, Row } from './index'
import { FIGURES, REST_FIGURE, TICKS_PER_BAR, beatViews, clearBeatToDownbeat, itemTicks, restBar, restItems, setBeat, setHold, toggleCutShort, toggleHit, toggleTie } from './index'

/** A row in shorthand: q e s for note values, `.` for a dot, 3 for a triplet, r for a rest, ~ for a tie. */
function text(bars: Bar[], row: Row = 'snare'): string {
  const value = (i: Item) =>
    ({ quarter: 'q', eighth: 'e', sixteenth: 's' })[i.duration] + (i.dotted ? '.' : '') + (i.triplet ? '3' : '')
  return bars
    .map((bar) =>
      bar[row]
        .map((i) => (i.kind === 'rest' ? 'r' + value(i) : value(i) + (i.tiedToNext ? '~' : '')))
        .join(' '),
    )
    .join(' | ')
}

/** The snare row's beats as the editor shows them, each with the beat's shared grid. */
function snareViews(bars: Bar[], tripletBeats?: number[]) {
  return beatViews(bars, tripletBeats).map((beats) => beats.map((v) => ({ ...v.snare, triplet: v.triplet })))
}

function bar(...hits: string[]): Bar[] {
  return hits.reduce<Bar[]>((bars, h, beat) => setBeat(bars, 'snare', 0, beat, h), [restBar()])
}

describe('the auto-speller', () => {
  it.each([
    ['1', 'q'],
    ['2', 'e e'],
    ['3', 're e'],
    ['4', 's s s s'],
    ['5', 'e s s'],
    ['6', 's s e'],
    ['7', 'e. s'],
    ['8', 's e s'],
    ['9', 'rs s s s'],
    ['0', 're s s'],
    ['z', 'rs e.'],
    ['x', 're. s'],
    ['c', 'rs s e'],
    ['v', 'rs e s'],
    ['b', 's e.'],
  ])('spells figure %s as %s', (key, spelled) => {
    const figure = FIGURES.find((f) => f.key === key)!
    expect(text(bar(figure.hits))).toBe(`${spelled} rq rq rq`)
  })

  it.each([
    ['a', 'e3 e3 e3'],
    ['s', 'q3 e3'],
    ['d', 'e3 q3'],
    ['f', 're3 e3 e3'],
    ['g', 're3 q3'],
    ['h', 'rq3 e3'],
  ])('spells triplet figure %s as %s, a one-beat triplet group', (key, spelled) => {
    const figure = FIGURES.find((f) => f.key === key)!
    expect(text(bar(figure.hits))).toBe(`${spelled} rq rq rq`)
  })

  it('spells triplet beats next to straight beats in the same bar', () => {
    expect(text(bar('x...', 'x.x', '.xxx', 'xxx'))).toBe('q q3 e3 rs s s s e3 e3 e3')
  })

  it('spells a rest beat as a quarter rest, never merging rests across beats', () => {
    expect(text(bar('x...', '....', '....', 'x.x.'))).toBe('q rq rq e e')
  })

  it('keeps every bar exactly four beats long', () => {
    for (const figure of FIGURES) {
      const bars = bar(figure.hits, figure.hits, figure.hits, figure.hits)
      expect(bars[0].snare.reduce((t, i) => t + itemTicks(i), 0)).toBe(TICKS_PER_BAR)
    }
  })
})

describe('beat views', () => {
  it.each([...FIGURES, REST_FIGURE].flatMap((f) => [0, 1, 2, 3].map((beat) => [f.key, beat, f] as const)))(
    'round-trip figure %j written into beat %i',
    (_, beat, figure) => {
      const bars = setBeat(bar('x.x.', 'x...', '.xxx', 'x..x'), 'snare', 0, beat, figure.hits)
      const views = snareViews(bars)
      expect(views[0][beat].figure).toBe(figure)
      // the neighbours are left as they were
      const before = snareViews(bar('x.x.', 'x...', '.xxx', 'x..x'))
      views[0].forEach((v, b) => b !== beat && expect(v.hits).toBe(before[0][b].hits))
    },
  )

  it.each(FIGURES.map((f) => [f.key, f] as const))('round-trip figure %j between triplet beats', (_, figure) => {
    const bars = setBeat(bar('xxx', 'x.x', '..x', '.xx'), 'snare', 0, 1, figure.hits)
    expect(snareViews(bars)[0].map((v) => v.hits)).toEqual(['xxx', figure.hits, '..x', '.xx'])
  })

  it('turns a triplet beat back into a straight one', () => {
    expect(text(setBeat(bar('xxx'), 'snare', 0, 0, 'x.x.'))).toBe('e e rq rq rq')
  })

  it('reads a triplet group of rests as a rest beat', () => {
    const rest: Item = { kind: 'rest', duration: 'eighth', dotted: false, triplet: true }
    const bars: Bar[] = [{ snare: [rest, rest, rest, ...restItems().slice(1)], kick: restItems() }]
    expect(snareViews(bars)[0][0].figure).toBe(REST_FIGURE)
  })

  it('writes triplet beats into a later bar and reads them back', () => {
    const bars = setBeat(setBeat([restBar(), restBar()], 'snare', 0, 3, 'x.x'), 'snare', 1, 0, '.xx')
    expect(text(bars)).toBe('rq rq rq q3 e3 | re3 e3 e3 rq rq rq')
    expect(snareViews(bars).map((b) => b.map((v) => v.hits))).toEqual([
      ['....', '....', '....', 'x.x'],
      ['.xx', '....', '....', '....'],
    ])
  })

  it('reads a new bar of rests as four rest beats', () => {
    expect(snareViews([restBar()])[0].map((v) => v.figure)).toEqual([REST_FIGURE, REST_FIGURE, REST_FIGURE, REST_FIGURE])
  })

  it('writes a beat in a later bar without touching the first', () => {
    const bars = setBeat([restBar(), restBar()], 'snare', 1, 2, 'x.x.')
    expect(text(bars)).toBe('rq rq rq rq | rq rq e e rq')
  })

  it("keeps a note's sticking override when a new figure still hits there, and drops it otherwise", () => {
    const withOverride: Bar[] = [
      { snare: [{ kind: 'note', duration: 'quarter', dotted: false, triplet: false, tiedToNext: false, override: 'L' }, ...restItems().slice(1)], kick: restItems() },
    ]
    const kept = setBeat(withOverride, 'snare', 0, 0, 'x.x.')
    expect(kept[0].snare[0]).toMatchObject({ kind: 'note', duration: 'eighth', override: 'L' })
    const dropped = setBeat(withOverride, 'snare', 0, 0, '..x.')
    expect(dropped[0].snare.some((i) => i.kind === 'note' && i.override)).toBe(false)
  })
})

describe('ties', () => {
  it('merges a note tied into the next beat into a dotted value: ♩ ♪ ♩. ♪', () => {
    const bars = toggleTie(bar('x...', 'x.x.', 'x...', '..x.'), 'snare', 0, 2)
    expect(text(bars)).toBe('q e q. re e')
    expect(snareViews(bars)[0].map((v) => v.tiedInto)).toEqual([false, false, true, false])
  })
  it('keeps the tie when a new figure starting with a hit is entered, and drops it otherwise', () => {
    const tied = toggleTie(bar('x...', 'x...'), 'snare', 0, 1)
    expect(snareViews(setBeat(tied, 'snare', 0, 1, 'x.x.'))[0][1].tiedInto).toBe(true)
    expect(snareViews(setBeat(tied, 'snare', 0, 1, '..x.'))[0][1].tiedInto).toBe(false)
  })
})

describe('cut short', () => {
  it.each([
    ['1', 'e re'],
    ['z', 'rs s re'],
    ['b', 's s re'],
    ['d', 'e3 e3 re3'],
    ['g', 're3 e3 re3'],
  ])('ends the last note of figure %s early, with a rest after it: %s', (key, spelled) => {
    const figure = FIGURES.find((f) => f.key === key)!
    const bars = toggleCutShort(bar(figure.hits), 'snare', 0, 0)
    expect(text(bars)).toBe(`${spelled} rq rq rq`)
    expect(snareViews(bars)[0][0]).toMatchObject({ figure, cutShort: true })
  })
})

describe('tie and cut round-trip', () => {
  /** The figures whose last note runs longer than its cut-short length. */
  const CUTTABLE = ['1', 'z', 'b', 'd', 'g']
  const contexts = [
    ['after a straight beat', [restBar()], 0, 1, ['x.x.']],
    ['after a triplet beat', [restBar()], 0, 1, ['xxx']],
    ['across a bar line', [restBar(), restBar()], 1, 0, ['x...', 'x.x.', '..x.', 'x.x']],
  ] as const

  const cases = contexts.flatMap(([where, start, b, beat, before]) =>
    [...FIGURES, REST_FIGURE].flatMap((figure) =>
      [false, true].flatMap((tie) =>
        [false, true].map((cut) => ({ where, start, b, beat, before, figure, tie, cut })),
      ),
    ),
  )

  it.each(cases.map((c) => [c.figure.key, c.tie ? 'tied' : 'untied', c.cut ? 'cut' : 'uncut', c.where, c] as const))(
    'figure %j %s and %s %s',
    (_, __, ___, ____, { start, b, beat, before, figure, tie, cut }) => {
      let bars = before.reduce<Bar[]>((acc, hits, i) => setBeat(acc, 'snare', 0, i, hits), [...start])
      bars = setBeat(bars, 'snare', b, beat, figure.hits)
      if (tie) bars = toggleTie(bars, 'snare', b, beat)
      if (cut) bars = toggleCutShort(bars, 'snare', b, beat)
      const view = snareViews(bars)[b][beat]
      expect(view).toMatchObject({
        figure,
        tiedInto: tie && figure.hits[0] === 'x',
        cutShort: cut && CUTTABLE.includes(figure.key),
      })
      for (const each of bars) expect(each.snare.reduce((t, i) => t + itemTicks(i), 0)).toBe(TICKS_PER_BAR)
      // toggling both again restores the plain figure
      if (cut) bars = toggleCutShort(bars, 'snare', b, beat)
      if (tie) bars = toggleTie(bars, 'snare', b, beat)
      expect(snareViews(bars)[b][beat]).toMatchObject({ figure, tiedInto: false, cutShort: false })
    },
  )

  it('ties a note across a bar line as a tie, not a merged value', () => {
    const bars = toggleTie(setBeat(setBeat([restBar(), restBar()], 'snare', 0, 3, '..x.'), 'snare', 1, 0, 'x...'), 'snare', 1, 0)
    expect(text(bars)).toBe('rq rq rq re e~ | q rq rq rq')
  })

  it('ties out of and into triplet beats', () => {
    expect(text(toggleTie(bar('x.x', 'x...'), 'snare', 0, 1))).toBe('q3 e3~ q rq rq')
    expect(text(toggleTie(bar('..x.', 'xxx'), 'snare', 0, 1))).toBe('re e~ e3 e3 e3 rq rq')
  })

  it("won't tie from a rest, from a cut-short beat, or into the first beat", () => {
    expect(snareViews(toggleTie(bar('....', 'x...'), 'snare', 0, 1))[0][1].tiedInto).toBe(false)
    expect(snareViews(toggleTie(toggleCutShort(bar('x...', 'x...'), 'snare', 0, 0), 'snare', 0, 1))[0][1].tiedInto).toBe(false)
    expect(snareViews(toggleTie(bar('x...'), 'snare', 0, 0))[0][0].tiedInto).toBe(false)
  })

  it('drops a tie into the next beat when this beat stops ending with a note', () => {
    const tied = toggleTie(bar('x...', 'x...'), 'snare', 0, 1)
    expect(snareViews(toggleCutShort(tied, 'snare', 0, 0))[0][1].tiedInto).toBe(false)
    expect(snareViews(setBeat(tied, 'snare', 0, 0, '....'))[0][1]).toMatchObject({ tiedInto: false, hits: 'x...' })
  })

  it('clears cut short when a new figure is entered', () => {
    const cut = toggleCutShort(bar('x...'), 'snare', 0, 0)
    expect(snareViews(setBeat(cut, 'snare', 0, 0, 'xx..'))[0][0].cutShort).toBe(false)
  })
})

describe('grid positions', () => {
  it('reads each sixteenth position of a beat as a hit, a hold or empty', () => {
    const views = snareViews(toggleCutShort(bar('x.x.', '.x..', '....', 'x...'), 'snare', 0, 3))
    expect(views[0].map((v) => v.positions)).toEqual([
      ['hit', 'hold', 'hit', 'hold'],
      ['empty', 'hit', 'hold', 'hold'],
      ['empty', 'empty', 'empty', 'empty'],
      ['hit', 'hold', 'empty', 'empty'],
    ])
    expect(views[0].every((v) => !v.triplet)).toBe(true)
  })

  it('reads a triplet beat as three positions, and a tied-into downbeat as a hold', () => {
    const view = snareViews(toggleTie(bar('x...', 'x.x'), 'snare', 0, 1))[0][1]
    expect(view).toMatchObject({ triplet: true, positions: ['hold', 'hold', 'hit'] })
  })
})

describe('toggling a hit on a grid position', () => {
  it('puts a hit on the & then the downbeat, giving two eighths (figure 2)', () => {
    const bars = toggleHit(toggleHit(bar(), 'snare', 0, 0, 2), 'snare', 0, 0, 0)
    expect(text(bars)).toBe('e e rq rq rq')
    expect(snareViews(bars)[0][0].figure?.key).toBe('2')
  })

  it("splits another note's hold: the earlier note stops at the new hit, which takes the rest", () => {
    // A dotted quarter tied into beat 2 (q.), then a hit on the e of 2 inside its hold.
    const tied = toggleTie(bar('x...', 'x.x.'), 'snare', 0, 1)
    expect(text(toggleHit(tied, 'snare', 0, 1, 1))).toBe('q~ s s e rq rq')
    // A hit inside a cut-short note's hold leaves the rest after it.
    const cut = toggleHit(toggleCutShort(bar('x...'), 'snare', 0, 0), 'snare', 0, 0, 1)
    expect(snareViews(cut)[0][0].positions).toEqual(['hit', 'hit', 'empty', 'empty'])
  })

  it('strikes the downbeat of a tied-into beat again, ending the tie', () => {
    const tied = toggleTie(bar('x...', 'x...'), 'snare', 0, 1)
    const bars = toggleHit(tied, 'snare', 0, 1, 0)
    expect(snareViews(bars)[0][1]).toMatchObject({ tiedInto: false, positions: ['hit', 'hold', 'hold', 'hold'] })
    expect(text(bars)).toBe('q q rq rq')
  })

  it('removes the & of x.x. and lets the note on 1 hold on: a quarter (figure 1)', () => {
    const bars = toggleHit(bar('x.x.'), 'snare', 0, 0, 2)
    expect(text(bars)).toBe('q rq rq rq')
    expect(snareViews(bars)[0][0].figure?.key).toBe('1')
  })

  it('leaves the span empty when the hit removed came after a shortened note', () => {
    // x... cut short (an eighth and an eighth rest), then a hit on the a: e rs s
    const shortened = toggleHit(toggleCutShort(bar('x...'), 'snare', 0, 0), 'snare', 0, 0, 3)
    expect(text(shortened)).toBe('e rs s rq rq rq')
    const bars = toggleHit(shortened, 'snare', 0, 0, 3)
    expect(text(bars)).toBe('e re rq rq rq')
    expect(snareViews(bars)[0][0].positions).toEqual(['hit', 'hold', 'empty', 'empty'])
  })

  it("drops a removed note's sticking override", () => {
    const withOverride: Bar[] = [
      { snare: [{ kind: 'note', duration: 'quarter', dotted: false, triplet: false, tiedToNext: false, override: 'L' }, ...restItems().slice(1)], kick: restItems() },
    ]
    const bars = toggleHit(toggleHit(withOverride, 'snare', 0, 0, 0), 'snare', 0, 0, 0)
    expect(text(bars)).toBe('q rq rq rq')
    expect(bars[0].snare.some((i) => i.kind === 'note' && i.override)).toBe(false)
  })

  it('removes a downbeat without holding the previous beat on into it, so no tie points at a rest', () => {
    const bars = toggleHit(bar('x...', 'x...'), 'snare', 0, 1, 0)
    expect(text(bars)).toBe('q rq rq rq')
    expect(snareViews(bars)[0][1]).toMatchObject({ tiedInto: false, positions: ['empty', 'empty', 'empty', 'empty'] })
  })

  it('removes a note tied on into the next beat along with its continuation', () => {
    const tied = toggleTie(bar('..x.', 'x.x.'), 'snare', 0, 1)
    expect(text(tied)).toBe('re q e rq rq')
    expect(text(toggleHit(tied, 'snare', 0, 0, 2))).toBe('rq re e rq rq')
  })

  it('returns the same bars for a position off the grid', () => {
    const bars = bar('x...')
    expect(toggleHit(bars, 'snare', 0, 0, 4)).toBe(bars)
    expect(toggleHit(bars, 'snare', 1, 0, 0)).toBe(bars)
  })

  it('clicks on the triplet grid of a plain beat when asked: positions 1 and 3 give triplet x.x', () => {
    const bars = toggleHit(toggleHit(bar(), 'snare', 0, 0, 0, true), 'snare', 0, 0, 2, true)
    expect(text(bars)).toBe('q3 e3 rq rq rq')
    expect(snareViews(bars)[0][0]).toMatchObject({ triplet: true, figure: { key: 's' } })
  })

  it('writes a triplet beat left with only its downbeat as a plain quarter', () => {
    expect(text(toggleHit(bar('x.x'), 'snare', 0, 0, 2))).toBe('q rq rq rq')
    expect(text(toggleHit(bar(), 'snare', 0, 0, 0, true))).toBe('q rq rq rq')
  })
})

describe('switching grids', () => {
  it('keeps a downbeat note holding to the end of the beat and clears the other positions', () => {
    expect(text(clearBeatToDownbeat(bar('x..x', '.xx'), 0, 0))).toBe('q re3 e3 e3 rq rq')
    expect(text(clearBeatToDownbeat(bar('xxx', 'x.x.'), 0, 0))).toBe('q e e rq rq')
    expect(text(clearBeatToDownbeat(bar('.x.x'), 0, 0))).toBe('rq rq rq rq')
  })

  it('keeps a tie into the beat', () => {
    const tied = toggleTie(bar('x...', 'x.x.'), 'snare', 0, 1)
    expect(text(clearBeatToDownbeat(tied, 0, 1))).toBe('q.~ e rq rq')
  })

  it('reads beats on the triplet grid when asked, for the pending grid', () => {
    const views = snareViews(bar('x...'), [0, 1])
    expect(views[0][0]).toMatchObject({ triplet: true, hits: 'x..', positions: ['hit', 'hold', 'hold'] })
    expect(views[0][1]).toMatchObject({ triplet: true, positions: ['empty', 'empty', 'empty'] })
    expect(views[0][2]).toMatchObject({ triplet: false })
  })
})

describe("setting a note's hold", () => {
  const at = (beat: number, position: number) => ({ row: 'snare' as const, bar: 0, beat, position })

  it('shortens the first note of x.x. to one sixteenth: sixteenth, sixteenth rest, eighth', () => {
    const bars = setHold(bar('x.x.'), at(0, 0), at(0, 1))
    expect(text(bars)).toBe('s rs e rq rq rq')
    expect(snareViews(bars)[0][0].positions).toEqual(['hit', 'empty', 'hit', 'hold'])
  })

  it('stops a drag past the next hit just before it', () => {
    const shortened = setHold(bar('x..x'), at(0, 0), at(0, 1))
    expect(text(shortened)).toBe('s re s rq rq rq')
    expect(text(setHold(shortened, at(0, 0), at(0, 4)))).toBe('e. s rq rq rq')
    // Already running up to the next hit, a drag past it changes nothing.
    const bars = bar('x.x.')
    expect(setHold(bars, at(0, 0), at(0, 3))).toBe(bars)
  })

  it('refuses a hold of no length', () => {
    const bars = bar('x.x.')
    expect(setHold(bars, at(0, 0), at(0, 0))).toBe(bars)
    expect(setHold(bars, at(0, 2), at(0, 1))).toBe(bars)
  })

  it('takes a press on the hold bar as a press on its note', () => {
    expect(text(setHold(bar('x...'), at(0, 2), at(0, 3)))).toBe('e. rs rq rq rq')
  })

  it('makes the positions after a shortened note empty, anywhere in the beat', () => {
    const bars = setHold(bar('xx..'), at(0, 1), at(0, 2))
    expect(text(bars)).toBe('s s re rq rq rq')
    expect(snareViews(bars)[0][0].positions).toEqual(['hit', 'hit', 'empty', 'empty'])
  })

  it('works on the triplet grid', () => {
    expect(text(setHold(bar('x.x'), at(0, 0), at(0, 1)))).toBe('e3 re3 e3 rq rq rq')
  })

  it('ties on into the next beat: the note on 1 dragged to the & of 2 is a dotted quarter', () => {
    const bars = setHold(bar('x...'), at(0, 0), at(1, 2))
    expect(text(bars)).toBe('q. re rq rq')
    expect(snareViews(bars)[0][1]).toMatchObject({ tiedInto: true, positions: ['hold', 'hold', 'empty', 'empty'] })
  })

  it('holds across several beats and over a bar line, tied across it', () => {
    const twoBars = setBeat([restBar(), restBar()], 'snare', 0, 3, 'x...')
    const bars = setHold(twoBars, { row: 'snare', bar: 0, beat: 3, position: 0 }, { row: 'snare', bar: 1, beat: 0, position: 2 })
    expect(text(bars)).toBe('rq rq rq q~ | e re rq rq rq')
    expect(snareViews(bars)[1][0]).toMatchObject({ tiedInto: true, positions: ['hold', 'hold', 'empty', 'empty'] })
    expect(text(setHold(bar('x...'), at(0, 0), at(2, 0)))).toBe('q.~ e rq rq')
  })

  it('stops at the next hit, in a later beat too', () => {
    expect(text(setHold(bar('x...', '..x.'), at(0, 0), at(3, 0)))).toBe('q. e rq rq')
  })

  it('removes the tie when shortened back past the beat line', () => {
    const long = setHold(bar('x...'), at(0, 0), at(1, 2))
    const bars = setHold(long, at(1, 1), at(0, 2))
    expect(text(bars)).toBe('e re rq rq rq')
    expect(snareViews(bars)[0][1]).toMatchObject({ tiedInto: false, positions: ['empty', 'empty', 'empty', 'empty'] })
  })

  it('snaps to the grid of the beat the drag ends in', () => {
    const tied = setHold(toggleTie(bar('x...', 'x.x'), 'snare', 0, 1), at(0, 0), at(1, 1))
    expect(text(tied)).toBe('q~ e3 re3 e3 rq rq')
    // A beat read on the triplet grid (the editor's pending grid) is snapped on it.
    expect(text(setHold(bar('x...'), at(0, 0), at(1, 1), [1]))).toBe('q~ e3 rq3 rq rq')
  })

  it('leaves beats on the pending triplet grid that the hold does not reach as they were', () => {
    expect(text(setHold(bar('x...', '....', 'x...'), at(0, 0), at(0, 2), [1, 2]))).toBe('e re rq q rq')
    const long = setHold(bar('x...'), at(0, 0), at(1, 1), [1])
    expect(text(setHold(long, at(0, 0), at(0, 2), [1]))).toBe('e re rq rq rq')
  })

  it('writes a beat held right through as a plain beat', () => {
    expect(text(setHold(bar('x...'), at(0, 0), at(1, 3), [1]))).toBe('q.~ e rq rq')
  })

  it('returns the same bars for a press on an empty position', () => {
    const bars = bar('..x.')
    expect(setHold(bars, at(0, 0), at(0, 1))).toBe(bars)
  })

  it('leaves a beat whose holds are not the defaults with no figure', () => {
    const views = snareViews(setHold(bar('x.x.', 'x...', 'x...', 'xxx'), at(0, 0), at(0, 1)))[0]
    expect(views[0]).toMatchObject({ figure: undefined, hits: 'x.x.' })
    // A note shortened to its cut-short length is the figure cut short.
    const cut = snareViews(setHold(bar('x...'), at(0, 0), at(0, 2)))[0][0]
    expect(cut).toMatchObject({ figure: { key: '1' }, cutShort: true })
    // A note on 1 held for a sixteenth is not.
    expect(snareViews(setHold(bar('x...'), at(0, 0), at(0, 1)))[0][0].figure).toBeUndefined()
    // Neither is a shortened note on the triplet grid that isn't the last.
    expect(snareViews(setHold(bar('x.x'), at(0, 0), at(0, 1)))[0][0].figure).toBeUndefined()
    // A triplet beat's last note shortened to one triplet eighth is the figure cut short.
    const tripletCut = snareViews(setHold(bar('xx.'), at(0, 1), at(0, 2)))[0][0]
    expect(tripletCut).toMatchObject({ figure: { hits: 'xx.' }, cutShort: true })
  })
})

describe('the snare row and the kick row (ADR 0005)', () => {
  /** One bar with a figure per beat in each row. */
  function rows(snare: string[], kick: string[]): Bar[] {
    const withSnare = snare.reduce<Bar[]>((bars, h, beat) => setBeat(bars, 'snare', 0, beat, h), [restBar()])
    return kick.reduce<Bar[]>((bars, h, beat) => setBeat(bars, 'kick', 0, beat, h), withSnare)
  }

  it('starts every bar with both rows resting', () => {
    expect(text([restBar()], 'kick')).toBe('rq rq rq rq')
  })

  it('clicks the & of beat 1 in the kick row, leaving the snare row as it was', () => {
    const before = rows(['x.x.', 'xxxx'], [])
    const after = toggleHit(before, 'kick', 0, 0, 2)
    expect(after[0].snare).toBe(before[0].snare)
    expect(beatViews(after)[0][0].kick.hits).toBe('..x.')
    expect(text(after, 'kick')).toBe('re e rq rq rq')
  })

  it('writes a figure into one row only', () => {
    const bars = rows(['x...'], ['..x.', 'x.x.'])
    expect(text(bars)).toBe('q rq rq rq')
    expect(text(bars, 'kick')).toBe('re e e e rq rq')
  })

  it('switches a beat to triplets in both rows, keeping each row\'s downbeat', () => {
    const bars = clearBeatToDownbeat(rows(['x.xx'], ['x.x.']), 0, 0)
    const [view] = beatViews(bars, [0])[0]
    expect(view).toMatchObject({ triplet: true, snare: { hits: 'x..' }, kick: { hits: 'x..' } })
    expect(text(bars)).toBe('q rq rq rq')
    expect(text(bars, 'kick')).toBe('q rq rq rq')
  })

  it('shares a beat\'s grid: a triplet snare beat puts the kick row on the triplet grid too', () => {
    const bars = rows(['x.x'], ['x...'])
    const [view] = beatViews(bars)[0]
    expect(view).toMatchObject({ triplet: true, kick: { hits: 'x..', positions: ['hit', 'hold', 'hold'] } })
    // A click on the kick's "let" lands on the triplet grid.
    expect(text(toggleHit(bars, 'kick', 0, 0, 2), 'kick')).toBe('q3 e3 rq rq rq')
  })

  it('clears the other row to its downbeat where a figure puts the beat on the other grid', () => {
    const bars = setBeat(rows(['x.xx'], []), 'kick', 0, 0, 'xxx')
    expect(text(bars, 'kick')).toBe('e3 e3 e3 rq rq rq')
    expect(text(bars)).toBe('q rq rq rq')
    // A rest, or a beat that reads the same on either grid, leaves the other row as it is.
    expect(text(setBeat(bars, 'snare', 0, 0, '....'), 'kick')).toBe('e3 e3 e3 rq rq rq')
    expect(text(setBeat(bars, 'snare', 0, 0, 'x...'), 'kick')).toBe('e3 e3 e3 rq rq rq')
  })

  it('cuts a kick short on the triplet grid the beat shares with the snare', () => {
    const bars = toggleCutShort(rows(['xxx'], ['x...']), 'kick', 0, 0)
    expect(text(bars, 'kick')).toBe('e3 rq3 rq rq rq')
    expect(text(toggleCutShort(bars, 'kick', 0, 0), 'kick')).toBe('q rq rq rq')
  })

  it('drags a kick hold in the kick row only', () => {
    const bars = rows(['xxxx'], ['x...'])
    const held = setHold(bars, { row: 'kick', bar: 0, beat: 0, position: 0 }, { row: 'kick', bar: 0, beat: 1, position: 2 })
    expect(text(held, 'kick')).toBe('q. re rq rq')
    expect(held[0].snare).toBe(bars[0].snare)
  })

  it('ties and unties in the cursor row only', () => {
    const bars = rows(['x...', 'x...'], ['x...', 'x...'])
    const tied = toggleTie(bars, 'kick', 0, 1)
    expect(text(tied, 'kick')).toBe('q.~ e rq rq')
    expect(text(tied)).toBe('q q rq rq')
  })
})
