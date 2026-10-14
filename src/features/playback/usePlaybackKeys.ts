import { useEffect } from 'react'
import { usesSpace } from '@/components/focus'
import { togglePause, togglePlayback } from './transport'

/**
 * Ctrl+Space plays from the count-in or stops, from anywhere, even inside a text field. Space
 * pauses and resumes while no dialog is open, unless the focused control takes Space itself (a
 * button, a switch, a field); on a slider it still pauses.
 */
export function usePlaybackKeys() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.metaKey || e.shiftKey || e.code !== 'Space') return
      if (!e.ctrlKey) {
        if (usesSpace(e.target)) return
        if (document.querySelector('dialog[open]')) return
      }
      e.preventDefault()
      if (e.repeat) return
      if (e.ctrlKey) togglePlayback()
      else togglePause()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
