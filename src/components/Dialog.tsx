import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'

/** A dialog button; `danger` marks the one that changes something for good. */
export function DialogButton({
  children,
  onClick,
  danger = false,
  autoFocus = false,
}: {
  children: ReactNode
  onClick: () => void
  danger?: boolean
  /** Takes the focus when the dialog opens, so Enter presses it. */
  autoFocus?: boolean
}) {
  return (
    <button
      type="button"
      data-autofocus={autoFocus || undefined}
      onClick={onClick}
      className={`cursor-pointer rounded-md border px-3 py-1 font-semibold ${
        danger ? 'border-danger bg-danger text-white hover:opacity-90' : 'border-line bg-card hover:border-accent'
      }`}
    >
      {children}
    </button>
  )
}

/**
 * A modal with a title, a message and a row of `DialogButton`s. The one marked `autoFocus` has the
 * focus; Escape and clicking outside call `onCancel`.
 */
export function Dialog({
  title,
  children,
  buttons,
  onCancel,
}: {
  title: string
  children: ReactNode
  buttons: ReactNode
  onCancel: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const shown = dialog.current
    shown?.showModal()
    shown?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
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
      className="m-auto w-96 max-w-[calc(100vw-2rem)] rounded-lg border border-line bg-card p-0 text-ink shadow-lg backdrop:bg-ink/30"
    >
      <div className="flex flex-col gap-3 p-4">
        <h2 className="m-0 text-base font-bold">{title}</h2>
        <div>{children}</div>
        <div className="flex flex-wrap justify-end gap-2">{buttons}</div>
      </div>
    </dialog>
  )
}
