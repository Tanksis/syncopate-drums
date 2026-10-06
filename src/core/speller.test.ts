import { describe, expect, it } from 'vitest'
import type { Bar, Item } from './index'
import { FIGURES, REST_FIGURE, TICKS_PER_BAR, beatViews, itemTicks, restBar, setBeat, toggleCutShort, toggleTie } from './index'

/** A bar in shorthand: q e s for note values, `.` for a dot, 3 for a triplet, r for a rest, ~ for a tie. */
function text(bars: Bar[]): string {
  const value = (i: Item) =>
    ({ quarter: 'q', eighth: 'e', sixteenth: 's' })[i.duration] + (i.dotted ? '.' : '') + (i.triplet ? '3' : '')
  return bars
    .map((bar) =>
      bar.items
        .map((i) => (i.kind === 'rest' ? 'r' + value(i) : value(i) + (i.tiedToNext ? '~' : '')))
        .join(' '),
    )
    .join(' | ')
}

function bar(...hits: string[]): Bar[] {
  return hits.reduce<Bar[]>((bars, h, beat) => setBeat(bars, 0, beat, h), [restBar()])
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
      expect(bars[0].items.reduce((t, i) => t + itemTicks(i), 0)).toBe(TICKS_PER_BAR)
    }
  })
})

describe('beat views', () => {
  it.each([...FIGURES, REST_FIGURE].flatMap((f) => [0, 1, 2, 3].map((beat) => [f.key, beat, f] as const)))(
    'round-trip figure %j written into beat %i',
    (_, beat, figure) => {
      const bars = setBeat(bar('x.x.', 'x...', '.xxx', 'x..x'), 0, beat, figure.hits)
      const views = beatViews(bars)
      expect(views[0][beat].figure).toBe(figure)
      // the neighbours are left as they were
      const before = beatViews(bar('x.x.', 'x...', '.xxx', 'x..x'))
      views[0].forEach((v, b) => b !== beat && expect(v.hits).toBe(before[0][b].hits))
    },
  )

  it.each(FIGURES.map((f) => [f.key, f] as const))('round-trip figure %j between triplet beats', (_, figure) => {
    const bars = setBeat(bar('xxx', 'x.x', '..x', '.xx'), 0, 1, figure.hits)
    expect(beatViews(bars)[0].map((v) => v.hits)).toEqual(['xxx', figure.hits, '..x', '.xx'])
  })

  it('turns a triplet beat back into a straight one', () => {
    expect(text(setBeat(bar('xxx'), 0, 0, 'x.x.'))).toBe('e e rq rq rq')
  })

  it('reads a triplet group of rests as a rest beat', () => {
    const rest: Item = { kind: 'rest', duration: 'eighth', dotted: false, triplet: true }
    const bars: Bar[] = [{ items: [rest, rest, rest, ...restBar().items.slice(1)] }]
    expect(beatViews(bars)[0][0].figure).toBe(REST_FIGURE)
  })

  it('writes triplet beats into a later bar and reads them back', () => {
    const bars = setBeat(setBeat([restBar(), restBar()], 0, 3, 'x.x'), 1, 0, '.xx')
    expect(text(bars)).toBe('rq rq rq q3 e3 | re3 e3 e3 rq rq rq')
    expect(beatViews(bars).map((b) => b.map((v) => v.hits))).toEqual([
      ['....', '....', '....', 'x.x'],
      ['.xx', '....', '....', '....'],
    ])
  })

  it('reads a new bar of rests as four rest beats', () => {
    expect(beatViews([restBar()])[0].map((v) => v.figure)).toEqual([REST_FIGURE, REST_FIGURE, REST_FIGURE, REST_FIGURE])
  })

  it('writes a beat in a later bar without touching the first', () => {
    const bars = setBeat([restBar(), restBar()], 1, 2, 'x.x.')
    expect(text(bars)).toBe('rq rq rq rq | rq rq e e rq')
  })

  it("keeps a note's sticking override when a new figure still hits there, and drops it otherwise", () => {
    const withOverride: Bar[] = [
      { items: [{ kind: 'note', duration: 'quarter', dotted: false, triplet: false, tiedToNext: false, override: 'L' }, ...restBar().items.slice(1)] },
    ]
    const kept = setBeat(withOverride, 0, 0, 'x.x.')
    expect(kept[0].items[0]).toMatchObject({ kind: 'note', duration: 'eighth', override: 'L' })
    const dropped = setBeat(withOverride, 0, 0, '..x.')
    expect(dropped[0].items.some((i) => i.kind === 'note' && i.override)).toBe(false)
  })
})

