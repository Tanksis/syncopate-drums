import { describe, expect, it } from 'vitest'
import type { Bar, Item } from './index'
import { FIGURES, REST_FIGURE, TICKS_PER_BAR, beatViews, itemTicks, restBar, setBeat } from './index'

/** A bar in shorthand: q e s for note values, `.` for a dot, r for a rest, ~ for a tie. */
function text(bars: Bar[]): string {
  const value = (i: Item) => ({ quarter: 'q', eighth: 'e', sixteenth: 's' })[i.duration] + (i.dotted ? '.' : '')
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
