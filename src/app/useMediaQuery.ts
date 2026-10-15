import { useCallback, useSyncExternalStore } from 'react'

/** Below 1000 px wide the sidebars are rails that open as overlays. */
const NARROW = '(width < 1000px)'

/**
 * The phone layout: a window under 640 px wide, or a touch screen under 500 px tall, which is a phone
 * turned sideways (about 750 × 340). A desktop window that's merely short keeps the desktop layout.
 */
const PHONE = '(width < 640px), (height < 500px) and (pointer: coarse)'

/** The phone layout turned sideways: the screen tabs move to a rail down its side. */
const LANDSCAPE = '(orientation: landscape)'

/** Which way the phone is held, which arranges its layout. */
export type PhoneOrientation = 'portrait' | 'landscape'

/** A touch screen: keyboard hints are hidden. */
const COARSE_POINTER = '(pointer: coarse)'

/** The device is set to a dark appearance, which the `auto` theme follows. */
export const SYSTEM_DARK = '(prefers-color-scheme: dark)'

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

/** Whether the window gets the phone layout: narrower than 640 px, or a phone turned sideways. */
export const usePhoneWindow = () => useMediaQuery(PHONE)

/** Which way the phone layout is held: sideways when the window is wider than it is tall. */
export const usePhoneOrientation = (): PhoneOrientation => (useMediaQuery(LANDSCAPE) ? 'landscape' : 'portrait')

/** Whether the primary pointer is coarse, a finger rather than a mouse. */
export const useCoarsePointer = () => useMediaQuery(COARSE_POINTER)

/** Whether the device is set to a dark appearance, which the `auto` theme follows. */
export const useSystemDark = () => useMediaQuery(SYSTEM_DARK)
