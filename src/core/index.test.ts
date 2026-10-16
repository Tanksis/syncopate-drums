import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_DEVICE_SETTINGS,
  TICKS_PER_BEAT,
  barTicks,
  clampBpm,
  deviceSettingsFrom,
  drawnMode,
  hasHits,
  loopLabel,
  newExercise,
  setBeat,
} from './index'

describe('ticks', () => {
  it('fit both a sixteenth and an eighth-note triplet in one beat', () => {
    expect(TICKS_PER_BEAT % 4).toBe(0)
    expect(TICKS_PER_BEAT % 3).toBe(0)
    expect(barTicks(4)).toBe(48)
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

  it('open the General section of the settings sidebar unless it was stored folded', () => {
    expect(DEFAULT_DEVICE_SETTINGS.settingsSectionOpen).toBe(true)
    expect(deviceSettingsFrom({ settingsSectionOpen: false }).settingsSectionOpen).toBe(false)
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

  it('show the welcome until it is dismissed', () => {
    expect(deviceSettingsFrom(undefined).welcomeDismissed).toBe(false)
    expect(deviceSettingsFrom({ welcomeDismissed: true }).welcomeDismissed).toBe(true)
  })

  it('drop a stored welcome setting that is not a yes or no', () => {
    expect(deviceSettingsFrom({ welcomeDismissed: 'yes', countIn: false })).toEqual({ ...DEFAULT_DEVICE_SETTINGS, countIn: false })
  })

  it('fit the notation to the card unless that is switched off, and drop a stored fit that is not a yes or no', () => {
    expect(deviceSettingsFrom(undefined).fitNotation).toBe(true)
    expect(deviceSettingsFrom({ fitNotation: false }).fitNotation).toBe(false)
    expect(deviceSettingsFrom({ fitNotation: 'no' }).fitNotation).toBe(true)
  })

  it('show the beat count unless that is switched off, and drop a stored one that is not a yes or no', () => {
    expect(deviceSettingsFrom(undefined).beatCount).toBe(true)
    expect(deviceSettingsFrom({ beatCount: false }).beatCount).toBe(false)
    expect(deviceSettingsFrom({ beatCount: 1 }).beatCount).toBe(true)
  })

  it('drop any stored yes-or-no setting that is not a boolean', () => {
    expect(deviceSettingsFrom({ countIn: 0, clickMuted: 'true' })).toEqual(DEFAULT_DEVICE_SETTINGS)
  })

  it('drop a stored theme the app does not have', () => {
    expect(deviceSettingsFrom({ theme: 'sepia', countIn: false })).toEqual({ ...DEFAULT_DEVICE_SETTINGS, countIn: false })
  })
})

describe('looks', () => {
  it('start on Warm', () => {
    expect(DEFAULT_DEVICE_SETTINGS.look).toBe('warm')
  })

  it('draw the mode set', () => {
    expect(drawnMode('dark', false)).toBe('dark')
    expect(drawnMode('light', true)).toBe('light')
  })

  it('follow the device in auto', () => {
    expect(drawnMode('auto', true)).toBe('dark')
    expect(drawnMode('auto', false)).toBe('light')
  })

  it('keep a stored look', () => {
    expect(deviceSettingsFrom({ look: 'studio' }).look).toBe('studio')
  })

  it('load a look since removed (Bold, Score, Riso, Catalogue) as Warm', () => {
    expect(deviceSettingsFrom({ look: 'riso', theme: 'dark' })).toMatchObject({ look: 'warm', theme: 'dark' })
  })

  it('drop a stored look the app does not have', () => {
    expect(deviceSettingsFrom({ look: 'neon', countIn: false })).toEqual({ ...DEFAULT_DEVICE_SETTINGS, countIn: false })
  })

  it('load settings stored before looks with Warm', () => {
    expect(deviceSettingsFrom({ theme: 'dark' })).toMatchObject({ look: 'warm', theme: 'dark' })
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
