import type { PointerEvent } from 'react'
import { useRef, useState } from 'react'

export type SwipeDirection = 'left' | 'right' | 'down'

/** How far, in px, a pointer moves before the gesture is read as across or down. */
const DECIDE_AFTER = 10

/** A swipe counts once it has gone this far, in px, or moved this fast, in px per ms, over at least FLICK_MIN px. */
const SWIPE_DISTANCE = 70
const FLICK_SPEED = 0.5
const FLICK_MIN = 24

/** Where a gesture began, and once it has moved far enough, which way it runs. */
interface Gesture {
  pointerId: number
  x: number
  y: number
  time: number
  axis?: 'x' | 'y'
}

/**
 * Swipes on an element: a drag left or right, or down, that goes far or fast enough calls that
 * direction's handler. A gesture that runs the other way is left to the browser (a scroll), and one
 * that starts on a slider or a field is left to it, as is one in a dialog opened over the element. Once a swipe is under way the element captures
 * the pointer, so the button it started on isn't clicked. `offset` follows the pointer along the
 * swipe while it's under way, for an element that moves with it. Give the element the matching
 * `touch-action` (`touch-pan-y` for left and right, `touch-pan-x` for down).
 */
export function useSwipe(handlers: Partial<Record<SwipeDirection, () => void>>) {
  const gesture = useRef<Gesture | undefined>(undefined)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const across = handlers.left !== undefined || handlers.right !== undefined

  const end = () => {
    gesture.current = undefined
    setOffset({ x: 0, y: 0 })
  }

  const props = {
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      if (!e.isPrimary || e.button !== 0) return
      if (!(e.target instanceof Element) || e.target.closest('[role=slider], input, textarea, select')) return
      // A sheet or dialog opened from the element is a layer of its own.
      if (e.target.closest('dialog') !== e.currentTarget.closest('dialog')) return
      gesture.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY, time: e.timeStamp }
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const g = gesture.current
      if (!g || g.pointerId !== e.pointerId) return
      const dx = e.clientX - g.x
      const dy = e.clientY - g.y
      if (!g.axis) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < DECIDE_AFTER) return
        const axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
        if (axis === 'x' ? !across : handlers.down === undefined) return end()
        g.axis = axis
        e.currentTarget.setPointerCapture(e.pointerId)
      }
      setOffset(g.axis === 'x' ? { x: dx, y: 0 } : { x: 0, y: Math.max(0, dy) })
    },
    onPointerUp: (e: PointerEvent<HTMLElement>) => {
      const g = gesture.current
      if (!g || g.pointerId !== e.pointerId) return
      end()
      if (!g.axis) return
      const moved = g.axis === 'x' ? e.clientX - g.x : e.clientY - g.y
      const speed = Math.abs(moved) / Math.max(1, e.timeStamp - g.time)
      if (Math.abs(moved) < SWIPE_DISTANCE && (speed < FLICK_SPEED || Math.abs(moved) < FLICK_MIN)) return
      if (g.axis === 'y' && moved < 0) return // up: no swipe takes it
      handlers[g.axis === 'y' ? 'down' : moved < 0 ? 'left' : 'right']?.()
    },
    onPointerCancel: end,
  }
  return { props, offset, swiping: offset.x !== 0 || offset.y !== 0 }
}
