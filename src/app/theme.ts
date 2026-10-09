import { useAppStore } from '@/app/store'
import { useSystemDark } from '@/app/useMediaQuery'
import type { Theme } from '@/core'

/**
 * The localStorage key mirroring the theme setting, so the inline script in index.html can apply it
 * before the first paint. IndexedDB stays the source of truth; keep the key in step with index.html.
 */
const THEME_MIRROR_KEY = 'syncopate-theme'

const SYSTEM_DARK = '(prefers-color-scheme: dark)'

const resolve = (theme: Theme, systemDark: boolean) => (theme === 'auto' ? (systemDark ? 'dark' : 'light') : theme)

/** The theme drawn: the setting, with `auto` resolved by the device's light or dark setting. */
export function useResolvedTheme(): 'light' | 'dark' {
  return resolve(useAppStore((s) => s.device.theme), useSystemDark())
}

/**
 * Keeps <html> in step with the theme setting and, for `auto`, the device's: `data-theme` switches
 * the colour tokens and the colour scheme darkens the native controls and scrollbars. The setting is
 * mirrored too. This runs outside React, so the tokens have changed before anything redraws with them
 * (the notation reads them as it draws). Call it once the device settings have loaded, before the
 * app renders; until then the inline script's theme stands.
 */
export function followTheme() {
  const media = window.matchMedia(SYSTEM_DARK)
  const apply = () => {
    const resolved = resolve(useAppStore.getState().device.theme, media.matches)
    document.documentElement.dataset.theme = resolved
    document.documentElement.style.colorScheme = resolved
  }
  const mirror = (theme: Theme) => {
    try {
      localStorage.setItem(THEME_MIRROR_KEY, theme)
    } catch {
      // Storage blocked: the next launch starts in Auto until the app loads the setting.
    }
  }
  apply()
  mirror(useAppStore.getState().device.theme)
  media.addEventListener('change', apply)
  useAppStore.subscribe((state, previous) => {
    if (state.device.theme === previous.device.theme) return
    apply()
    mirror(state.device.theme)
  })
}
