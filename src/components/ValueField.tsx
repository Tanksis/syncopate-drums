import { useRef, useState } from 'react'
import { parsePercent } from '@/core'

/** A text field's look: the value field's, and the BPM box's. */
export const fieldClass = 'rounded-md border border-edge bg-card tabular-nums'

/**
 * A slider's readout as a small field to type into, its `unit` after the number (`%`). Enter or
 * leaving it applies the typed value (clamped; nonsense keeps the old one), Escape puts it back, and
 * ↑/↓ step by 1 (Shift by 10) at once.
 */
export function ValueField({
  label,
  value,
  unit,
  min,
  max,
  decimals,
  onChange,
  className,
}: {
  label: string
  /** In `unit`s. */
  value: number
  unit: string
  min: number
  max: number
  /** How many decimals the field shows; typed values are rounded to it. */
  decimals: number
  onChange: (value: number) => void
  className: string
}) {
  const [draft, setDraft] = useState<string | null>(null)
  // Escape leaves the field without applying what was typed.
  const reverting = useRef(false)
  const round = (n: number) => Number(n.toFixed(decimals))
  const read = (text: string) => round(parsePercent(text, { min, max, previous: value }))
  const shown = `${value.toFixed(decimals)}${unit}`

  const commit = () => {
    if (draft !== null && !reverting.current) onChange(read(draft))
    reverting.current = false
    setDraft(null)
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      aria-label={label}
      value={draft ?? shown}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={(e) => e.currentTarget.select()}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          // Leaving the field applies it and hands the keyboard back to the editor.
          e.currentTarget.blur()
        } else if (e.key === 'Escape') {
          reverting.current = true
          e.currentTarget.blur()
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault()
          const from = read(draft ?? shown)
          const step = (e.shiftKey ? 10 : 1) * (e.key === 'ArrowUp' ? 1 : -1)
          onChange(Math.min(max, Math.max(min, round(from + step))))
          setDraft(null)
        }
      }}
      // 16 px on a phone, or iOS zooms in when the field takes focus.
      className={`${fieldClass} px-1 text-right text-base sm:text-sm ${className}`}
    />
  )
}