describe('ties', () => {
  it('merges a note tied into the next beat into a dotted value: ♩ ♪ ♩. ♪', () => {
    const bars = toggleTie(bar('x...', 'x.x.', 'x...', '..x.'), 0, 2)
    expect(text(bars)).toBe('q e q. re e')
    expect(beatViews(bars)[0].map((v) => v.tiedInto)).toEqual([false, false, true, false])
  })
  it('keeps the tie when a new figure starting with a hit is entered, and drops it otherwise', () => {
    const tied = toggleTie(bar('x...', 'x...'), 0, 1)
    expect(beatViews(setBeat(tied, 0, 1, 'x.x.'))[0][1].tiedInto).toBe(true)
    expect(beatViews(setBeat(tied, 0, 1, '..x.'))[0][1].tiedInto).toBe(false)
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
    const bars = toggleCutShort(bar(figure.hits), 0, 0)
    expect(text(bars)).toBe(`${spelled} rq rq rq`)
    expect(beatViews(bars)[0][0]).toMatchObject({ figure, cutShort: true })
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
      let bars = before.reduce<Bar[]>((acc, hits, i) => setBeat(acc, 0, i, hits), [...start])
      bars = setBeat(bars, b, beat, figure.hits)
      if (tie) bars = toggleTie(bars, b, beat)
      if (cut) bars = toggleCutShort(bars, b, beat)
      const view = beatViews(bars)[b][beat]
      expect(view).toMatchObject({
        figure,
        tiedInto: tie && figure.hits[0] === 'x',
        cutShort: cut && CUTTABLE.includes(figure.key),
      })
      for (const each of bars) expect(each.items.reduce((t, i) => t + itemTicks(i), 0)).toBe(TICKS_PER_BAR)
      // toggling both again restores the plain figure
      if (cut) bars = toggleCutShort(bars, b, beat)
      if (tie) bars = toggleTie(bars, b, beat)
      expect(beatViews(bars)[b][beat]).toMatchObject({ figure, tiedInto: false, cutShort: false })
    },
  )

  it('ties a note across a bar line as a tie, not a merged value', () => {
    const bars = toggleTie(setBeat(setBeat([restBar(), restBar()], 0, 3, '..x.'), 1, 0, 'x...'), 1, 0)
    expect(text(bars)).toBe('rq rq rq re e~ | q rq rq rq')
  })

  it('ties out of and into triplet beats', () => {
    expect(text(toggleTie(bar('x.x', 'x...'), 0, 1))).toBe('q3 e3~ q rq rq')
    expect(text(toggleTie(bar('..x.', 'xxx'), 0, 1))).toBe('re e~ e3 e3 e3 rq rq')
  })

  it("won't tie from a rest, from a cut-short beat, or into the first beat", () => {
    expect(beatViews(toggleTie(bar('....', 'x...'), 0, 1))[0][1].tiedInto).toBe(false)
    expect(beatViews(toggleTie(toggleCutShort(bar('x...', 'x...'), 0, 0), 0, 1))[0][1].tiedInto).toBe(false)
    expect(beatViews(toggleTie(bar('x...'), 0, 0))[0][0].tiedInto).toBe(false)
  })

  it('drops a tie into the next beat when this beat stops ending with a note', () => {
    const tied = toggleTie(bar('x...', 'x...'), 0, 1)
    expect(beatViews(toggleCutShort(tied, 0, 0))[0][1].tiedInto).toBe(false)
    expect(beatViews(setBeat(tied, 0, 0, '....'))[0][1]).toMatchObject({ tiedInto: false, hits: 'x...' })
  })

  it('clears cut short when a new figure is entered', () => {
    const cut = toggleCutShort(bar('x...'), 0, 0)
    expect(beatViews(setBeat(cut, 0, 0, 'xx..'))[0][0].cutShort).toBe(false)
  })
})
