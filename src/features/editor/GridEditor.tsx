import { useCallback, useState } from 'react'
import { useCoarsePointer } from '@/app/useMediaQuery'
import { keepFocus } from '@/components/keepFocus'
import { BarActions } from './BarActions'
import { BarTabs } from './BarTabs'
import { BeatStrip } from './BeatStrip'
import { CheatSheet } from './CheatSheet'
import { useEditorKeys } from './useEditorKeys'

export function GridEditor() {
  const [helpOpen, setHelpOpen] = useState(false)
  const toggleHelp = useCallback(() => setHelpOpen((open) => !open), [])
  useEditorKeys(toggleHelp)
  // A touch screen shows no keyboard hints.
  const touch = useCoarsePointer()
  return (
    <section
      aria-label="Grid editor"
      className="flex max-h-[52dvh] min-h-[30dvh] flex-col gap-3 overflow-auto border-t border-line bg-panel px-4 py-2"
    >
      <div className="flex flex-wrap items-center gap-3">
        <BarTabs />
        <BarActions />
        {!touch && (
          <button
            type="button"
            aria-pressed={helpOpen}
            title="Keys (?)"
            onMouseDown={keepFocus}
            onClick={toggleHelp}
            className="ml-auto cursor-pointer rounded-md border border-line bg-card px-2 py-0.5 text-xs text-mute hover:text-accent aria-pressed:border-accent aria-pressed:text-accent"
          >
            ? keys
          </button>
        )}
      </div>
      {helpOpen && !touch && <CheatSheet onClose={toggleHelp} />}
      <BeatStrip />
    </section>
  )
}
