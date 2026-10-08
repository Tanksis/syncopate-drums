import { useSyncExternalStore } from 'react'

/** Below this width the sidebars are rails that open as overlays. */
const NARROW = '(width < 1000px)'

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(NARROW)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/** Whether the window is narrower than 1000 px, kept up to date as it's resized. */
export function useNarrowWindow(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(NARROW).matches)
}
