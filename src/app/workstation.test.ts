import { describe, expect, it } from 'vitest'
import { DEFAULT_DEVICE_SETTINGS } from '@/core'
import { windowWidth, workstationLayout as layoutFor } from './workstation'

const workstationLayout = (screen: 'practice' | 'metronome', width: number, settings: typeof device) => layoutFor(screen, windowWidth(width), settings)

const device = DEFAULT_DEVICE_SETTINGS
const viewOn = { ...device, practiceView: true }

describe('the Workstation layout', () => {
  it('docks both sidebars on Practice in a wide window, with the editor open and the notation fitted', () => {
    expect(workstationLayout('practice', 1440, device)).toEqual({ library: 'docked', settings: 'docked', editorFolded: false, growNotation: true })
  })

  it('makes the Practice settings a drawer at 1024 px and below, and leaves the library docked', () => {
    expect(workstationLayout('practice', 1025, device).settings).toBe('docked')
    expect(workstationLayout('practice', 1024, device)).toMatchObject({ library: 'docked', settings: 'drawer' })
  })

  it('makes both sidebars drawers below 1000 px', () => {
    expect(workstationLayout('practice', 999, device)).toMatchObject({ library: 'drawer', settings: 'drawer' })
  })

  it('hides the library on the Metronome, and keeps its settings docked down to 1000 px', () => {
    expect(workstationLayout('metronome', 1440, device)).toMatchObject({ library: 'hidden', settings: 'docked' })
    expect(workstationLayout('metronome', 1024, device)).toMatchObject({ library: 'hidden', settings: 'docked' })
    expect(workstationLayout('metronome', 999, device)).toMatchObject({ library: 'hidden', settings: 'drawer' })
  })

  it('folds the sidebars and the editor and grows the notation in the practice view, at any width', () => {
    for (const width of [1440, 1280, 1024, 800])
      expect(workstationLayout('practice', width, viewOn)).toEqual({ library: 'drawer', settings: 'drawer', editorFolded: true, growNotation: true })
  })

  it('grows the notation in the practice view even with Fit off, and leaves Fit to decide without it', () => {
    expect(workstationLayout('practice', 1440, { ...viewOn, fitNotation: false }).growNotation).toBe(true)
    expect(workstationLayout('practice', 1440, { ...device, fitNotation: false }).growNotation).toBe(false)
  })

  it('keeps the editor as the drummer collapsed it outside the practice view', () => {
    expect(workstationLayout('practice', 1440, { ...device, editorCollapsed: true }).editorFolded).toBe(true)
  })

  it('leaves the Metronome as it is with the practice view on', () => {
    expect(workstationLayout('metronome', 1440, viewOn)).toEqual(workstationLayout('metronome', 1440, device))
  })
})
