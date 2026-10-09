import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useAppStore } from '@/app/store'
import { hasHits } from '@/core'
import { followPlayback, scrollLineIntoView } from './followPlayback'
import type { Drawing, NotationArea } from './staff'
import { drawExercise, notationFontsReady } from './staff'

export function NotationView() {
  const exercise = useAppStore((s) => s.editor.exercise)
  const cursor = useAppStore((s) => s.editor.cursor)
  const dispatch = useAppStore((s) => s.dispatch)
  const loopBar = useAppStore((s) => s.loopBar)
  const playing = useAppStore((s) => s.playing)
  const scrollerRef = useRef<HTMLElement>(null)
  const staffRef = useRef<HTMLDivElement>(null)
  /** The staff's width and the notation view's height inside its padding. */
  const [area, setArea] = useState<NotationArea>({ width: 0, height: 0 })
  const [fontsReady, setFontsReady] = useState(false)
  const drawingRef = useRef<Drawing>(undefined)
  /** Where the empty-exercise hint goes: over the first line's staff, once it's drawn. */
  const [hintBox, setHintBox] = useState<Drawing['firstStaff']>()

  useEffect(() => {
    let live = true
    notationFontsReady.then(() => live && setFontsReady(true))
    return () => {
      live = false
    }
  }, [])

  useLayoutEffect(() => {
    const scroller = scrollerRef.current!
    const staff = staffRef.current!
    const measure = () => {
      const width = Math.floor(staff.getBoundingClientRect().width)
      // A pixel short, so rounding never makes a fitted staff scroll.
      const { paddingTop, paddingBottom } = getComputedStyle(scroller)
      const height = Math.floor(scroller.clientHeight - parseFloat(paddingTop) - parseFloat(paddingBottom)) - 1
      setArea((old) => (old.width === width && old.height === height ? old : { width, height }))
    }
    const observer = new ResizeObserver(measure)
    observer.observe(scroller)
    observer.observe(staff)
    return () => observer.disconnect()
  }, [])

  useLayoutEffect(() => {
    if (!fontsReady || area.width === 0) return
    // While playing, the cursor isn't drawn, so only the playhead line marks the music, and the view
    // follows the playback rather than the cursor.
    const drawing = (drawingRef.current = drawExercise(staffRef.current!, exercise, playing ? null : cursor, area))
    const box = drawing.firstStaff
    setHintBox((old) =>
      old && old.left === box.left && old.top === box.top && old.width === box.width && old.height === box.height ? old : box,
    )
    // Keep the cursor's line in view as typing runs past the bottom.
    if (!playing) scrollLineIntoView(scrollerRef.current!, staffRef.current!, drawing.line(cursor.bar))
  }, [exercise, cursor, area, fontsReady, playing])

  useEffect(() => {
    if (playing) return followPlayback(scrollerRef.current!, staffRef.current!, () => drawingRef.current)
  }, [playing])

  return (
    <section
      ref={scrollerRef}
      aria-label="Notation view"
      className="relative min-h-0 flex-1 overflow-auto bg-card px-4 py-2.5"
    >
      <div className="relative">
        {!hasHits(exercise) && hintBox && (
          // Centred over the staff, which it leaves to take the clicks.
          <p style={hintBox} className="pointer-events-none absolute z-10 m-0 flex items-center justify-center text-center">
            <span className="rounded-md bg-card/90 px-3 py-1 text-mute">
              Tap or click a grid position below to add hits.
            </span>
          </p>
        )}
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
      </div>
    </section>
  )
}
