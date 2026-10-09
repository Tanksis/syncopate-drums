import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { keepFocus } from './keepFocus'

/** One choice in a menu. */
export interface MenuItem {
  label: string
  /** A toggle's state, shown as a tick; leave undefined for a plain action. */
  checked?: boolean
  /** Shown greyed out, and does nothing when chosen. */
  disabled?: boolean
  onSelect: () => void
}

/**
 * A ⋯ button that opens a small popover of items under it, or over it where there's no room
 * below. It closes on a choice, `Esc`, a click or tap outside it, or a scroll. Neither the button
 * nor the items take focus, so the editor's keys work as before once it closes; `Esc` goes to the
 * menu only while it's open. A `large` button is big enough for a finger.
 */
export function Menu({ label, items, large = false }: { label: string; items: MenuItem[]; large?: boolean }) {
  // The button's box, which the popover hangs from; null while closed.
  const [anchor, setAnchor] = useState<{ top: number; bottom: number; right: number } | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const popover = useRef<HTMLDivElement>(null)

  // Under the button, or over it if it would run off the bottom of the window.
  useLayoutEffect(() => {
    const menu = popover.current
    if (!anchor || !menu) return
    const { height } = menu.getBoundingClientRect()
    const below = anchor.bottom + 4
    menu.style.top = `${below + height > window.innerHeight ? Math.max(4, anchor.top - 4 - height) : below}px`
  }, [anchor])

  useEffect(() => {
    if (!anchor) return
    const close = () => setAnchor(null)
    const onPointerDown = (e: PointerEvent) => {
      if (!(e.target instanceof Node && root.current?.contains(e.target))) close()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // Ahead of the sidebars' and the editor's keys, which then don't see it.
      e.preventDefault()
      e.stopPropagation()
      close()
    }
    window.addEventListener('pointerdown', onPointerDown, { capture: true })
    window.addEventListener('keydown', onKeyDown, { capture: true })
    window.addEventListener('scroll', close, { capture: true })
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, { capture: true })
      window.removeEventListener('keydown', onKeyDown, { capture: true })
      window.removeEventListener('scroll', close, { capture: true })
      window.removeEventListener('resize', close)
    }
  }, [anchor])

  return (
    // Clicks in the menu stay in it, so a card or row around it doesn't take them too.
    <div ref={root} onClick={(e) => e.stopPropagation()} className="contents">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={anchor !== null}
        title={label}
        tabIndex={-1}
        onMouseDown={keepFocus}
        onClick={(e) => {
          const box = e.currentTarget.getBoundingClientRect()
          setAnchor(anchor ? null : { top: box.top, bottom: box.bottom, right: window.innerWidth - box.right })
        }}
        className={`cursor-pointer text-mute hover:bg-line hover:text-accent aria-expanded:bg-line aria-expanded:text-accent ${
          large ? 'size-9 rounded-lg border border-edge bg-card text-base/none' : 'rounded px-1 text-sm/none'
        }`}
      >
        ⋯
      </button>
      {anchor && (
        // Fixed, so a scrolling panel around the button doesn't clip it.
        <div
          ref={popover}
          role="menu"
          aria-label={label}
          style={{ right: anchor.right }}
          className="fixed z-30 flex min-w-44 flex-col rounded-lg border border-line bg-card py-1 text-sm shadow-lg"
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
                setAnchor(null)
                item.onSelect()
              }}
              className="flex cursor-pointer items-center gap-2 px-3 py-2 text-left whitespace-nowrap hover:bg-panel hover:text-accent disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-inherit"
            >
              <span aria-hidden className="w-3 text-accent">
                {item.checked ? '✓' : ''}
              </span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
