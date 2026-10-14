import type { KeyboardEvent, ReactNode } from 'react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { buttonClass } from './Button'
import { keepFocus } from './keepFocus'

/** One choice in a menu. */
export interface MenuItem {
  label: string
  /** A few words after the label, saying what the item means. */
  hint?: string
  /** A toggle's state, shown as a tick; leave undefined for a plain action. */
  checked?: boolean
  /** Shown greyed out, and does nothing when chosen. */
  disabled?: boolean
  onSelect: () => void
}

/** Where the popover hangs from: the button's box, and whether the keyboard opened it. */
interface Anchor {
  top: number
  bottom: number
  left: number
  right: number
  byKeyboard: boolean
}

/**
 * A ⋯ button (or `icon`) that opens a small popover of items under it, or over it where there's no
 * room below; the popover lines up with the button's right edge, or its left with `align="left"`.
 * It closes on a choice, `Esc`, a click or tap outside it, or a scroll.
 *
 * Tab reaches the button; Enter, Space or ↓ opens the menu with focus on the ticked item (or the
 * first), ↑/↓, Home and End move, Enter chooses, and Esc or Tab closes it and gives focus back to
 * the button. A mouse click keeps focus where it was (`keepFocus`), so the editor's keys work as
 * before once it closes; `Esc` goes to the menu only while it's open. A `large` menu's button and
 * items are big enough for a finger; `buttonClassName` replaces the button's look.
 */
export function Menu({
  label,
  items,
  large = false,
  icon = '⋯',
  align = 'right',
  buttonClassName,
}: {
  label: string
  items: MenuItem[]
  large?: boolean
  icon?: ReactNode
  align?: 'left' | 'right'
  buttonClassName?: string
}) {
  const [anchor, setAnchor] = useState<Anchor | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const popover = useRef<HTMLDivElement>(null)

  const show = (byKeyboard: boolean) => {
    const box = button.current!.getBoundingClientRect()
    setAnchor({ top: box.top, bottom: box.bottom, left: box.left, right: window.innerWidth - box.right, byKeyboard })
  }
  /** Closes the menu; if the focus was in it, it goes back to the button. */
  const close = () => {
    if (popover.current?.contains(document.activeElement)) button.current?.focus()
    setAnchor(null)
  }
  const enabledItems = () => [...(popover.current?.querySelectorAll<HTMLElement>('[role^=menuitem]:not(:disabled)') ?? [])]

  // Under the button, or over it if it would run off the bottom of the window; opened from the
  // keyboard, the focus goes to the ticked item, or the first.
  useLayoutEffect(() => {
    const menu = popover.current
    if (!anchor || !menu) return
    const { height } = menu.getBoundingClientRect()
    const below = anchor.bottom + 4
    menu.style.top = `${below + height > window.innerHeight ? Math.max(4, anchor.top - 4 - height) : below}px`
    if (!anchor.byKeyboard) return
    const enabled = enabledItems()
    ;(enabled.find((item) => item.getAttribute('aria-checked') === 'true') ?? enabled[0])?.focus({ preventScroll: true })
  }, [anchor])

  useEffect(() => {
    if (!anchor) return
    // A click outside, a scroll or a resize leaves the focus where it lands.
    const dismiss = () => setAnchor(null)
    const onPointerDown = (e: PointerEvent) => {
      if (!(e.target instanceof Node && root.current?.contains(e.target))) dismiss()
    }
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // Ahead of the sidebars' and the editor's keys, which then don't see it.
      e.preventDefault()
      e.stopPropagation()
      close()
    }
    window.addEventListener('pointerdown', onPointerDown, { capture: true })
    window.addEventListener('keydown', onKeyDown, { capture: true })
    window.addEventListener('scroll', dismiss, { capture: true })
    window.addEventListener('resize', dismiss)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, { capture: true })
      window.removeEventListener('keydown', onKeyDown, { capture: true })
      window.removeEventListener('scroll', dismiss, { capture: true })
      window.removeEventListener('resize', dismiss)
    }
  }, [anchor])

  const onButtonKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'ArrowDown') return
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
    // Ahead of the button's own click, and of the editor's and playback keys.
    e.preventDefault()
    e.stopPropagation()
    show(true)
  }

  const onMenuKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      e.stopPropagation()
      close()
      return
    }
    const enabled = enabledItems()
    const at = enabled.indexOf(document.activeElement as HTMLElement)
    const to =
      e.key === 'ArrowDown' ? (at + 1) % enabled.length
      : e.key === 'ArrowUp' ? (at - 1 + enabled.length) % enabled.length
      : e.key === 'Home' ? 0
      : e.key === 'End' ? enabled.length - 1
      : null
    // Enter and Space click the focused item, as buttons do; keep them from the app's keys.
    if (to === null && e.key !== 'Enter' && e.key !== ' ') return
    e.stopPropagation()
    if (to === null) return
    e.preventDefault()
    enabled[to]?.focus({ preventScroll: true })
  }

  return (
    // Clicks in the menu stay in it, so a card or row around it doesn't take them too.
    <div ref={root} onClick={(e) => e.stopPropagation()} className="contents">
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={anchor !== null}
        title={label}
        onMouseDown={keepFocus}
        onKeyDown={onButtonKeyDown}
        onClick={() => (anchor ? setAnchor(null) : show(false))}
        className={buttonClassName ?? buttonClass({ variant: large ? 'secondary' : 'ghost', size: large ? 'lg' : 'sm', icon: true })}
      >
        {icon}
      </button>
      {anchor && (
        // Fixed, so a scrolling panel around the button doesn't clip it.
        <div
          ref={popover}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          style={align === 'left' ? { left: anchor.left } : { right: anchor.right }}
          className="fixed z-30 flex min-w-44 flex-col rounded-lg border border-line bg-card p-1 text-sm shadow-popover"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role={item.checked === undefined ? 'menuitem' : 'menuitemcheckbox'}
              aria-checked={item.checked}
              disabled={item.disabled}
              tabIndex={-1}
              onMouseDown={keepFocus}
              onClick={() => {
                close()
                item.onSelect()
              }}
              className={`flex cursor-pointer items-center gap-2 rounded px-2 text-left whitespace-nowrap ${large ? 'py-3 text-base' : 'py-1.5'} enabled:hover:bg-select focus-visible:bg-select focus-visible:-outline-offset-2 disabled:cursor-default disabled:opacity-40`}
            >
              <span aria-hidden className="w-3 text-accent">
                {item.checked ? '✓' : ''}
              </span>
              {item.label}
              {item.hint && <span className="ml-auto pl-3 text-mute">{item.hint}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
