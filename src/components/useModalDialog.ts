import type { MouseEvent, RefObject, SyntheticEvent } from 'react'
import { useEffect, useRef } from 'react'

/**
 * Shows a <dialog> as a modal while it's mounted, closing it on unmount. Spread the returned props
 * on the dialog: Escape and a click on the backdrop, outside its box, call `onCancel`.
 */
export function useModalDialog(onCancel: () => void): {
  ref: RefObject<HTMLDialogElement | null>
  onCancel: (e: SyntheticEvent) => void
  onClick: (e: MouseEvent) => void
} {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const shown = ref.current
    shown?.showModal()
    shown?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    return () => shown?.close()
  }, [])
  return {
    ref,
    onCancel: (e) => {
      e.preventDefault()
      onCancel()
    },
    onClick: (e) => {
      if (e.target === e.currentTarget) onCancel()
    },
  }
}
