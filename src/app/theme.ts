import { loadLookFonts } from '@/app/looks'
import { useAppStore } from '@/app/store'
import { SYSTEM_DARK, useSystemDark } from '@/app/useMediaQuery'
import type { DeviceSettings, Look } from '@/core'
import { drawnMode } from '@/core'

/**
 * The localStorage keys mirroring the mode and look settings, so the inline script in index.html can
 * apply them before the first paint. IndexedDB stays the source of truth; keep the keys in step with
 * index.html.
 */
const THEME_MIRROR_KEY = 'syncopate-theme'
const LOOK_MIRROR_KEY = 'syncopate-look'

/** The mode drawn: light for a light-only look, else the setting with `auto` resolved by the device's. */
export function useResolvedTheme(): 'light' | 'dark' {
  return drawnMode(
    useAppStore((s) => s.device.look),
    useAppStore((s) => s.device.theme),
    useSystemDark(),
  )
}

/**
 * Keeps <html> in step with the look and mode settings and, for `auto`, the device's: `data-look`
 * and `data-theme` switch the design tokens, and the colour scheme darkens the native controls and
 * scrollbars. The look's fonts are loaded, and both settings are mirrored. This runs outside React,
 * so the tokens have changed before anything redraws with them (the notation reads them as it
 * draws). Call it once the device settings have loaded, before the app renders; until then the
 * inline script's look and mode stand.
 */
export function followTheme() {
  const media = window.matchMedia(SYSTEM_DARK)
  const root = document.documentElement
  const apply = () => {
    const { look, theme } = useAppStore.getState().device
    const mode = drawnMode(look, theme, media.matches)
    root.dataset.look = look
    root.dataset.theme = mode
    root.style.colorScheme = mode
  }
  const mirror = ({ look, theme }: DeviceSettings) => {
    try {
      localStorage.setItem(THEME_MIRROR_KEY, theme)
      localStorage.setItem(LOOK_MIRROR_KEY, look)
    } catch {
      // Storage blocked: the next launch starts in Studio and Auto until the app loads the settings.
    }
  }
  // If storage failed to open, the settings are only the defaults, so the inline script's stand.
  if (useAppStore.getState().saving) {
    apply()
    mirror(useAppStore.getState().device)
  }
  // The look drawn: the setting, or the inline script's.
  loadLookFonts(root.dataset.look as Look)
  media.addEventListener('change', apply)
  useAppStore.subscribe((state, previous) => {
    if (state.device.theme === previous.device.theme && state.device.look === previous.device.look) return
    apply()
    mirror(state.device)
    if (state.device.look !== previous.device.look) loadLookFonts(state.device.look)
  })
}
