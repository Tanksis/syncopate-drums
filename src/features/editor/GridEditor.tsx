import { useCallback, useState } from 'react'
import { useAppStore } from '@/app/store'
import { BeatStrip } from './BeatStrip'
import { CheatSheet } from './CheatSheet'
import { Palette } from './Palette'
import { useEditorKeys } from './useEditorKeys'

export function GridEditor() {
  const [helpOpen, setHelpOpen] = useState(false)
  const toggleHelp = useCallback(() => setHelpOpen((open) => !open), [])
  useEditorKeys(toggleHelp)
  return (
    <section
      aria-label="Grid editor"
      className="flex max-h-[52vh] min-h-[30vh] flex-col gap-3 overflow-auto border-t border-line bg-panel px-4 py-2"
    >
      <div className="flex items-center gap-3">
        <ModeIndicator />
        <button
          type="button"
          aria-pressed={helpOpen}
          title="Keys for this mode (?)"
          onMouseDown={(e) => e.preventDefault()}
          onClick={toggleHelp}
          className="ml-auto cursor-pointer rounded-md border border-line bg-card px-2 py-0.5 text-xs text-mute hover:text-accent aria-pressed:border-accent aria-pressed:text-accent"
        >
          ? keys
        </button>
      </div>
      {helpOpen && <CheatSheet onClose={toggleHelp} />}
      <BeatStrip />
      <Palette />
    </section>
  )
}

/** vim's mode line: `-- INSERT --`, `-- NORMAL --` or `-- VISUAL LINE --`, and any keys pending. Hidden with vim keys off. */
function ModeIndicator() {
  const vimKeys = useAppStore((s) => s.device.vimKeys)
  const { mode, pending, selection } = useAppStore((s) => s.editor)
  if (!vimKeys) return null
  const name = mode === 'insert' ? 'INSERT' : selection ? 'VISUAL LINE' : 'NORMAL'
  return (
    <span aria-label="Editor mode" aria-live="polite" className="font-mono text-xs font-semibold text-mute">
      -- {name} --
      {pending && <span className="ml-3 text-ink">{pending}</span>}
    </span>
  )
}
