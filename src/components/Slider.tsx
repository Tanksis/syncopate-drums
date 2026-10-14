import { useRef } from 'react'
import { useDoubleTap } from './useDoubleTap'

/**
 * A slider in the accent. While a pointer drags it, `onChange` is told it's `dragging`, so the value
 * plays at once but is saved once the drag ends; arrow keys on it save at once. Once a drag ends the
 * keyboard goes back to the app, and a double-click or double-tap puts it back to `reset`, given one.
 */
export function Slider({
  label,
  value,
  min,
  max,
  step,
  reset,
  onChange,
  className = '',
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  reset?: number
  onChange: (value: number, options: { dragging: boolean }) => void
  className?: string
}) {
  const dragging = useRef(false)
  const doubleTap = useDoubleTap()
  return (
    <input
      type="range"
      aria-label={label}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value), { dragging: dragging.current })}
      onPointerDown={() => (dragging.current = true)}
      onPointerUp={(e) => {
        dragging.current = false
        const tapped = doubleTap(e)
        onChange(tapped && reset !== undefined ? reset : Number(e.currentTarget.value), { dragging: false })
        e.currentTarget.blur()
      }}
      className={`min-w-0 cursor-pointer touch-manipulation accent-accent ${className}`}
    />
  )
}
