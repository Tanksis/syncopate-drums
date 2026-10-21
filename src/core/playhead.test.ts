import { describe, expect, it } from 'vitest'
import { playheadX } from './index'

/** A 4/4 bar's written notes on beats 1 and 3, and its end at 48 ticks. */
const BAR = [
  { tick: 0, x: 100 },
  { tick: 24, x: 200 },
  { tick: 48, x: 340 },
]

describe('playheadX', () => {
  it('puts a tick on a written note at that note', () => {
    expect(playheadX(BAR, 24)).toBe(200)
  })

  it('puts a tick the written line lacks between the written notes around it, in proportion to the time', () => {
    // Beat 2 is halfway from beat 1 to beat 3; beat 4's & is three quarters of the way from beat 3 to the end.
    expect(playheadX(BAR, 12)).toBe(150)
    expect(playheadX(BAR, 42)).toBe(305)
  })

  it('puts a tick before the first written note on that note', () => {
    expect(playheadX(BAR.slice(1), 6)).toBe(200)
  })

  it("puts the bar's end, and anything past it, at the bar's end", () => {
    expect(playheadX(BAR, 48)).toBe(340)
    expect(playheadX(BAR, 50)).toBe(340)
  })
})
