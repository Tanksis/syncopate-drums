import { useAppStore } from '@/app/store'
import { keepFocus } from '@/components/keepFocus'
import { Menu } from '@/components/Menu'
import { isExample } from '@/core'

/**
 * Undo, redo and the bar menu, for editing without the keyboard. The menu's items are the bar keys'
 * commands, so they act on the cursor bar, or on the bars Shift+arrows selected. An example, which
 * can't be changed, has none of them.
 */
export function BarActions() {
  const editor = useAppStore((s) => s.editor)
  const dispatch = useAppStore((s) => s.dispatch)
  if (isExample(editor.exercise.id)) return null
  const { first, last } = editor.selection ?? { first: editor.cursor.bar, last: editor.cursor.bar }
  const { bar } = editor.cursor
  const cursorBar = `bar ${bar + 1}`
  const bars = barRange(first, last)
  // A paste writes the whole clipboard from the cursor bar on, up to the end of the exercise.
  const pasted = barRange(bar, Math.min(bar + (editor.clipboard?.length ?? 1), editor.exercise.bars.length) - 1)
  return (
    <div className="flex items-center gap-1">
      <HistoryButton label="Undo (Ctrl+Z)" disabled={editor.history.undo.length === 0} onClick={() => dispatch({ type: 'undo' })}>
        ↶
      </HistoryButton>
      <HistoryButton label="Redo (Ctrl+Shift+Z)" disabled={editor.history.redo.length === 0} onClick={() => dispatch({ type: 'redo' })}>
        ↷
      </HistoryButton>
      <Menu
        label="Bar menu"
        items={[
          { label: `Add a bar after ${cursorBar}`, onSelect: () => dispatch({ type: 'addBar' }) },
          { label: `Duplicate ${cursorBar}`, onSelect: () => dispatch({ type: 'duplicateBar' }) },
          { label: `Copy ${bars}`, onSelect: () => dispatch({ type: 'copyBars' }) },
          {
            label: `Paste over ${pasted}`,
            disabled: editor.clipboard === null,
            onSelect: () => dispatch({ type: 'pasteBars' }),
          },
          {
            label: `Delete ${bars}`,
            disabled: editor.exercise.bars.length === 1,
            onSelect: () => dispatch({ type: 'deleteBar' }),
          },
        ]}
      />
    </div>
  )
}

/** "bar 2", or "bars 2–4". */
const barRange = (first: number, last: number) => (first === last ? `bar ${first + 1}` : `bars ${first + 1}–${last + 1}`)

/** ↶ or ↷, greyed out when there's nothing to take back or redo. */
function HistoryButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      tabIndex={-1}
      // Keep focus off the button, so the editor's keys still work after a click.
      onMouseDown={keepFocus}
      onClick={onClick}
      className="cursor-pointer rounded px-1 text-base/none text-mute hover:bg-line hover:text-accent disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-mute"
    >
      {children}
    </button>
  )
}
