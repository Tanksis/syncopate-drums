import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { Button } from './Button'

/**
 * A phone sheet over the lower part of the screen, with its title and Done, which closes it; so do
 * Escape and a tap above it. It is modal: the screen under it waits until it closes.
 */
export function Sheet({ title, onDone, children }: { title: string; onDone: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const shown = dialog.current
    shown?.showModal()
    return () => shown?.close()
  }, [])

  return (
    <dialog
      ref={dialog}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault()
        onDone()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onDone()
      }}
      className="mx-0 mt-auto mb-0 w-full max-w-full rounded-t-2xl border-0 border-t border-line bg-panel p-0 text-ink shadow-popover backdrop:bg-shade/30"
    >
      <div className="flex flex-col gap-4 px-4 pt-3.5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-2">
          <h2 className="m-0 font-display text-2xl font-semibold">{title}</h2>
          <Button variant="primary" size="lg" onClick={onDone} className="px-5">
            Done
          </Button>
        </div>
        {children}
      </div>
    </dialog>
  )
}
