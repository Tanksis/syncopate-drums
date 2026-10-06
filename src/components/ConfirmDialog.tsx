import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'

/**
 * A modal that asks before something can't be taken back. Cancel has the focus, so Enter is safe;
 * Escape, Cancel and clicking outside call `onCancel`.
 */
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string
  children: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const cancel = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const shown = dialog.current
    shown?.showModal()
    cancel.current?.focus()
    return () => shown?.close()
  }, [])

  return (
    <dialog
      ref={dialog}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault()
        onCancel()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
      className="m-auto w-80 rounded-lg border border-line bg-card p-0 text-ink shadow-lg backdrop:bg-ink/30"
    >
      <div className="flex flex-col gap-3 p-4">
        <h2 className="m-0 text-base font-bold">{title}</h2>
        <div>{children}</div>
        <div className="flex justify-end gap-2">
          <button
            ref={cancel}
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-md border border-line bg-card px-3 py-1 font-semibold hover:border-accent"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="cursor-pointer rounded-md border border-danger bg-danger px-3 py-1 font-semibold text-white hover:opacity-90"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}
