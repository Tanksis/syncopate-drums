import { useRef, useState } from 'react'
import { parsePercent } from '@/core'

/**
 * A slider's `%` readout as a small field to type into. Enter or leaving it applies the typed value
 * (clamped; nonsense keeps the old one), Escape puts it back, and ↑/↓ step by 1 (Shift by 10) at once.
 */
export function PercentField({
  label,
  value,
  min,
  max,
  decimals,
  onChange,
  className,
}: {
  label: string
  /** In percent. */
  value: number
  min: number
  max: number
  /** How many decimals the field shows; typed values are rounded to it. */
  decimals: number
  onChange: (percent: number) => void
  className: string
}) {
  const [draft, setDraft] = useState<string | null>(null)
  // Escape leaves the field without applying what was typed.
  const reverting = useRef(false)
  const round = (percent: number) => Number(percent.toFixed(decimals))
  const read = (text: string) => round(parsePercent(text, { min, max, previous: value }))
  const shown = `${value.toFixed(decimals)}%`

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
      className={`rounded-md border border-edge bg-card px-1 text-right text-base tabular-nums sm:text-sm ${className}`}
    />
  )
}

