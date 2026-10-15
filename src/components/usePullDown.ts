import type { RefObject } from 'react'
import { useEffect, useRef, useState } from 'react'

/** A pull counts once it has gone this far, in px, or moved this fast, in px per ms, over at least FLICK_MIN px (as a swipe does). */
const PULL_DISTANCE = 70
const FLICK_SPEED = 0.5
const FLICK_MIN = 24

/**
 * A drag down on a scroller already at its top, as on a phone's sheet: rather than bounce the page,
 * it pulls what holds the scroller down, and past a little way or on a flick calls `onPull`. A drag
 * that starts any other way scrolls as usual. Touch only: a mouse drags the sheet by its header.
 * `offset` is how far the finger has pulled, for the sheet to follow.
 */
export function usePullDown(scroller: RefObject<HTMLElement | null>, onPull: () => void) {
  const [offset, setOffset] = useState(0)
  const onPullRef = useRef(onPull)
  onPullRef.current = onPull

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    let start: { x: number; y: number; time: number; atTop: boolean } | undefined
    let pulling = false
    let moved = 0

    const touchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return (start = undefined)
      const t = e.touches[0]
      start = { x: t.clientX, y: t.clientY, time: e.timeStamp, atTop: el.scrollTop <= 0 }
      pulling = false
    }
    const touchMove = (e: TouchEvent) => {
      if (!start?.atTop) return
      const t = e.touches[0]
      const dy = t.clientY - start.y
      // At the top, a first move down is the sheet's, before the browser can start a bounce.
      if (!pulling) {
        if (dy <= 0 || Math.abs(t.clientX - start.x) > dy) return (start = undefined)
        pulling = true
      }
      if (e.cancelable) e.preventDefault()
      moved = Math.max(0, dy)
      setOffset(moved)
    }
    const touchEnd = (e: TouchEvent) => {
      const s = start
      start = undefined
      if (!pulling || !s) return
      pulling = false
      setOffset(0)
      const speed = moved / Math.max(1, e.timeStamp - s.time)
      if (moved >= PULL_DISTANCE || (speed >= FLICK_SPEED && moved >= FLICK_MIN)) onPullRef.current()
    }

    el.addEventListener('touchstart', touchStart, { passive: true })
    // Not passive, so a pull can keep the page from bouncing.
    el.addEventListener('touchmove', touchMove, { passive: false })
    el.addEventListener('touchend', touchEnd)
    el.addEventListener('touchcancel', touchEnd)
    return () => {
      el.removeEventListener('touchstart', touchStart)
      el.removeEventListener('touchmove', touchMove)
      el.removeEventListener('touchend', touchEnd)
      el.removeEventListener('touchcancel', touchEnd)
    }
  }, [scroller])

  return offset
}
