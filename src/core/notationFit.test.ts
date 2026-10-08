import { describe, expect, it } from 'vitest'
import { notationFit } from './index'

/** One line of staff at scale 1, about what the renderer draws with both parts. */
const LINE = 150

describe('notationFit', () => {
  it('draws a one-bar exercise in a wide, tall area at 1.6 times, and an eight-bar one at 1', () => {
    const area = { width: 860, height: 800, lineHeight: LINE }
    expect(notationFit({ ...area, bars: 1 }).scale).toBe(1.6)
    expect(notationFit({ ...area, bars: 8 })).toEqual({ scale: 1, barsPerLine: 4 })
  })

  it('never adds a line: with 4 bars a line at scale 1, a 4-bar exercise stays on one line', () => {
    expect(notationFit({ bars: 4, width: 1000, height: 800, lineHeight: LINE })).toEqual({ scale: 1.15, barsPerLine: 4 })
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
})
