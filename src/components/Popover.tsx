import type { FocusEvent, ReactNode } from 'react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { keepFocus } from './keepFocus'

/** Where the panel hangs from: the button's box, and whether the keyboard opened it. */
interface Anchor {
  bottom: number
  right: number
  byKeyboard: boolean
}

/**
 * A button that opens a small panel of settings under it, its right edge lined up with the button's:
 * not modal, so what's behind it stays in sight and a change shows at once. It closes on the button
 * again, `Esc`, a click or tap outside it, Tab leaving it, or a resize; one taller than the room
 * under the button scrolls.
 *
 * A mouse click keeps focus where it was (`keepFocus`), so Space still plays; opened from the keyboard,
 * the focus goes to the panel's first control, and back to the button when `Esc` closes it. The panel
 * is a `dialog`, so a `Menu` inside it opens in it. `buttonClassName` gives the button its look, and
 * `button` is what it shows.
 */
export function Popover({
  label,
  title = label,
  button: face,
  buttonClassName,
  children,
}: {
  label: string
  title?: string
  button: ReactNode
  buttonClassName: string
  children: ReactNode
}) {
  const [anchor, setAnchor] = useState<Anchor | null>(null)
  const button = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDialogElement>(null)

  const show = (byKeyboard: boolean) => {
    const box = button.current!.getBoundingClientRect()
    setAnchor({ bottom: box.bottom, right: window.innerWidth - box.right, byKeyboard })
  }
  /** Closes the panel; if the focus was in it, it goes back to the button. */
  const close = () => {
    if (panel.current?.contains(document.activeElement)) button.current?.focus()
    setAnchor(null)
  }

  useLayoutEffect(() => {
    const el = panel.current
    if (!anchor || !el) return
    el.style.maxHeight = `${window.innerHeight - anchor.bottom - 12}px`
    if (anchor.byKeyboard) el.querySelector<HTMLElement>('button, input, [tabindex="0"]')?.focus({ preventScroll: true })
  }, [anchor])

  useEffect(() => {
    if (!anchor) return
    const dismiss = () => setAnchor(null)
    const onPointerDown = (e: PointerEvent) => {
      if (!(e.target instanceof Node && (button.current?.contains(e.target) || panel.current?.contains(e.target)))) dismiss()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      // A menu open in the panel takes its own Esc.
      if (e.key !== 'Escape' || panel.current?.querySelector('[role=menu]')) return
      // Ahead of the sidebars' and the editor's keys, which then don't see it.
      e.preventDefault()
      e.stopPropagation()
      close()
    }
    window.addEventListener('pointerdown', onPointerDown, { capture: true })
    window.addEventListener('keydown', onKeyDown, { capture: true })
    window.addEventListener('resize', dismiss)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, { capture: true })
      window.removeEventListener('keydown', onKeyDown, { capture: true })
      window.removeEventListener('resize', dismiss)
    }
  }, [anchor])

  // Tab out of the panel closes it, as it does a menu.
  const onBlur = (e: FocusEvent) => {
    const to = e.relatedTarget
    if (to instanceof Node && !panel.current?.contains(to) && !button.current?.contains(to)) setAnchor(null)
  }

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={anchor !== null}
        title={title}
        onMouseDown={keepFocus}
        // A click from Enter or Space has no detail; the mouse's counts its clicks.
        onClick={(e) => (anchor ? setAnchor(null) : show(e.detail === 0))}
        className={buttonClassName}
      >
        {face}
      </button>
      {anchor &&
        // Fixed, so a scrolling panel around the button doesn't clip it, and in the body, so a moved
        // (transformed) sidebar around the button, which a fixed box is placed from, doesn't move it.
        createPortal(
          <dialog
            ref={panel}
            open
            aria-label={label}
            onBlur={onBlur}
            style={{ top: anchor.bottom + 6, right: anchor.right }}
            className="fixed left-auto z-30 m-0 flex w-72 flex-col gap-3.5 overflow-y-auto overscroll-contain rounded-lg border border-line bg-card p-3 text-ink shadow-popover"
          >
            {children}
          </dialog>,
          document.body,
        )}
    </>
  )
}
