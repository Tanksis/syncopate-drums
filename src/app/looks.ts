import type { Look } from '@/core'

/** Each look's name, as the Theme menu shows it. */
const LOOK_NAMES: Record<Look, string> = {
  warm: 'Warm',
  studio: 'Studio',
}

export const lookName = (look: Look) => LOOK_NAMES[look]

/**
 * The looks the app has styles for (ADR 0013), in the Theme menu's order, with each one's
 * self-hosted fonts, imported only while it's chosen. A look's tokens are in styles/index.css.
 */
export const LOOK_STYLES: readonly { look: Look; loadFonts: () => Promise<unknown> }[] = [
  {
    look: 'warm',
    loadFonts: () =>
      Promise.all([
        import('@fontsource/dm-sans/400.css'),
        import('@fontsource/dm-sans/600.css'),
        import('@fontsource/dm-sans/700.css'),
        import('@fontsource/fraunces/600.css'),
        import('@fontsource/fraunces/700.css'),
      ]),
  },
  {
    look: 'studio',
    loadFonts: () =>
      Promise.all([
        import('@fontsource/geist/400.css'),
        import('@fontsource/geist/600.css'),
        import('@fontsource/geist/700.css'),
        import('@fontsource/geist-mono/400.css'),
        import('@fontsource/geist-mono/600.css'),
        import('@fontsource/geist-mono/700.css'),
      ]),
  },
]

/** Imports a look's fonts. Until they load, or if they fail to, its text falls back to the system's. */
export function loadLookFonts(look: Look) {
  LOOK_STYLES.find((style) => style.look === look)
    ?.loadFonts()
    .catch(() => {})
}
