import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DEFAULT_DEVICE_SETTINGS, TICKS_PER_BAR, TICKS_PER_BEAT, clampBpm, deviceSettingsFrom, hasHits, newExercise, setBeat } from './index'

describe('ticks', () => {
  it('fit both a sixteenth and an eighth-note triplet in one beat', () => {
    expect(TICKS_PER_BEAT % 4).toBe(0)
    expect(TICKS_PER_BEAT % 3).toBe(0)
    expect(TICKS_PER_BAR).toBe(48)
  })
})

describe('clampBpm', () => {
  it('keeps tempos inside 30–300 BPM', () => {
    expect(clampBpm(80)).toBe(80)
    expect(clampBpm(12)).toBe(30)
    expect(clampBpm(400)).toBe(300)
    expect(clampBpm(92.6)).toBe(93)
    expect(clampBpm(Number.NaN)).toBe(30)
  })
})

describe('the core stays pure', () => {
  const forbidden = /from\s+['"](react|react-dom|zustand|idb|vexflow)(\/[^'"]*)?['"]|from\s+['"]\.\.\//

  it('imports nothing from React, the store, storage, notation or outside the core', () => {
    const dir = import.meta.dirname
    const sources = readdirSync(dir, { recursive: true, encoding: 'utf8' })
      .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
    expect(sources.length).toBeGreaterThan(0)
    for (const file of sources) {
      expect(readFileSync(join(dir, file), 'utf8'), file).not.toMatch(forbidden)
    }
  })
})

describe('hasHits', () => {
  const empty = newExercise({ id: 'a', now: 0 })

  it('is false for an exercise of rests', () => {
    expect(hasHits(empty)).toBe(false)
  })

  it('is true with one kick note, or one snare note', () => {
    expect(hasHits({ ...empty, bars: setBeat(empty.bars, 'kick', 0, 2, 'x') })).toBe(true)
    expect(hasHits({ ...empty, bars: setBeat(empty.bars, 'snare', 0, 0, 'x') })).toBe(true)
  })
})

describe('the default device settings', () => {
  it('have both sidebars open', () => {
    expect(DEFAULT_DEVICE_SETTINGS).toMatchObject({ librarySidebarOpen: true, settingsSidebarOpen: true })
  })

  it('have no vim keys or figures panel (ADR 0009)', () => {
    expect(DEFAULT_DEVICE_SETTINGS).not.toHaveProperty('vimKeys')
    expect(DEFAULT_DEVICE_SETTINGS).not.toHaveProperty('figuresPanelOpen')
  })
})

describe('stored device settings', () => {
  it('fall back to the defaults for any setting not stored', () => {
    expect(deviceSettingsFrom(undefined)).toEqual(DEFAULT_DEVICE_SETTINGS)
    expect(deviceSettingsFrom({ countIn: false })).toEqual({ ...DEFAULT_DEVICE_SETTINGS, countIn: false })
  })

  it('drop a stored vim keys or figures panel setting', () => {
    const stored = { countIn: false, vimKeys: true, figuresPanelOpen: true } as Partial<typeof DEFAULT_DEVICE_SETTINGS>
    expect(deviceSettingsFrom(stored)).toEqual({ ...DEFAULT_DEVICE_SETTINGS, countIn: false })
  })
})
