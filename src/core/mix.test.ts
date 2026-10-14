import { describe, expect, it } from 'vitest'
import { DEFAULT_DEVICE_SETTINGS, layerLevels } from './index'

describe('the mix', () => {
  it('plays each layer at its own volume', () => {
    const levels = layerLevels({ ...DEFAULT_DEVICE_SETTINGS, clickVolume: 0.2, exerciseVolume: 0.5, grooveVolume: 1.5 })
    expect(levels).toEqual({ click: 0.2, exercise: 0.5, groove: 1.5 })
  })

  it('silences only the exercise when it is muted', () => {
    const levels = layerLevels({ ...DEFAULT_DEVICE_SETTINGS, exerciseMuted: true })
    expect(levels).toEqual({ click: 1, exercise: 0, groove: 1 })
  })

  it('silences only the click when it is muted', () => {
    const levels = layerLevels({ ...DEFAULT_DEVICE_SETTINGS, clickMuted: true })
    expect(levels).toEqual({ click: 0, exercise: 1, groove: 1 })
  })

  it('silences only the groove when it is muted', () => {
    const levels = layerLevels({ ...DEFAULT_DEVICE_SETTINGS, grooveMuted: true })
    expect(levels).toEqual({ click: 1, exercise: 1, groove: 0 })
  })
})
