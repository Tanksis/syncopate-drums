import { useEffect } from 'react'
import { togglePause, togglePlayback } from './transport'

/**
 * Ctrl+Space plays from the count-in or stops, from anywhere, even inside a text field. Space
 * pauses and resumes, outside text fields and buttons and while no dialog is open.
 */
export function usePlaybackKeys() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.metaKey || e.shiftKey || e.code !== 'Space') return
      if (!e.ctrlKey) {
        if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select, button, [contenteditable]')) return
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
