import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_DEVICE_SETTINGS,
  TICKS_PER_BAR,
  TICKS_PER_BEAT,
  clampBpm,
  deviceSettingsFrom,
  drawnMode,
  hasHits,
  loopLabel,
  newExercise,
  setBeat,
  withLook,
} from './index'

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
    const stored = { countIn: false, vimKeys: true, figuresPanelOpen: true }
    expect(deviceSettingsFrom(stored)).toEqual({ ...DEFAULT_DEVICE_SETTINGS, countIn: false })
  })

  it('follow the device theme by default', () => {
    expect(DEFAULT_DEVICE_SETTINGS.theme).toBe('auto')
  })

  it('keep a stored light or dark theme', () => {
    expect(deviceSettingsFrom({ theme: 'dark' }).theme).toBe('dark')
    expect(deviceSettingsFrom({ theme: 'light' }).theme).toBe('light')
  })

  it('load settings stored before the editor could collapse with the editor open', () => {
    expect(deviceSettingsFrom({ countIn: false, theme: 'dark' }).editorCollapsed).toBe(false)
  })

  it('keep a stored collapsed editor', () => {
    expect(deviceSettingsFrom({ editorCollapsed: true }).editorCollapsed).toBe(true)
  })

  it('load settings stored before the click and groove could mute with both unmuted', () => {
    const device = deviceSettingsFrom({ exerciseMuted: true, clickVolume: 0.5 })
    expect(device).toMatchObject({ exerciseMuted: true, clickMuted: false, grooveMuted: false })
  })

  it('keep a stored muted click and groove', () => {
    expect(deviceSettingsFrom({ clickMuted: true, grooveMuted: true })).toMatchObject({ clickMuted: true, grooveMuted: true })
  })

  it('drop a stored theme the app does not have', () => {
    expect(deviceSettingsFrom({ theme: 'sepia', countIn: false })).toEqual({ ...DEFAULT_DEVICE_SETTINGS, countIn: false })
  })
})

describe('looks', () => {
  it('start on Studio', () => {
    expect(DEFAULT_DEVICE_SETTINGS.look).toBe('studio')
  })

  it('set the mode to auto when choosing a light-only look', () => {
    const settings = { ...DEFAULT_DEVICE_SETTINGS, theme: 'dark' as const }
    expect(withLook(settings, 'score')).toEqual({ ...settings, look: 'score', theme: 'auto' })
  })

  it('leave the mode alone when choosing a look with a dark version', () => {
    const settings = { ...DEFAULT_DEVICE_SETTINGS, theme: 'dark' as const }
    expect(withLook(settings, 'bold')).toEqual({ ...settings, look: 'bold' })
  })

  it('keep the mode at auto when leaving a light-only look', () => {
    const onScore = withLook({ ...DEFAULT_DEVICE_SETTINGS, theme: 'dark' }, 'score')
    expect(withLook(onScore, 'studio').theme).toBe('auto')
  })

  it('draw a light-only look light even with dark set and a dark device', () => {
    expect(drawnMode('riso', 'dark', true)).toBe('light')
    expect(drawnMode('catalogue', 'auto', true)).toBe('light')
  })

  it('draw a look with a dark version in the mode set', () => {
    expect(drawnMode('studio', 'dark', false)).toBe('dark')
    expect(drawnMode('warm', 'light', true)).toBe('light')
  })

  it('follow the device in auto for a look with a dark version', () => {
    expect(drawnMode('bold', 'auto', true)).toBe('dark')
    expect(drawnMode('bold', 'auto', false)).toBe('light')
  })

  it('keep a stored look', () => {
    expect(deviceSettingsFrom({ look: 'riso' }).look).toBe('riso')
  })

  it('drop a stored look the app does not have', () => {
    expect(deviceSettingsFrom({ look: 'neon', countIn: false })).toEqual({ ...DEFAULT_DEVICE_SETTINGS, countIn: false })
  })

  it('load settings stored before looks with Studio', () => {
    expect(deviceSettingsFrom({ theme: 'dark' })).toMatchObject({ look: 'studio', theme: 'dark' })
  })
})

describe('loopLabel', () => {
  it('reads all bars with no loop', () => {
    expect(loopLabel(null, 4)).toBe('All bars')
  })

  it('names one looped bar, counting from 1', () => {
    expect(loopLabel({ first: 1, last: 1 }, 4)).toBe('Bar 2')
  })

  it('names a looped range of bars', () => {
    expect(loopLabel({ first: 1, last: 2 }, 4)).toBe('Bars 2–3')
  })

  it('names only the bars the exercise still has', () => {
    expect(loopLabel({ first: 2, last: 5 }, 4)).toBe('Bars 3–4')
  })
})
