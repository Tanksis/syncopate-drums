import { describe, expect, it } from 'vitest'
import { pickStroke, strokeGain } from './index'

describe('pickStroke', () => {
  it('never plays the file just played again', () => {
    for (const random of [0, 0.2, 0.5, 0.8, 0.999]) expect(pickStroke(5, 2, random)).not.toBe(2)
  })

  it('spreads the strokes evenly over the other files', () => {
    // Four files left besides the last (2), a quarter of the range each.
    expect([0, 0.25, 0.5, 0.75, 0.999].map((r) => pickStroke(5, 2, r))).toEqual([0, 1, 3, 4, 4])
  })

  it('picks from all of them for the first stroke', () => {
    expect([0, 0.2, 0.4, 0.6, 0.999].map((r) => pickStroke(5, undefined, r))).toEqual([0, 1, 2, 3, 4])
  })

  it('plays a band of one file every time', () => {
    expect(pickStroke(1, 0, 0.5)).toBe(0)
  })
})

describe('strokeGain', () => {
  it('varies a stroke from 1 dB softer to 1 dB louder', () => {
    expect(strokeGain(0)).toBeCloseTo(0.891, 3)
    expect(strokeGain(0.5)).toBe(1)
    expect(strokeGain(1)).toBeCloseTo(1.122, 3)
  })
})
