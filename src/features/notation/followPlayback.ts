// Following the playback in the notation: a rAF loop outside React that shades the bar the
// drummer is hearing, draws the playhead line on its latest hit and keeps its line of music in view.
// Both are drawn over the staff, never laid out, so nothing moves when Play starts or stops.

import { playhead } from '@/features/playback/engine'
import type { Drawing, DrawnLine } from './staff'

const SVG_NS = 'http://www.w3.org/2000/svg'

/**
 * The playhead line's width in the drawing's units, so it scales with the notation: heavy enough to
 * find from the drum stool.
 */
const PLAYHEAD_WIDTH = 3

/**
 * Follows playback until the returned stop function is called: the playing bar is shaded in the
 * playhead's colour, behind the music, and the playhead line drawn over it. It reads the current
 * drawing on every frame, so a redraw while playing (an edit, a resize) is picked up at once.
 */
export function followPlayback(scroller: HTMLElement, staff: HTMLElement, drawing: () => Drawing | undefined) {
  const marker = document.createElementNS(SVG_NS, 'line')
  marker.classList.add('stroke-play', 'pointer-events-none')
  marker.setAttribute('stroke-width', String(PLAYHEAD_WIDTH))
  marker.setAttribute('stroke-linecap', 'round')
  const shade = document.createElementNS(SVG_NS, 'rect')
  shade.classList.add('fill-play/12', 'pointer-events-none')
  let shown: { drawing: Drawing; top: number } | undefined
  let frame = requestAnimationFrame(step)

  function step() {
    const head = playhead()
    const current = drawing()
    // The bar being heard, from its downbeat (none during the count-in), shaded behind everything drawn.
    const box = head && head.position.bar >= 0 ? current?.barBox(head.position.bar) : undefined
    if (box && current?.svg) {
      if (shade.parentNode !== current.svg) current.svg.prepend(shade)
      shade.setAttribute('x', String(box.x))
      shade.setAttribute('y', String(box.y))
      shade.setAttribute('width', String(box.width))
      shade.setAttribute('height', String(box.height))
    } else shade.remove()
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
    shade.remove()
  }
}

/** Scrolls the notation view just enough to show the whole of a line, above `covered` px at its foot. */
export function scrollLineIntoView(scroller: HTMLElement, staff: HTMLElement, line: DrawnLine, covered = 0) {
  const offset = staff.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop
  const top = offset + line.top
  const bottom = offset + line.bottom
  if (top < scroller.scrollTop) scroller.scrollTop = top
  else if (bottom > scroller.scrollTop + scroller.clientHeight - covered) scroller.scrollTop = bottom - scroller.clientHeight + covered
}
