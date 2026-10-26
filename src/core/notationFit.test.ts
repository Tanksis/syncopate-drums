import { describe, expect, it } from 'vitest'
import type { Bar, PatternId } from './index'
import { NOTATION_LAYOUT, minBarWidthFor, notationFit, restBar, setBeat, staffParts, toggleMark } from './index'

/** One line of staff at scale 1, about what the renderer draws with both parts. */
const LINE = 150

describe('notationFit', () => {
  it('draws a one-bar exercise in a wide, tall area at 1.6 times, and an eight-bar one at 1', () => {
    const area = { width: 860, height: 800, lineHeight: LINE }
    expect(notationFit({ ...area, bars: 1 }).scale).toBe(1.6)
    expect(notationFit({ ...area, bars: 8 })).toEqual({ scale: 1, barsPerLine: 4, barWidth: 192 })
  })

  it('never adds a line: with 4 bars a line at scale 1, a 4-bar exercise stays on one line', () => {
    expect(notationFit({ bars: 4, width: 1000, height: 800, lineHeight: LINE })).toEqual({ scale: 1.15, barsPerLine: 4, barWidth: 194 })
  })

  it('scales a short exercise in a short area only as far as its height fits', () => {
    expect(notationFit({ bars: 1, width: 1200, height: 200, lineHeight: LINE }).scale).toBe(1.25)
  })

  it('leaves an exercise that does not fit at scale 1 at 1', () => {
    expect(notationFit({ bars: 1, width: 1200, height: 100, lineHeight: LINE }).scale).toBe(1)
  })

  it('puts at most 4 bars on a line, and fewer when a bar would be narrower than its minimum', () => {
    expect(notationFit({ bars: 8, width: 2000, height: 100, lineHeight: LINE }).barsPerLine).toBe(4)
    expect(notationFit({ bars: 8, width: 500, height: 100, lineHeight: LINE }).barsPerLine).toBe(2)
    expect(notationFit({ bars: 8, width: 100, height: 100, lineHeight: LINE }).barsPerLine).toBe(1)
  })

  it('fills the line with a one-bar exercise: its bar is the whole width left at its scale', () => {
    // 860 / 1.6 = 537.5, less 2 × 10 margin and the 70 clef.
    expect(notationFit({ bars: 1, width: 860, height: 800, lineHeight: LINE })).toEqual({ scale: 1.6, barsPerLine: 2, barWidth: 447 })
  })

  it('splits the line between the bars of a two-bar exercise', () => {
    expect(notationFit({ bars: 2, width: 860, height: 800, lineHeight: LINE }).barWidth).toBe(223)
  })

  it('caps a bar at 475 so a one-bar exercise in a very wide area is not stretched thin', () => {
    expect(notationFit({ bars: 1, width: 2000, height: 300, lineHeight: LINE })).toEqual({ scale: 1.6, barsPerLine: 4, barWidth: 475 })
  })

  it('lets a bar wider than the cap at its minimum, as grace notes make one, keep its minimum', () => {
    expect(notationFit({ bars: 1, width: 2000, height: 300, lineHeight: LINE, minBarWidth: 530 }).barWidth).toBeGreaterThanOrEqual(530)
  })

  it('gives every bar of a five-bar exercise a quarter of the line, so its one-bar last line is not stretched', () => {
    // 1000 - 2 × 10 margin - 70 clef = 910, over 4 bars.
    expect(notationFit({ bars: 5, width: 1000, height: 310, lineHeight: LINE })).toEqual({ scale: 1, barsPerLine: 4, barWidth: 227 })
  })
})

/** Bars of the snare row with the same figure hits in every beat, e.g. `xxxx` for sixteenths. */
function bars(count: number, hits: string): Bar[] {
  return Array.from({ length: count }, (_, b) => b).reduce<Bar[]>(
    (all, b) => [0, 1, 2, 3].reduce((acc, beat) => setBeat(acc, 'snare', b, beat, hits), all),
    Array.from({ length: count }, () => restBar()),
  )
}
const widthOf = (count: number, hits: string, groove: PatternId = 'off') => minBarWidthFor(staffParts(bars(count, hits), groove))

describe('minBarWidthFor', () => {
  it('keeps 190 for quarters and eighths', () => {
    expect(widthOf(4, 'x...')).toBe(190)
    expect(widthOf(4, 'x.x.')).toBe(190)
  })

  it('gives triplets 260 and sixteenths 330', () => {
    expect(widthOf(4, 'xxx')).toBe(260)
    expect(widthOf(4, 'xxxx')).toBe(330)
  })

  it('counts rests as events: a sixteenth rest and three sixteenths get 330', () => {
    expect(widthOf(1, '.xxx')).toBe(330)
  })

  it("counts the groove's notes: quarters under eighth hi-hats keep 190", () => {
    expect(widthOf(1, 'x...', 'hihatEighths')).toBe(190)
  })

  it('counts either part: sixteenth kicks under quarter snares get 330', () => {
    const kicks = [0, 1, 2, 3].reduce((acc, beat) => setBeat(acc, 'kick', 0, beat, 'xxxx'), bars(1, 'x...'))
    expect(minBarWidthFor(staffParts(kicks, 'off'))).toBe(330)
  })

  it('takes the busiest beat of the whole exercise', () => {
    const one = bars(4, 'x...')
    const busy = setBeat(one, 'snare', 3, 2, 'xxxx')
    expect(minBarWidthFor(staffParts(busy, 'off'))).toBe(330)
  })
})

