// Following the playback in the notation: a rAF loop outside React that draws the playhead line
// on the hit the drummer is hearing and keeps its line of music in view.

import { playhead } from '@/features/playback/engine'
import type { Drawing, DrawnLine } from './staff'

const SVG_NS = 'http://www.w3.org/2000/svg'

/**
 * Follows playback until the returned stop function is called. It reads the current drawing on
 * every frame, so a redraw while playing (an edit, a resize) is picked up at once.
 */
export function followPlayback(scroller: HTMLElement, staff: HTMLElement, drawing: () => Drawing | undefined) {
  const marker = document.createElementNS(SVG_NS, 'line')
  marker.classList.add('stroke-play', 'pointer-events-none')
  marker.setAttribute('stroke-width', '2')
  marker.setAttribute('stroke-linecap', 'round')
  let shown: { drawing: Drawing; top: number } | undefined
  let frame = requestAnimationFrame(step)

  function step() {
    const head = playhead()
    const current = drawing()
    const mark = head?.hit && current?.playheadMark(head.hit)
    if (mark && current?.svg) {
      // A redraw replaces the SVG, so the line moves into the new one.
      if (marker.parentNode !== current.svg) current.svg.append(marker)
      marker.setAttribute('x1', String(mark.x))
      marker.setAttribute('x2', String(mark.x))
      marker.setAttribute('y1', String(mark.top))
      marker.setAttribute('y2', String(mark.bottom))
    } else marker.remove()
    // Scroll only when the playhead reaches a new line, or after a redraw (which can move the
    // lines), so the drummer can still scroll by hand.
    const bar = head?.position.bar ?? -1
    if (current && bar >= 0) {
      const line = current.line(bar)
      if (shown?.drawing !== current || shown.top !== line.top) scrollLineIntoView(scroller, staff, line)
      shown = { drawing: current, top: line.top }
    }
    frame = requestAnimationFrame(step)
  }

  return () => {
    cancelAnimationFrame(frame)
    marker.remove()
  }
}

/** Scrolls the notation view just enough to show the whole of a line. */
export function scrollLineIntoView(scroller: HTMLElement, staff: HTMLElement, line: DrawnLine) {
  const top = staff.offsetTop + line.top
  const bottom = staff.offsetTop + line.bottom
  if (top < scroller.scrollTop) scroller.scrollTop = top
  else if (bottom > scroller.scrollTop + scroller.clientHeight) scroller.scrollTop = bottom - scroller.clientHeight
}
