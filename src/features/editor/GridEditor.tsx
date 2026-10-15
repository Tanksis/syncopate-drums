import { useCallback, useState } from 'react'
import { useAppStore } from '@/app/store'
import { useCoarsePointer } from '@/app/useMediaQuery'
import { Button } from '@/components/Button'
import { ChevronIcon } from '@/components/icons'
import { BarActions } from './BarActions'
import { BarTabs } from './BarTabs'
import { BeatStrip } from './BeatStrip'
import { CheatSheet } from './CheatSheet'
import { useEditorKeys } from './useEditorKeys'

/**
 * The grid editor: the bar tabs, undo, redo and the bar menu over the cursor bar's beat cards. Given
 * `onDone`, it's the phone layout's sheet: the lower part of the screen, with Done in its header,
 * which stays put while the beat cards, two to a row, scroll under it. Otherwise it's docked under the
 * notation, and its chevron collapses it to its header row.
 */
export function GridEditor({ onDone }: { onDone?: () => void }) {
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
  if (onDone)
    return (
      <section
        aria-label="Grid editor"
        className="flex h-[55dvh] shrink-0 flex-col rounded-t-2xl border-t border-line bg-panel shadow-[0_-6px_18px_color-mix(in_srgb,var(--color-shade)_8%,transparent)]"
      >
        <div className="flex shrink-0 items-center gap-2 px-3 py-2">
          <BarTabs large />
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <BarActions large />
            <Button variant="primary" size="lg" onClick={onDone} className="ml-1">
              Done
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-3 pb-3">
          <BeatStrip twoPerRow />
        </div>
      </section>
    )
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
