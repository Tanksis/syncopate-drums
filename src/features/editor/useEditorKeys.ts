import { useEffect } from 'react'
import { useAppStore } from '@/app/store'
import { commandForKey } from '@/core'

/**
 * Turns key presses anywhere outside a text field into editor commands, via the core's key map in
 * the editor's mode; none while a dialog is open. `?` calls `onHelp` instead.
 */
export function useEditorKeys(onHelp: () => void) {
  const dispatch = useAppStore((s) => s.dispatch)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select, [contenteditable]')) return
      if (document.querySelector('dialog[open]')) return
      if (e.key === '?' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault()
        onHelp()
        return
      }
      const { editor, device } = useAppStore.getState()
      const command = commandForKey(e, { ...editor, vimKeys: device.vimKeys })
      if (!command) return
      e.preventDefault()
      dispatch(command)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dispatch, onHelp])
}
