import { useEffect } from 'react'
import { useAppStore } from '@/app/store'
import { onControl } from '@/components/focus'
import { commandForKey } from '@/core'

/**
 * Turns key presses into editor commands, via the core's key map, while the focus is on the page
 * rather than a control (which Shift+Tab moves into); none while a dialog is open. `?` calls
 * `onHelp` instead. Esc on a control that doesn't take it hands the keyboard back to the editor.
 */
export function useEditorKeys(onHelp: () => void) {
  const dispatch = useAppStore((s) => s.dispatch)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (onControl(e.target)) {
        // A text field's Esc puts its text back; a menu's closes it ahead of this.
        if (e.key === 'Escape' && !e.target.closest('input:not([type=range]), textarea, select, [contenteditable]')) e.target.blur()
        return
      }
      if (document.querySelector('dialog[open]')) return
      if (e.key === '?' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault()
        onHelp()
        return
      }
      const command = commandForKey(e)
      if (!command) return
      e.preventDefault()
      dispatch(command)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dispatch, onHelp])
}
