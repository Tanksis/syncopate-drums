import { useCallback, useState } from 'react'
import { useAppStore } from '@/app/store'
import { useCoarsePointer } from '@/app/useMediaQuery'
import { Button } from '@/components/Button'
import { DoneButton } from '@/components/DoneButton'
import { ChevronIcon } from '@/components/icons'
import { slideTransition } from '@/components/useSlide'
import { useSwipe } from '@/components/useSwipe'
import { BarActions } from './BarActions'
import { BarTabs } from './BarTabs'
import { BeatStrip } from './BeatStrip'
import { CheatSheet } from './CheatSheet'
import { useEditorKeys } from './useEditorKeys'

/**
 * The grid editor: the bar tabs, undo, redo and the bar menu over the cursor bar's beat cards. Given
 * `onDone`, it's the phone layout's sheet over the lower part of the screen, its transport and tab
 * bars too, with a header that stays put while the beat cards, two to a row, scroll under it. The
 * header, under a grab handle, gives the bar tabs a row of their own, with undo, redo, the bar menu,
 * the bin, where the cursor is and the tick on a row under them; the tick or a drag down closes the
 * sheet (`onDone`). It is drawn in place while `open`, and below the screen, to slide in and out,
 * while not. Otherwise it's docked under the notation, and its chevron collapses it to its header row.
 */
/** How tall the phone's editor sheet is, from the bottom of the screen. */
export const EDITOR_SHEET_HEIGHT = '55dvh'

/** The phone's editor sheet: see `GridEditor`. It follows a drag down on its header, and closes past a little way or on a flick. */
function EditorSheet({ open, onDone }: { open: boolean; onDone: () => void }) {
  const swipe = useSwipe({ down: onDone })
  return (
    <section
      aria-label="Grid editor"
      className={`absolute inset-x-0 bottom-0 z-20 flex flex-col rounded-t-2xl border-t border-line bg-panel pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_18px_color-mix(in_srgb,var(--color-shade)_8%,transparent)] ${swipe.swiping ? '' : slideTransition}`}
      style={{ height: EDITOR_SHEET_HEIGHT, transform: open ? `translateY(${swipe.offset.y}px)` : 'translateY(100%)' }}
    >
      <div {...swipe.props} className="flex shrink-0 touch-pan-x flex-col px-2 pt-1.5 select-none">
        <span aria-hidden className="mx-auto mb-1.5 h-1 w-10 rounded-full bg-edge/60" />
        <BarTabs large />
        <div className="flex items-center gap-1 pr-1 pb-1">
          <BarActions large />
          <CursorBar />
          <DoneButton label="Done editing" onClick={onDone} />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-3 pb-3">
        <BeatStrip twoPerRow />
      </div>
    </section>
  )
}

export function GridEditor({ onDone, open = true }: { onDone?: () => void; open?: boolean }) {
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
  if (onDone) return <EditorSheet open={open} onDone={onDone} />
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

/** Which bar the cursor is in, of how many: "Bar 3 of 12". */
function CursorBar() {
  const bar = useAppStore((s) => s.editor.cursor.bar)
  const bars = useAppStore((s) => s.editor.exercise.bars.length)
  return (
    <span className="flex-1 text-center text-sm text-mute tabular-nums">
      Bar {bar + 1} of {bars}
    </span>
  )
}

/** Whether the docked editor is collapsed, the device setting, and its toggle. */
function useEditorCollapsed(): [boolean, () => void] {
  const collapsed = useAppStore((s) => s.device.editorCollapsed)
  const setDeviceSettings = useAppStore((s) => s.setDeviceSettings)
  return [collapsed, () => setDeviceSettings({ editorCollapsed: !collapsed })]
}
