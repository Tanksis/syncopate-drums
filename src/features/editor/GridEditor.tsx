import { useCallback, useMemo, useRef, useState } from 'react'
import { useAppStore } from '@/app/store'
import { useCoarsePointer } from '@/app/useMediaQuery'
import { Button } from '@/components/Button'
import { DoneButton } from '@/components/DoneButton'
import { ChevronIcon } from '@/components/icons'
import { usePullDown } from '@/components/usePullDown'
import { slideTransition } from '@/components/useSlide'
import { useSwipe } from '@/components/useSwipe'
import { BarActions } from './BarActions'
import { BarPicker, BarTabs } from './BarTabs'
import { BeatStrip } from './BeatStrip'
import { CheatSheet } from './CheatSheet'
import { useEditorKeys } from './useEditorKeys'

/**
 * The grid editor: the bar tabs, undo, redo and the bar menu over the cursor bar's beat cards. Given
 * `onDone`, it's the phone layout's sheet over the lower part of the screen, its transport and tab
 * bars too, with a header that stays put while the beat cards, two to a row, scroll under it (on
 * most phones they fit). The header, under a grab handle, is one row: ‹ "Bar 3 of 12 ▾" › (a list of
 * the bars), undo, redo, the bar menu and the tick; the tick or a drag down closes the sheet (`onDone`). It is drawn in place while `open`, and below the screen, to slide in and out,
 * while not. Otherwise it's docked under the notation, and its chevron collapses it to its header row.
 */
/** How tall the phone's editor sheet is, from the bottom of the screen. */
export const EDITOR_SHEET_HEIGHT = '62dvh'

/**
 * The phone's editor sheet: see `GridEditor`. Fixed to the screen's foot, as the full-screen panels
 * are. It follows a drag down on its header, or on the beat cards while they're scrolled to the top,
 * and closes past a little way or on a flick. While closed, `pull` (px, up is negative) is a finger
 * pulling it up from below.
 */
function EditorSheet({ open, pull, onDone }: { open: boolean; pull: number; onDone: () => void }) {
  const swipe = useSwipe({ down: onDone })
  const cards = useRef<HTMLDivElement>(null)
  const cardsPull = usePullDown(cards, onDone)
  const drag = swipe.offset.y || cardsPull
  // Made once, so following a finger moves the sheet without drawing its contents again.
  const header = useMemo(
    () => (
      <>
        <span aria-hidden className="mx-auto mb-1.5 h-1 w-10 rounded-full bg-edge/60" />
        <div className="flex items-center gap-1 pb-0.5">
          <BarPicker />
          <BarActions large />
          <DoneButton quiet label="Done editing" onClick={onDone} />
        </div>
      </>
    ),
    [onDone],
  )
  const strip = useMemo(() => <BeatStrip twoPerRow />, [])
  const transform = open ? `translateY(${drag}px)` : `translateY(max(0px, calc(100% + ${Math.min(0, pull)}px)))`
  return (
    <section
      aria-label="Grid editor"
      aria-hidden={!open || undefined}
      className={`fixed inset-x-0 bottom-0 z-20 flex flex-col rounded-t-2xl border-t border-line bg-panel shadow-[0_-6px_18px_color-mix(in_srgb,var(--color-shade)_8%,transparent)] ${drag || pull ? '' : slideTransition}`}
      style={{ height: EDITOR_SHEET_HEIGHT, transform }}
    >
      <div {...swipe.props} className="flex shrink-0 touch-pan-x flex-col px-2 pt-1.5 select-none">
        {header}
      </div>
      {/* The beat cards scroll to the sheet's foot. Most of the home indicator's room is left out, so
          they fit without scrolling: on the iPhone in Chrome the browser's bar sits under the sheet anyway. */}
      <div ref={cards} className="min-h-0 flex-1 overflow-auto overscroll-contain px-3 pt-1 pb-[max(0.75rem,calc(env(safe-area-inset-bottom)-1.375rem))]">
        {strip}
      </div>
    </section>
  )
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