describe('minBarWidthFor with grace notes', () => {
  /** The bars with the marks put on bar `bar`'s snare notes at beat starts. */
  const graced = (all: ReturnType<typeof bars>, bar: number, marks: ('flam' | 'drag')[]) =>
    marks.reduce((acc, mark, beat) => toggleMark(acc, 'snare', bar, beat, 0, mark), all)

  it('makes room for each flam, and more for each drag, in the bar with the most', () => {
    const { flam: flamRoom, drag: dragRoom } = NOTATION_LAYOUT.graceRoom
    expect(minBarWidthFor(staffParts(graced(bars(2, 'x.x.'), 0, ['flam', 'flam']), 'off'))).toBe(190 + 2 * flamRoom)
    const both = graced(graced(bars(2, 'xxxx'), 0, ['flam']), 1, ['drag', 'flam'])
    expect(minBarWidthFor(staffParts(both, 'off'))).toBe(330 + dragRoom + flamRoom)
  })
})

describe('notationFit with a busy minimum bar width', () => {
  it('gets four bars of sixteenths at 860 px 2 bars a line, and quarters still 4', () => {
    const area = { bars: 4, width: 860, height: 800, lineHeight: LINE }
    expect(notationFit({ ...area, minBarWidth: 330 }).barsPerLine).toBe(2)
    expect(notationFit({ ...area, minBarWidth: 190 }).barsPerLine).toBe(4)
  })

  it('draws one sixteenth bar at 390 px below 1x so the bar fits its minimum', () => {
    // 390 / 0.9 = 433, less 2 × 10 margin and the 70 clef: 343, the first scale with room for 330.
    expect(notationFit({ bars: 1, width: 390, height: 800, lineHeight: LINE, minBarWidth: 330 })).toEqual({
      scale: 0.9,
      barsPerLine: 1,
      barWidth: 343,
    })
  })

  it('goes no lower than 0.8, however narrow the area', () => {
    expect(notationFit({ bars: 1, width: 200, height: 800, lineHeight: LINE, minBarWidth: 330 }).scale).toBe(0.8)
  })

  it('stays at 1 where a quarter bar fits at 1, even if the height is short', () => {
    expect(notationFit({ bars: 1, width: 390, height: 100, lineHeight: LINE, minBarWidth: 190 }).scale).toBe(1)
  })

  it('scales triplets up on a phone only while a bar keeps 80% of its minimum, so they stay spread out', () => {
    // 390 / 1.3 = 300, less 2 × 10 margin and the 70 clef: 210, the last scale with 80% of 260 (208).
    expect(notationFit({ bars: 2, width: 390, height: 800, lineHeight: LINE, minBarWidth: 260 })).toEqual({
      scale: 1.3,
      barsPerLine: 1,
      barWidth: 210,
    })
  })

  it('still scales eighths up to 1.6 on a phone, with 80% of 190 to spare', () => {
    expect(notationFit({ bars: 4, width: 390, height: 1000, lineHeight: LINE, minBarWidth: 190 })).toEqual({
      scale: 1.6,
      barsPerLine: 1,
      barWidth: 153,
    })
  })
})

describe('notationFit growing a short exercise to fill a tall area', () => {
  it('draws one bar in a roomy area up to 2.4 times, past the usual 1.6, and no further', () => {
    expect(notationFit({ bars: 1, width: 860, height: 800, lineHeight: LINE, grow: true }).scale).toBe(2.4)
    expect(notationFit({ bars: 1, width: 3000, height: 3000, lineHeight: LINE, grow: true }).scale).toBe(2.4)
  })
  it('breaks onto more lines to grow, balancing them: four bars as 2 + 2, not 3 + 1', () => {
    // 1000 / 1.45 = 689.7, less 2 × 10 margin and the 70 clef: 599.7, room for 3 bars a line; two
    // lines of 150 and the 10 above are 449.5 at 1.45, and 1.5 would be too tall.
    expect(notationFit({ bars: 4, width: 1000, height: 450, lineHeight: LINE, grow: true })).toEqual({
      scale: 1.45,
      barsPerLine: 2,
      barWidth: 299,
    })
  })
  it('does not grow unless asked: the same four bars stay on one line, no larger than 1.6', () => {
    expect(notationFit({ bars: 4, width: 1000, height: 450, lineHeight: LINE })).toEqual({ scale: 1.15, barsPerLine: 4, barWidth: 194 })
    expect(notationFit({ bars: 1, width: 860, height: 800, lineHeight: LINE }).scale).toBe(1.6)
  })
  it('balances the lines only when it grows: five bars too tall to grow keep 4 + 1, as today', () => {
    expect(notationFit({ bars: 5, width: 1000, height: 310, lineHeight: LINE, grow: true })).toEqual({ scale: 1, barsPerLine: 4, barWidth: 227 })
  })
})
