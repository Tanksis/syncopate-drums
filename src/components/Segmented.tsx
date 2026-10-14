import type { KeyboardEvent } from 'react'
import { useRef } from 'react'
import { keepFocus } from './keepFocus'

/** One option of a segmented control. */
export interface SegmentedOption<T> {
  value: T
  label: string
  /** The option's accessible name, when its label alone is too short to say what it is. */
  ariaLabel?: string
  title?: string
}

/** The keys that move the choice: back, on, to the first and to the last. */
const STEP: Record<string, (i: number, n: number) => number> = {
  ArrowLeft: (i, n) => (i - 1 + n) % n,
  ArrowUp: (i, n) => (i - 1 + n) % n,
  ArrowRight: (i, n) => (i + 1) % n,
  ArrowDown: (i, n) => (i + 1) % n,
  Home: () => 0,
  End: (_, n) => n - 1,
}

/**
 * A row of options, one of them chosen: a radio group. Tab reaches the chosen option (or the first),
 * and the arrow keys, Home and End move the choice, as they do in a radio group. A mouse click keeps
 * focus where it was (`keepFocus`). `fill` stretches the options across the width; a `small` one sits
 * in a beat card; `tabbable={false}` leaves the group out of the Tab order where the editor's keys
 * already reach it.
 */
export function Segmented<T extends string | number | boolean>({
  label,
  options,
  value,
  onChange,
  fill = false,
  small = false,
  tabbable = true,
  className = '',
}: {
  label: string
  options: readonly SegmentedOption<T>[]
  value: T | null
  onChange: (value: T) => void
  fill?: boolean
  small?: boolean
  tabbable?: boolean
  className?: string
}) {
  const group = useRef<HTMLDivElement>(null)
  const chosen = options.findIndex((option) => option.value === value)
  // The one option Tab reaches: the chosen one, or the first while none is.
  const stop = chosen === -1 ? 0 : chosen

  const onKeyDown = (e: KeyboardEvent) => {
    const step = STEP[e.key]
    if (!step || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
    // Ahead of the editor's keys, which would move the cursor too.
    e.preventDefault()
    e.stopPropagation()
    const next = step(stop, options.length)
    group.current?.querySelectorAll<HTMLElement>('[role=radio]')[next]?.focus()
    if (next !== chosen) onChange(options[next].value)
  }

  return (
    <div
      ref={group}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={`flex rounded-md border border-edge bg-bg ${small ? 'gap-px p-px text-[10px]/5' : 'gap-0.5 p-0.5'} ${className}`}
    >
      {options.map((option, i) => {
        const on = i === chosen
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={option.ariaLabel}
            title={option.title}
            tabIndex={tabbable && i === stop ? 0 : -1}
            onMouseDown={keepFocus}
            onClick={(e) => {
              // A beat card around the control would take the click as a move to the beat.
              e.stopPropagation()
              if (!on) onChange(option.value)
            }}
            className={`cursor-pointer whitespace-nowrap ${small ? 'rounded-[3px] px-1.5' : `rounded py-px ${fill ? 'flex-auto px-0.5' : 'px-2'}`} ${
              on ? 'bg-accent font-semibold text-on-accent' : 'text-mute hover:bg-card hover:text-ink'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
