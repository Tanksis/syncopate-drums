import { useEffect } from 'react'
import { useAppStore } from '@/app/store'
import { commandForKey } from '@/core'

/** Turns key presses anywhere outside a text field or dialog into editor commands, via the core's key map. */
export function useEditorKeys() {
  const dispatch = useAppStore((s) => s.dispatch)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select, [contenteditable], dialog')) return
      const command = commandForKey(e)
      if (!command) return
      e.preventDefault()
      dispatch(command)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dispatch])
}
