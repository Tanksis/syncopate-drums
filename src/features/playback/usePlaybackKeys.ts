import { useEffect } from 'react'
import { togglePlayback } from './transport'

/** Ctrl+Space toggles playback from anywhere, even inside a text field. Plain Space is the rest beat. */
export function usePlaybackKeys() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey || e.altKey || e.metaKey || e.code !== 'Space') return
      e.preventDefault()
      if (!e.repeat) togglePlayback()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
