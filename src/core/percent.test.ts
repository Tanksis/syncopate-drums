import { describe, expect, it } from 'vitest'
import { parsePercent } from './index'

const volume = { min: 0, max: 150, previous: 100 }

describe('a typed percent', () => {
  it('reads a plain number', () => {
    expect(parsePercent('85', volume)).toBe(85)
  })

  it('allows a percent sign, spaces and decimals', () => {
    expect(parsePercent('85%', volume)).toBe(85)
    expect(parsePercent(' 85 % ', volume)).toBe(85)
    expect(parsePercent('66.7', { min: 50, max: 75, previous: 50 })).toBe(66.7)
  })

  it('clamps a value outside the range', () => {
    expect(parsePercent('200', volume)).toBe(150)
    expect(parsePercent('-5', volume)).toBe(0)
    expect(parsePercent('40', { min: 50, max: 75, previous: 60 })).toBe(50)
  })

  it('keeps the previous value for empty or non-numeric text', () => {
    expect(parsePercent('', volume)).toBe(100)
    expect(parsePercent('  %', volume)).toBe(100)
    expect(parsePercent('abc', volume)).toBe(100)
    expect(parsePercent('8 5', volume)).toBe(100)
  })
})
