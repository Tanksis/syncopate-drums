import { useEffect, useState } from 'react'

/** How long a panel takes to slide in or out, in ms; its `transition` uses the same. */
export const SLIDE_MS = 220

/** The transition a sliding panel takes while no finger holds it. */
export const slideTransition = 'transition-transform duration-[220ms] ease-out motion-reduce:transition-none'

/**
 * A panel that slides onto the screen and off it, such as a sheet or a full-screen sidebar. It
 * stays `present` (in the DOM) while it slides out, and `atOpen` says where to draw it: in place,
 * or off the screen. It first draws off the screen, so opening slides it in.
 *
 * `dragging` is true while a finger is pulling it in from off the screen (a swipe on the screen
 * under it): it is present from the start of that drag, and slides back if the drag lets go
 * without opening it.
 */
export function useSlide(open: boolean, dragging = false) {
  const [present, setPresent] = useState(open || dragging)
  // Whether it has been drawn once off the screen, so moving it in place now slides.
  const [placed, setPlaced] = useState(false)
  if ((open || dragging) && !present) setPresent(true)

  useEffect(() => {
    if (!present || placed) return
    // Two frames: one to draw it off the screen, then the move.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setPlaced(true))
    })
    return () => cancelAnimationFrame(frame)
  }, [present, placed])

  useEffect(() => {
    if (open || dragging || !present) return
    const timer = window.setTimeout(() => {
      setPresent(false)
      setPlaced(false)
    }, SLIDE_MS)
    return () => window.clearTimeout(timer)
  }, [open, dragging, present])

  return { present, atOpen: open && placed }
}
