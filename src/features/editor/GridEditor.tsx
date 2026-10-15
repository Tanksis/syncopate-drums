import type { PointerEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '@/app/store'
import { useCoarsePointer } from '@/app/useMediaQuery'
import { Button } from '@/components/Button'
import { DoneButton } from '@/components/DoneButton'
import { ChevronIcon } from '@/components/icons'
import { keepFocus } from '@/components/keepFocus'
import { usePullDown } from '@/components/usePullDown'
import { SLIDE_MS, slideTransition } from '@/components/useSlide'
import { useSwipe } from '@/components/useSwipe'
import { BarActions } from './BarActions'
import { BarDots, BarTabs } from './BarTabs'
import { BeatStrip } from './BeatStrip'
import { CheatSheet } from './CheatSheet'
import { useEditorKeys } from './useEditorKeys'

/**
 * The grid editor: the bar tabs, undo, redo and the bar menu over the cursor bar's beat cards. Given
 * `onDone`, it's the phone layout's sheet over the lower part of the screen, its transport and tab
 * bars too: a grab handle, the beat cards two to a row (on most phones they fit; else they scroll),
 * and a row at its foot, in the thumb's reach, of undo, redo, the bar dots and +, the bin, the bar
 * menu and the tick. The cards swipe sideways between bars, like pages; the tick, or a drag down on
 * the handle or the cards, closes the sheet (`onDone`). It is drawn in place while `open`, and below
 * the screen, to slide in and out, while not. Otherwise it's docked under the notation, and its
 * chevron collapses it to its header row.
 */
/** How tall the phone's editor sheet is, from the bottom of the screen. */
export const EDITOR_SHEET_HEIGHT = '62dvh'

/** The gap, in px, between a bar's cards and the next bar's, and how much of the next bar peeks in. */
const PAGE_GAP = 10
const PEEK = 16

/**
 * The phone's editor sheet: see `GridEditor`. Fixed to the screen's foot, as the full-screen panels
 * are. It follows a drag down on its handle, or on the beat cards while they're scrolled to the top,
 * and closes past a little way or on a flick. While closed, `pull` (px, up is negative) is a finger
 * pulling it up from below.
 */
function EditorSheet({ open, pull, onDone }: { open: boolean; pull: number; onDone: () => void }) {
  const swipe = useSwipe({ down: onDone })
  const cards = useRef<HTMLDivElement>(null)
  const cardsPull = usePullDown(cards, onDone)
  const drag = swipe.offset.y || cardsPull
  const pages = useBarPages()
  // Made once, so following a finger moves the sheet without drawing its contents again.
  const strip = useMemo(() => <BeatStrip twoPerRow />, [])
  const row = useMemo(
    () => (
      // Most of the home indicator's room is left out, so the cards fit: on the iPhone in Chrome the browser's bar sits under the sheet anyway.
      <div className="flex shrink-0 items-center border-t border-line px-2 pt-0.5 pb-[max(0.25rem,calc(env(safe-area-inset-bottom)-1.375rem))]">
        <BarActions large dots={<BarDots />} />
        <DoneButton quiet label="Done editing" onClick={onDone} />
      </div>
    ),
    [onDone],
  )
  const transform = open ? `translateY(${drag}px)` : `translateY(max(0px, calc(100% + ${Math.min(0, pull)}px)))`
  return (
    <section
      aria-label="Grid editor"
      aria-hidden={!open || undefined}
      className={`fixed inset-x-0 bottom-0 z-20 flex flex-col rounded-t-2xl border-t border-line bg-panel shadow-[0_-6px_18px_color-mix(in_srgb,var(--color-shade)_8%,transparent)] ${drag || pull ? '' : slideTransition}`}
      style={{ height: EDITOR_SHEET_HEIGHT, transform }}
    >
      <div {...swipe.props} className="flex h-[18px] shrink-0 touch-pan-x items-center justify-center select-none">
        <span aria-hidden className="h-1 w-10 rounded-full bg-edge/60" />
      </div>
      {/* The beat cards, with the next bar's edge peeking in at the right. A sideways swipe that
          starts anywhere but on a cell (where a press is a hit or a hold) turns the page. */}
      <div ref={cards} {...pages.props} className="min-h-0 flex-1 touch-pan-y overflow-x-hidden overflow-y-auto overscroll-contain pb-2 pl-3">
        <div
          ref={pages.track}
          className={`relative ${pages.moving ? '' : slideTransition}`}
          style={{ width: `calc(100% - ${PAGE_GAP + PEEK}px)`, transform: `translateX(${pages.offset}px)` }}
        >
          {pages.previous && <PageEdge side="left" />}
          {strip}
          {pages.next && <PageEdge side="right" onClick={pages.goNext} />}
        </div>
      </div>
      {row}
    </section>
  )
}

/**
 * The next or previous bar's cards, drawn as outlines beside the cursor bar's: the next one peeks
 * in, and a tap on it goes to that bar; the previous one shows only while a swipe pulls it in.
 */
function PageEdge({ side, onClick }: { side: 'left' | 'right'; onClick?: () => void }) {
  const place = side === 'left' ? { right: `calc(100% + ${PAGE_GAP}px)` } : { left: `calc(100% + ${PAGE_GAP}px)` }
  const outlines = (
    <span aria-hidden className="grid h-full grid-cols-2 grid-rows-2 gap-2">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="rounded-xl border border-line bg-card" />
      ))}
    </span>
  )
  if (!onClick) {
    return (
      <span aria-hidden className="absolute inset-y-0 w-full" style={place}>
        {outlines}
      </span>
    )
  }
  return (
    <button type="button" aria-label="Next bar" tabIndex={-1} onMouseDown={keepFocus} onClick={onClick} className="absolute inset-y-0 w-full cursor-pointer" style={place}>
      {outlines}
    </button>
  )
}

