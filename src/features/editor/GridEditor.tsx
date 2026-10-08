import { useCallback, useState } from 'react'
import { useAppStore } from '@/app/store'
import { keepFocus } from '@/components/keepFocus'
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
        <VimSwitch />
        <button
          type="button"
          aria-pressed={helpOpen}
          title="Keys for this mode (?)"
          onMouseDown={keepFocus}
          onClick={toggleHelp}
          className="cursor-pointer rounded-md border border-line bg-card px-2 py-0.5 text-xs text-mute hover:text-accent aria-pressed:border-accent aria-pressed:text-accent"
        >
          ? keys
        </button>
      </div>
      {helpOpen && <CheatSheet onClose={toggleHelp} />}
      <BeatStrip />
      <FigureKeyLegend />
      <FiguresPanel />
    </section>
  )
}

/** What the letter on each beat card is: one quiet line, close under the cards. */
function FigureKeyLegend() {
  return (
    <p className="-mt-2 mb-0 text-xs text-mute">
      Letters show each beat's figure key: type it to enter that figure.{' '}
      <kbd className="rounded border border-b-2 border-line px-1 font-mono text-[10px]/[14px]">?</kbd> for all keys.
    </p>
  )
}

/** The palette tiles, folded away by default; whether it's open is remembered per device. */
function FiguresPanel() {
  const open = useAppStore((s) => s.device.figuresPanelOpen)
  const setDeviceSettings = useAppStore((s) => s.setDeviceSettings)
  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="figures-panel"
        title={open ? 'Hide the figure tiles' : 'Show the figure tiles and their keys'}
        // Keep focus off the button, so the editor's keys still work after a click.
        onMouseDown={keepFocus}
        onClick={() => setDeviceSettings({ figuresPanelOpen: !open })}
        className="flex w-fit cursor-pointer items-center gap-1 text-xs font-semibold text-mute hover:text-accent"
      >
        <span aria-hidden className={`inline-block transition-transform ${open ? 'rotate-90' : ''}`}>
          ▸
        </span>
        Figures
      </button>
      {open && (
        <div id="figures-panel">
          <Palette />
        </div>
      )}
    </div>
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

/** Turns the vim keys on or off right by the editor, as the Editor setting does. */
function VimSwitch() {
  const vimKeys = useAppStore((s) => s.device.vimKeys)
  const setDeviceSettings = useAppStore((s) => s.setDeviceSettings)
  return (
    <button
      type="button"
      role="switch"
      aria-checked={vimKeys}
      title={vimKeys ? 'Turn vim keys off: no Normal mode, Esc does nothing' : 'Turn vim keys on: Esc for Normal mode'}
      // Keep focus off the button, so the editor's keys still work after a click.
      onMouseDown={keepFocus}
      onClick={() => setDeviceSettings({ vimKeys: !vimKeys })}
      className="ml-auto cursor-pointer rounded-md border border-line bg-card px-2 py-0.5 text-xs text-mute hover:text-accent aria-checked:border-accent aria-checked:text-accent"
    >
      vim {vimKeys ? 'on' : 'off'}
    </button>
  )
}
