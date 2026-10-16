import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '@/app/store'
import type { PhoneOrientation } from '@/app/useMediaQuery'
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
import { EditorHint } from '@/features/library/NewUserPolishPrototype'
import { CheatSheet } from './CheatSheet'
import { useEditorKeys } from './useEditorKeys'

/**
 * The grid editor: the bar tabs, undo, redo and the bar menu over the cursor bar's beat cards. Given
 * `onDone`, it's the phone layout's sheet over the lower part of the screen, its transport and tab
 * bars too: a grab handle, the beat cards two to a row (on most phones they fit; else they scroll),
 * or all four in a row with the phone turned sideways (`orientation`), with a small ‹ and › either side, and a row at its foot, in the thumb's reach, of undo, redo, the
 * bar dots and +, the bin, the bar menu and the tick. Going to another bar slides its cards in; the
 * tick, or a drag down on the handle or the cards, closes the sheet (`onDone`). It is drawn in place
 * while `open`, and below the screen, to slide in and out, while not. Otherwise it's docked under
 * the notation, and its chevron collapses it to its header row.
 */
/**
 * How tall the phone's editor sheet is, from the bottom of the screen. Turned sideways the screen is
 * short, so the sheet takes more of it, leaving a strip of the notation over it.
 */
export const EDITOR_SHEET_HEIGHT: Record<PhoneOrientation, string> = { portrait: '62dvh', landscape: '76dvh' }

/** The gap, in px, between one bar's cards and the next's as they slide past each other. */
const SLIDE_GAP = 32

/**
 * The phone's editor sheet: see `GridEditor`. Fixed to the screen's foot, as the full-screen panels
 * are. It follows a drag down on its handle, or on the beat cards while they're scrolled to the top,
 * and closes past a little way or on a flick. While closed, `pull` (px, up is negative) is a finger
 * pulling it up from below.
 */
function EditorSheet({
  orientation,
  open,
  pull,
  onDone,
}: {
  orientation: PhoneOrientation
  open: boolean
  pull: number
  onDone: () => void
}) {
  const swipe = useSwipe({ down: onDone })
  const cards = useRef<HTMLDivElement>(null)
  const cardsPull = usePullDown(cards, onDone)
  const drag = swipe.offset.y || cardsPull
  const slide = useBarSlide()
  // Made once, so following a finger moves the sheet without drawing its contents again.
  const strip = useMemo(() => <BeatStrip phone={orientation} />, [orientation])
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
      // Sideways, it covers the screen beside the rail (48 px), not the rail, and keeps clear of a notch on the right.
      className={`fixed right-0 bottom-0 z-20 flex flex-col rounded-t-2xl ${
        orientation === 'landscape' ? 'left-[calc(3rem+env(safe-area-inset-left))] pr-[env(safe-area-inset-right)]' : 'left-0'
      } border-t border-line bg-panel shadow-[0_-6px_18px_color-mix(in_srgb,var(--color-shade)_8%,transparent)] ${drag || pull ? '' : slideTransition}`}
      style={{ height: EDITOR_SHEET_HEIGHT[orientation], transform }}
    >
      <div {...swipe.props} className="flex h-[18px] shrink-0 touch-pan-x items-center justify-center select-none">
        <span aria-hidden className="h-1 w-10 rounded-full bg-edge/60" />
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col">
        {/* The beat cards, centred between the ‹ and ›. While going to another bar, the bar left
            behind is drawn beside them, and the two slide across together. */}
        <div ref={cards} className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-6 pb-2">
          <div
            className={`flex items-start ${slide && slide.running ? slideTransition : ''} ${slide?.forward ? 'flex-row-reverse' : ''}`}
            style={{ gap: SLIDE_GAP, transform: slide ? `translateX(${slide.offset})` : undefined }}
          >
            <div className="w-full shrink-0">{strip}</div>
            {slide && (
              <div aria-hidden className="pointer-events-none w-full shrink-0">
                <BeatStrip phone={orientation} bar={slide.from} />
              </div>
            )}
          </div>
        </div>
        <BarStep side="left" />
        <BarStep side="right" />
      </div>
      {row}
    </section>
  )
}

