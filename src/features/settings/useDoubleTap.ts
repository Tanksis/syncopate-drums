import type { PointerEvent } from 'react'
import { useRef } from 'react'

/**
 * Tells a slider's second quick release from its first, so a double-click or double-tap can reset
 * it. Both releases must land close together: a drag and then a tap elsewhere isn't a double tap.
 */
export function useDoubleTap() {
  const last = useRef({ time: 0, x: 0, y: 0 })
  return (e: PointerEvent) => {
    const { time, x, y } = last.current
    const now = performance.now()
    const second = now - time < 350 && Math.hypot(e.clientX - x, e.clientY - y) < 12
    last.current = { time: second ? 0 : now, x: e.clientX, y: e.clientY }
    return second
  }
}
