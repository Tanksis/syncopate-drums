import { describe, expect, it } from 'vitest'
import { DEFAULT_DEVICE_SETTINGS, clickHeard, exampleExercises, layerLevels, schedule } from './index'

describe('the mix', () => {
  it('plays each layer at its own volume', () => {
    const levels = layerLevels({ ...DEFAULT_DEVICE_SETTINGS, clickVolume: 0.2, exerciseVolume: 0.5, grooveVolume: 1.5 })
    expect(levels).toEqual({ click: 0.2, exercise: 0.5, groove: 1.5 })
  })

  it('silences only the exercise when it is muted', () => {
    const levels = layerLevels({ ...DEFAULT_DEVICE_SETTINGS, exerciseMuted: true })
    expect(levels).toEqual({ click: 1, exercise: 0, groove: 1 })
  })

  it('keeps the click layer up when the click is muted, for the count-in', () => {
    const levels = layerLevels({ ...DEFAULT_DEVICE_SETTINGS, clickMuted: true })
    expect(levels).toEqual({ click: 1, exercise: 1, groove: 1 })
  })

  it('silences the clicks but not the count-in when the click is muted', () => {
    const exercise = exampleExercises()[0]
    const device = { ...DEFAULT_DEVICE_SETTINGS, countIn: true, clickMuted: true }
    const clicks = schedule(exercise, exercise.practice, device, 'start', 60).events.filter((e) => e.kind === 'click')
    const heard = clicks.filter((e) => clickHeard(e, device))
    expect(heard.length).toBeGreaterThan(0)
    expect(heard.every((e) => e.position.bar < 0)).toBe(true)
    expect(clicks.some((e) => e.position.bar >= 0)).toBe(true)
    expect(clicks.every((e) => clickHeard(e, { ...device, clickMuted: false }))).toBe(true)
  })

  it('silences only the groove when it is muted', () => {
    const levels = layerLevels({ ...DEFAULT_DEVICE_SETTINGS, grooveMuted: true })
    expect(levels).toEqual({ click: 1, exercise: 1, groove: 0 })
  })
})
