import type { ReactNode } from 'react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useAppStore } from '@/app/store'
import { useResolvedTheme } from '@/app/theme'
import { usePhoneWindow } from '@/app/useMediaQuery'
import { BeatCount, useBeatCount } from './BeatCount'
import { followPlayback, scrollLineIntoView } from './followPlayback'
import type { Drawing, NotationArea } from './staff'
import { drawExercise, notationFontsReady } from './staff'

/**
 * The notation, scrolling in its own area. Given `corner` (the desktop play button), that's pinned
 * at the top left, in a gutter of its own so it never covers bar 1's number, and stays put as the
 * staff scrolls. Given `coveredBottom` (a CSS length: how much of the view the phone's editor sheet
 * covers), the staff gains that much room at its end, so its last lines can scroll up clear of the
 * sheet, and the cursor's line is kept above it; nothing is laid out again. Given `grow` (the
 * desktop, with Appearance's Notation on Fit), a short exercise grows to fill the view, and the staff
 * is centred in it top to bottom. While an exercise plays, the beat count shows in the top-right
 * corner (unless switched off), with the top padding grown to hold it clear of the staff.
 */
export function NotationView({ corner, coveredBottom, grow = false }: { corner?: ReactNode; coveredBottom?: string; grow?: boolean }) {
  const exercise = useAppStore((s) => s.editor.exercise)
  const cursor = useAppStore((s) => s.editor.cursor)
  const dispatch = useAppStore((s) => s.dispatch)
  const loopBar = useAppStore((s) => s.loopBar)
  const playing = useAppStore((s) => s.playing)
  // The notation reads the look's tokens as it draws, so it redraws when the look or mode changes.
  const theme = useResolvedTheme()
  const look = useAppStore((s) => s.device.look)
  const phone = usePhoneWindow()
  const beatCountOn = useAppStore((s) => s.device.beatCount)
  const count = useBeatCount()
  const beatCount = beatCountOn ? count : undefined
  const scrollerRef = useRef<HTMLElement>(null)
  const staffRef = useRef<HTMLDivElement>(null)
  const coverRef = useRef<HTMLDivElement>(null)
  /** The staff's width and the notation view's height inside its padding. */
  const [area, setArea] = useState<NotationArea>({ width: 0, height: 0 })
  const [fontsReady, setFontsReady] = useState(false)
  /** Counts the web fonts loaded, so the notation is measured again in a look's font once it arrives. */
  const [fontsLoaded, setFontsLoaded] = useState(0)
  const drawingRef = useRef<Drawing>(undefined)

  useEffect(() => {
    let live = true
    notationFontsReady.then(() => live && setFontsReady(true))
    const loaded = () => setFontsLoaded((n) => n + 1)
    document.fonts.addEventListener('loadingdone', loaded)
    return () => {
      live = false
      document.fonts.removeEventListener('loadingdone', loaded)
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
    const drawing = (drawingRef.current = drawExercise(staffRef.current!, exercise, playing ? null : cursor, { ...area, grow }))
    // Keep the cursor's line in view as typing runs past the bottom.
    if (!playing) scrollLineIntoView(scrollerRef.current!, staffRef.current!, drawing.line(cursor.bar), coverRef.current?.offsetHeight)
  }, [exercise, cursor, area, grow, fontsReady, fontsLoaded, playing, theme, look])

  useEffect(() => {
    if (playing) return followPlayback(scrollerRef.current!, staffRef.current!, () => drawingRef.current)
  }, [playing])

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <section
        ref={scrollerRef}
        aria-label="Notation view"
        className={`relative min-h-0 flex-1 overflow-auto bg-paper pr-4 pb-2.5 ${beatCount ? (phone ? 'pt-10' : 'pt-14') : 'pt-2.5'} ${corner ? 'pl-14' : 'pl-4'} ${grow ? 'flex flex-col' : ''}`}
      >
        {/* Grown, the staff is centred in what height is left; a staff taller than the view starts at its top. */}
        <div className={`relative ${grow ? 'my-auto' : ''}`}>
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
        {coveredBottom && <div ref={coverRef} aria-hidden style={{ height: coveredBottom }} />}
      </section>
      {corner && <div className="absolute top-2.5 left-2.5 z-10">{corner}</div>}
      {beatCount && <BeatCount count={beatCount} small={phone} />}
    </div>
  )
}