/** The phone's small ‹ or ›, beside the beat cards, which goes to the bar before or after. */
function BarStep({ side }: { side: 'left' | 'right' }) {
  const barCount = useAppStore((s) => s.editor.exercise.bars.length)
  const current = useAppStore((s) => s.editor.cursor.bar)
  const dispatch = useAppStore((s) => s.dispatch)
  const to = side === 'left' ? current - 1 : current + 1
  const label = side === 'left' ? 'Previous bar' : 'Next bar'
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={to < 0 || to >= barCount}
      tabIndex={-1}
      onMouseDown={keepFocus}
      onClick={() => dispatch({ type: 'moveTo', bar: to, beat: 0 })}
      className={`absolute top-1/2 flex h-14 w-6 -translate-y-1/2 cursor-pointer touch-manipulation items-center justify-center text-xl/none text-mute hover:text-accent disabled:cursor-default disabled:opacity-25 disabled:hover:text-mute ${
        side === 'left' ? 'left-0' : 'right-0'
      }`}
    >
      <span aria-hidden>{side === 'left' ? '‹' : '›'}</span>
    </button>
  )
}

/**
 * When the cursor goes to another bar (by the ‹ ›, a dot or the + on the phone), the bar it left
 * slides out and the new one in, from the side they lie on, `SLIDE_GAP` apart. `from` is the bar
 * left behind, `forward` whether it lies before the new one, and `offset` where to draw the pair:
 * first with the old bar in view, then, `running`, sliding to the new one.
 */
function useBarSlide() {
  const current = useAppStore((s) => s.editor.cursor.bar)
  const barCount = useAppStore((s) => s.editor.exercise.bars.length)
  const exerciseId = useAppStore((s) => s.editor.exercise.id)
  const [slide, setSlide] = useState<{ from: number; forward: boolean; running: boolean } | null>(null)
  const last = useRef({ bar: current, exerciseId })
  // Before the screen is drawn, so the new bar never shows in place before it slides in.
  useLayoutEffect(() => {
    const was = last.current
    last.current = { bar: current, exerciseId }
    // Only a move between two bars that are both still there: not a bar deleted, nor another exercise.
    if (was.bar === current || was.exerciseId !== exerciseId || was.bar >= barCount) return
    setSlide({ from: was.bar, forward: was.bar < current, running: false })
  }, [current, exerciseId, barCount])
  const started = slide !== null && !slide.running
  useEffect(() => {
    if (!started) return
    // Two frames: one drawing the old bar in place, then the slide.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setSlide((s) => s && { ...s, running: true }))
    })
    return () => cancelAnimationFrame(frame)
  }, [started])
  const running = slide?.running ?? false
  useEffect(() => {
    if (!running) return
    const timer = window.setTimeout(() => setSlide(null), SLIDE_MS)
    return () => window.clearTimeout(timer)
  }, [running])
  if (!slide) return null
  // The new bar is laid out in view, the old one beside it on its side (before it, going forward: reversed),
  // so the pair starts a bar and the gap over, showing the old one, and slides to rest.
  const over = slide.forward ? `calc(100% + ${SLIDE_GAP}px)` : `calc(-100% - ${SLIDE_GAP}px)`
  return { ...slide, offset: slide.running ? '0px' : over }
}

export function GridEditor({
  onDone,
  orientation = 'portrait',
  open = true,
  pull = 0,
  grow = false,
}: {
  grow?: boolean
  onDone?: () => void
  orientation?: PhoneOrientation
  open?: boolean
  pull?: number
}) {
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
  if (onDone) return <EditorSheet orientation={orientation} open={open} pull={pull} onDone={onDone} />
  return (
    <section
      aria-label="Grid editor"
      className={`flex flex-col gap-3 border-t border-line bg-panel px-4 py-2 ${collapsed ? 'shrink-0' : grow ? 'min-h-[30dvh] flex-1 overflow-auto' : 'max-h-[52dvh] min-h-[30dvh] overflow-auto'}`}
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
          <EditorHint />
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
