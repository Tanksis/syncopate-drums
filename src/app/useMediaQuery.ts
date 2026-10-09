import { useCallback, useSyncExternalStore } from 'react'

/** Below 1000 px wide the sidebars are rails that open as overlays. */
const NARROW = '(width < 1000px)'

/** Below 640 px wide the app is the phone layout: a column with a transport bar at the bottom. */
const PHONE = '(width < 640px)'

/** A touch screen: keyboard hints are hidden. */
const COARSE_POINTER = '(pointer: coarse)'

/** Whether the media query matches, kept up to date as it changes. */
function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches)
}

/** Whether the window is narrower than 1000 px. */
export const useNarrowWindow = () => useMediaQuery(NARROW)

/** Whether the window is narrower than 640 px, the phone layout. */
export const usePhoneWindow = () => useMediaQuery(PHONE)

/** Whether the primary pointer is coarse, a finger rather than a mouse. */
export const useCoarsePointer = () => useMediaQuery(COARSE_POINTER)
