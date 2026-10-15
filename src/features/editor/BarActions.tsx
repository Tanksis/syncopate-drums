import { useState } from 'react'
import { useAppStore } from '@/app/store'
import { Button, buttonClass } from '@/components/Button'
import { Menu } from '@/components/Menu'
import { PatternDialog } from '@/components/PatternDialog'
import { TrashIcon } from '@/components/icons'
import { barRange, isExample } from '@/core'

/**
 * Undo, redo and the bar menu, for editing without the keyboard. The menu's items are the bar keys'
 * commands, so they act on the cursor bar, or on the bars Shift+arrows selected. An example, which
 * can't be changed, has none of them. `large` buttons, quiet ones without a border, are big enough
 * for a finger; on a phone (`large`), a bin beside the menu deletes the bars too, as its last item does.
 */
export function BarActions({ large = false }: { large?: boolean }) {
  const editor = useAppStore((s) => s.editor)
  const dispatch = useAppStore((s) => s.dispatch)
  // The bar "Fill with pattern…" fills, kept from when the dialog opened; null while it's closed.
  const [filling, setFilling] = useState<number | null>(null)
  if (isExample(editor.exercise.id)) return null
  const { first, last } = editor.selection ?? { first: editor.cursor.bar, last: editor.cursor.bar }
  const { bar } = editor.cursor
  const cursorBar = `bar ${bar + 1}`
  const bars = barRange(first, last)
  // A paste writes the whole clipboard from the cursor bar on, up to the end of the exercise.
  const pasted = barRange(bar, Math.min(bar + (editor.clipboard?.length ?? 1), editor.exercise.bars.length) - 1)
  const deleteBars = { label: `Delete ${bars}`, disabled: editor.exercise.bars.length === 1, onSelect: () => dispatch({ type: 'deleteBar' }) }
  return (
    <div className="flex items-center gap-1">
      <HistoryButton large={large} label="Undo (Ctrl+Z)" disabled={editor.history.undo.length === 0} onClick={() => dispatch({ type: 'undo' })}>
        ↶
      </HistoryButton>
      <HistoryButton large={large} label="Redo (Ctrl+Shift+Z)" disabled={editor.history.redo.length === 0} onClick={() => dispatch({ type: 'redo' })}>
        ↷
      </HistoryButton>
      <Menu
        label="Bar menu"
        large={large}
        buttonClassName={large ? buttonClass({ variant: 'ghost', size: 'lg', icon: true }) : undefined}
        // On a phone it's at the left of the sheet, so it opens rightwards to stay on the screen.
        align={large ? 'left' : 'right'}
        items={[
          { label: `Add a bar after ${cursorBar}`, onSelect: () => dispatch({ type: 'addBar' }) },
          { label: `Duplicate ${cursorBar}`, onSelect: () => dispatch({ type: 'duplicateBar' }) },
          { label: `Copy ${bars}`, onSelect: () => dispatch({ type: 'copyBars' }) },
          { label: `Fill ${cursorBar} with pattern…`, onSelect: () => setFilling(bar) },
          { label: `Kicks in the gaps: ${cursorBar}`, onSelect: () => dispatch({ type: 'kicksInGaps', bar }) },
          { label: 'Kicks in the gaps: every bar', onSelect: () => dispatch({ type: 'kicksInGaps', bar: 'all' }) },
          {
            label: `Paste over ${pasted}`,
            disabled: editor.clipboard === null,
            onSelect: () => dispatch({ type: 'pasteBars' }),
          },
          deleteBars,
        ]}
      />
      {large && (
        <Button variant="ghost" size="lg" icon aria-label={deleteBars.label} title={deleteBars.label} disabled={deleteBars.disabled} onClick={deleteBars.onSelect}>
          <span aria-hidden className="flex [&>svg]:size-5">
            <TrashIcon />
          </span>
        </Button>
      )}
      {filling !== null && (
        <PatternDialog
          title={`Fill bar ${filling + 1} with a pattern`}
          submitLabel="Fill"
          onCancel={() => setFilling(null)}
          onSubmit={({ steps, grid }) => {
            dispatch({ type: 'fillPattern', bar: filling, pattern: steps, grid })
            setFilling(null)
          }}
        />
      )}
    </div>
  )
}

/** ↶ or ↷, greyed out when there's nothing to take back or redo. */
function HistoryButton({
  large,
  label,
  disabled,
  onClick,
  children,
}: {
  large: boolean
  label: string
  disabled: boolean
  onClick: () => void
  children: string
}) {
  return (
    <Button
      variant="ghost"
      size={large ? 'lg' : 'sm'}
      icon
      aria-label={label}
      title={label}
      disabled={disabled}
      tabIndex={-1}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}
