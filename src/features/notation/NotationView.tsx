import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useAppStore } from '@/app/store'
import { followPlayback, scrollLineIntoView } from './followPlayback'
import type { Drawing } from './staff'
import { drawExercise, notationFontsReady } from './staff'

export function NotationView() {
  const exercise = useAppStore((s) => s.editor.exercise)
  const cursor = useAppStore((s) => s.editor.cursor)
  const dispatch = useAppStore((s) => s.dispatch)
  const loopBar = useAppStore((s) => s.loopBar)
  const playing = useAppStore((s) => s.playing)
  const scrollerRef = useRef<HTMLElement>(null)
  const staffRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [fontsReady, setFontsReady] = useState(false)
  const drawingRef = useRef<Drawing>(undefined)

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
    // While playing, the cursor isn't drawn, so only the playhead line marks the music, and the view
    // follows the playback rather than the cursor.
    const drawing = (drawingRef.current = drawExercise(staffRef.current!, exercise, playing ? null : cursor, width))
    // Keep the cursor's line in view as typing runs past the bottom.
    if (!playing) scrollLineIntoView(scrollerRef.current!, staffRef.current!, drawing.line(cursor.bar))
  }, [exercise, cursor, width, fontsReady, playing])

  useEffect(() => {
    if (playing) return followPlayback(scrollerRef.current!, staffRef.current!, () => drawingRef.current)
  }, [playing])

  return (
    <section
      ref={scrollerRef}
      aria-label="Notation view"
      className="relative min-h-0 flex-1 overflow-auto bg-card px-4 py-2.5"
    >
      <div
        ref={staffRef}
        // Shift+click on a bar number would otherwise select text.
        className="select-none"
        onClick={(e) => {
          // A click on a bar number loops that bar (Shift extends the loop), on a hand flips its
          // sticking, and on a note moves the cursor to its beat.
          const barNumber = (e.target as Element).closest<SVGElement>('[data-loop-bar]')
          if (barNumber) return loopBar(Number(barNumber.dataset.loopBar), { extend: e.shiftKey })
          const handGroup = (e.target as Element).closest<SVGElement>('[data-note-id]')
          if (handGroup) return dispatch({ type: 'flipOverride', note: { id: handGroup.dataset.noteId! } })
          const note = (e.target as Element).closest<SVGElement>('[data-bar]')
          if (note) dispatch({ type: 'moveTo', bar: Number(note.dataset.bar), beat: Number(note.dataset.beat) })
        }}
      />
    </section>
  )
}