/**
 * The phone's beat cards as pages, a bar to each: a swipe left goes to the next bar and right to the
 * one before, the cards following the finger (giving only a little past the first and last bars),
 * and the new bar's cards slide in from where the swipe let go. A swipe that starts on a cell is
 * the cell's, a hit or a hold. `track` is what moves, and `offset` (px) where to draw it.
 */
function useBarPages() {
  const barCount = useAppStore((s) => s.editor.exercise.bars.length)
  const current = useAppStore((s) => s.editor.cursor.bar)
  const dispatch = useAppStore((s) => s.dispatch)
  const track = useRef<HTMLDivElement>(null)
  // Where the new bar's cards are first drawn, before they slide to rest; null once they're sliding.
  const [entering, setEntering] = useState<number | null>(null)
  const [settling, setSettling] = useState(false)
  const lastOffset = useRef(0)
  const previous = current > 0
  const next = current < barCount - 1
  const turn = (by: 1 | -1) => {
    if (!(by === 1 ? next : previous)) return
    const stride = (track.current?.offsetWidth ?? 0) + PAGE_GAP
    dispatch({ type: 'moveTo', bar: current + by, beat: 0 })
    setEntering(lastOffset.current + by * stride)
  }
  const swipe = useSwipe({ left: () => turn(1), right: () => turn(-1) })
  useEffect(() => {
    if (entering === null) return
    // A frame drawn where the swipe let go, then the slide to rest.
    const frame = requestAnimationFrame(() => {
      setEntering(null)
      setSettling(true)
    })
    return () => cancelAnimationFrame(frame)
  }, [entering])
  useEffect(() => {
    if (!settling) return
    const timer = window.setTimeout(() => setSettling(false), SLIDE_MS)
    return () => window.clearTimeout(timer)
  }, [settling])
  const dx = swipe.offset.x
  const held = (dx > 0 && !previous) || (dx < 0 && !next) ? dx / 4 : dx
  lastOffset.current = held
  const props = {
    ...swipe.props,
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      if (e.target instanceof Element && e.target.closest('[data-position]')) return
      swipe.props.onPointerDown(e)
    },
  }
  return {
    props,
    track,
    offset: entering ?? held,
    moving: entering !== null || swipe.swiping,
    previous: previous && (swipe.swiping || entering !== null || settling),
    next,
    goNext: () => turn(1),
  }
}

export function GridEditor({ onDone, open = true, pull = 0 }: { onDone?: () => void; open?: boolean; pull?: number }) {
  const [collapsed, toggleCollapsed] = useEditorCollapsed()
  const [helpOpen, setHelpOpen] = useState(false)
  // A collapsed editor has no room for the cheat sheet, so ? leaves it be.
  const helpHidden = collapsed && !onDone
  const toggleHelp = useCallback(() => {
    if (!helpHidden) setHelpOpen((open) => !open)
  }, [helpHidden])
  useEditorKeys(toggleHelp)
  // A touch screen shows no keyboard hints.
  const touch = useCoarsePointer()
  const chevronLabel = collapsed ? 'Expand the editor' : 'Collapse the editor'
  if (onDone) return <EditorSheet open={open} pull={pull} onDone={onDone} />
  return (
    <section
      aria-label="Grid editor"
      className={`flex flex-col gap-3 border-t border-line bg-panel px-4 py-2 ${collapsed ? 'shrink-0' : 'max-h-[52dvh] min-h-[30dvh] overflow-auto'}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <BarTabs />
        <BarActions />
        <div className="ml-auto flex items-center gap-2">
          {!touch && !collapsed && (
            <Button aria-pressed={helpOpen} title="Keys (?)" onClick={toggleHelp} className="text-xs aria-pressed:border-accent aria-pressed:text-accent">
              ? keys
            </Button>
          )}
          <Button
            variant="ghost"
            size="md"
            icon
            aria-label={chevronLabel}
            title={chevronLabel}
            aria-expanded={!collapsed}
            onClick={toggleCollapsed}
            // An open editor is the usual state, so the chevron stays quiet rather than looking pressed.
            className="aria-expanded:not-hover:bg-transparent! aria-expanded:not-hover:text-mute!"
          >
            <span className={`flex transition-transform ${collapsed ? 'rotate-180' : ''}`}>
              <ChevronIcon />
            </span>
          </Button>
        </div>
      </div>
      {!collapsed && (
        <>
          {helpOpen && !touch && <CheatSheet onClose={toggleHelp} />}
          <BeatStrip />
        </>
      )}
    </section>
  )
}

/** Whether the docked editor is collapsed, the device setting, and its toggle. */
function useEditorCollapsed(): [boolean, () => void] {
  const collapsed = useAppStore((s) => s.device.editorCollapsed)
  const setDeviceSettings = useAppStore((s) => s.setDeviceSettings)
  return [collapsed, () => setDeviceSettings({ editorCollapsed: !collapsed })]
}
