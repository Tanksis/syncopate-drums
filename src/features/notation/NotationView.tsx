import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useAppStore } from '@/app/store'
import { drawExercise, notationFontsReady } from './staff'

export function NotationView() {
  const exercise = useAppStore((s) => s.editor.exercise)
  const cursor = useAppStore((s) => s.editor.cursor)
  const dispatch = useAppStore((s) => s.dispatch)
  const scrollerRef = useRef<HTMLElement>(null)
  const staffRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [fontsReady, setFontsReady] = useState(false)

  useEffect(() => {
    let live = true
    notationFontsReady.then(() => live && setFontsReady(true))
    return () => {
      live = false
    }
  }, [])

  useLayoutEffect(() => {
    const staff = staffRef.current!
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)))
    observer.observe(staff)
    return () => observer.disconnect()
  }, [])

  useLayoutEffect(() => {
    if (!fontsReady || width === 0) return
    const line = drawExercise(staffRef.current!, exercise, cursor, width)
    // Keep the cursor's line in view as typing runs past the bottom.
    const scroller = scrollerRef.current!
    const top = staffRef.current!.offsetTop + line.top
    const bottom = staffRef.current!.offsetTop + line.bottom
    if (top < scroller.scrollTop) scroller.scrollTop = top
    else if (bottom > scroller.scrollTop + scroller.clientHeight) scroller.scrollTop = bottom - scroller.clientHeight
  }, [exercise, cursor, width, fontsReady])

  return (
    <section
      ref={scrollerRef}
      aria-label="Notation view"
      className="relative min-h-0 flex-1 overflow-auto bg-card px-4 py-2.5"
    >
      <div
        ref={staffRef}
        onClick={(e) => {
          // A click on a note moves the cursor to its beat.
          const note = (e.target as Element).closest<SVGElement>('[data-bar]')
          if (note) dispatch({ type: 'moveTo', bar: Number(note.dataset.bar), beat: Number(note.dataset.beat) })
        }}
      />
    </section>
  )
}
