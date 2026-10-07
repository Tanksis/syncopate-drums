// Following the playback in the notation: a rAF loop outside React that lights the note the
// drummer is hearing and keeps its line in view.

import { playhead } from '@/features/playback/engine'
import type { Drawing, DrawnLine } from './staff'

/** Overrides the note's own colours, including the cursor beat's, while it sounds. */
const SOUNDING = ['[&_*]:fill-play', '[&_*]:stroke-play']

/**
 * Follows playback until the returned stop function is called. It reads the current drawing on
 * every frame, so a redraw while playing (an edit, a resize) is picked up at once.
 */
export function followPlayback(scroller: HTMLElement, staff: HTMLElement, drawing: () => Drawing | undefined) {
  let lit: SVGElement | undefined
  let shown: { drawing: Drawing; top: number } | undefined
  let frame = requestAnimationFrame(step)

  function step() {
    const head = playhead()
    const current = drawing()
    const note = head?.noteId === undefined ? undefined : current?.noteElements.get(head.noteId)
    if (note !== lit) {
      lit?.classList.remove(...SOUNDING)
      note?.classList.add(...SOUNDING)
      lit = note
    }
    // Scroll only when the playhead reaches a new line, so the drummer can still scroll by hand,
    // or after a redraw, which scrolls to the cursor's line instead.
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
    lit?.classList.remove(...SOUNDING)
  }
}

/** Scrolls the notation view just enough to show the whole of a line. */
export function scrollLineIntoView(scroller: HTMLElement, staff: HTMLElement, line: DrawnLine) {
  const top = staff.offsetTop + line.top
  const bottom = staff.offsetTop + line.bottom
  if (top < scroller.scrollTop) scroller.scrollTop = top
  else if (bottom > scroller.scrollTop + scroller.clientHeight) scroller.scrollTop = bottom - scroller.clientHeight
}
