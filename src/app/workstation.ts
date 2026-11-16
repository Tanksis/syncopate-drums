// How the desktop Workstation lays itself out: where each sidebar goes, whether the grid editor is
// folded to its bar tabs, and whether the notation grows to fill its card. Decided from the screen,
// the window's width and the device settings, never from playback, so Play moves nothing.

import type { DeviceSettings, Screen } from '@/core'

export type SidebarId = 'library' | 'settings'

/**
 * Where a sidebar goes: not at all, in its column (open or a rail, as the device setting has it), or
 * a drawer: a rail whose sidebar opens over the notation, and isn't remembered.
 */
export type SidebarPlace = 'hidden' | 'docked' | 'drawer'

/** Below this width, in px, both sidebars are drawers. */
export const NARROW_WIDTH = 1000

/** At or below this width, in px, the Practice settings are a drawer, leaving the notation the width. */
export const SETTINGS_DRAWER_WIDTH = 1024

/** The window's widths that change the layout: under `NARROW_WIDTH`, and at or under `SETTINGS_DRAWER_WIDTH`. */
export interface WindowWidth {
  narrow: boolean
  settingsDrawer: boolean
}

/** A window `width` px wide, as the layout sees it (the app reads the same from media queries). */
export const windowWidth = (width: number): WindowWidth => ({ narrow: width < NARROW_WIDTH, settingsDrawer: width <= SETTINGS_DRAWER_WIDTH })

export interface WorkstationLayout {
  library: SidebarPlace
  settings: SidebarPlace
  /** The grid editor shows only its bar tabs row. */
  editorFolded: boolean
  /** A short exercise grows to fill the notation card (see `notationFit`). */
  growNotation: boolean
}

/**
 * The Workstation's layout for a screen, the window's width and the device settings. The
 * library sidebar is hidden on the Metronome, where it has nothing to show beside it. On Practice,
 * the practice view folds both sidebars to drawers and the editor to its bar tabs, and grows the
 * notation whatever Notation's Fit is set to; turned off, the stored choices come back untouched.
 */
export function workstationLayout(
  screen: Screen,
  { narrow, settingsDrawer }: WindowWidth,
  device: Pick<DeviceSettings, 'practiceView' | 'editorCollapsed' | 'fitNotation'>,
): WorkstationLayout {
  const practice = screen === 'practice'
  const view = practice && device.practiceView
  return {
    library: !practice ? 'hidden' : narrow || view ? 'drawer' : 'docked',
    settings: narrow || (practice && (view || settingsDrawer)) ? 'drawer' : 'docked',
    editorFolded: view || device.editorCollapsed,
    growNotation: view || device.fitNotation,
  }
}
