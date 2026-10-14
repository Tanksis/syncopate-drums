import { useCallback, useState } from 'react'
import { useCoarsePointer } from '@/app/useMediaQuery'
import { Button } from '@/components/Button'
import { BarActions } from './BarActions'
import { BarTabs } from './BarTabs'
import { BeatStrip } from './BeatStrip'
import { CheatSheet } from './CheatSheet'
import { useEditorKeys } from './useEditorKeys'

/**
 * The grid editor: the bar tabs, undo, redo and the bar menu over the cursor bar's beat cards. Given
 * `onDone`, it's the phone layout's sheet: the lower part of the screen, with Done in its header,
 * which stays put while the beat cards, two to a row, scroll under it.
 */
export function GridEditor({ onDone }: { onDone?: () => void }) {
  const [helpOpen, setHelpOpen] = useState(false)
  const toggleHelp = useCallback(() => setHelpOpen((open) => !open), [])
  useEditorKeys(toggleHelp)
  // A touch screen shows no keyboard hints.
  const touch = useCoarsePointer()
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
      className="flex max-h-[52dvh] min-h-[30dvh] flex-col gap-3 overflow-auto border-t border-line bg-panel px-4 py-2"
    >
      <div className="flex flex-wrap items-center gap-3">
        <BarTabs />
        <BarActions />
        {!touch && (
          <Button aria-pressed={helpOpen} title="Keys (?)" onClick={toggleHelp} className="ml-auto text-xs aria-pressed:border-accent aria-pressed:text-accent">
            ? keys
          </Button>
        )}
      </div>
      {helpOpen && !touch && <CheatSheet onClose={toggleHelp} />}
      <BeatStrip />
    </section>
  )
}
