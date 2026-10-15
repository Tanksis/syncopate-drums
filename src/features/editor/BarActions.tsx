import type { ReactNode } from 'react'
import { useState } from 'react'
import { useAppStore } from '@/app/store'
import { Button, buttonClass } from '@/components/Button'
import { Menu } from '@/components/Menu'
import { PatternDialog } from '@/components/PatternDialog'
import { RedoIcon, TrashIcon, UndoIcon } from '@/components/icons'
import { barRange, isExample } from '@/core'

/**
 * Undo, redo and the bar menu, for editing without the keyboard. The menu's items are the bar keys'
 * commands, so they act on the cursor bar, or on the bars Shift+arrows selected. An example, which
 * can't be changed, has none of them. `large` buttons, quiet ones without a border, are big enough
 * for a finger: the phone's row at the foot of the editor sheet, where `dots` (the bar dots) sit
 * between redo and a bin that deletes the bars, as the menu's last item does. An example keeps only `dots`.
 */
export function BarActions({ large = false, dots }: { large?: boolean; dots?: ReactNode }) {
  const editor = useAppStore((s) => s.editor)
  const dispatch = useAppStore((s) => s.dispatch)
  // The bar "Fill with pattern…" fills, kept from when the dialog opened; null while it's closed.
  const [filling, setFilling] = useState<number | null>(null)
  if (isExample(editor.exercise.id)) return dots ?? null
  const { first, last } = editor.selection ?? { first: editor.cursor.bar, last: editor.cursor.bar }
  const { bar } = editor.cursor
  const cursorBar = `bar ${bar + 1}`
  const bars = barRange(first, last)
  // A paste writes the whole clipboard from the cursor bar on, up to the end of the exercise.
  const pasted = barRange(bar, Math.min(bar + (editor.clipboard?.length ?? 1), editor.exercise.bars.length) - 1)
  const deleteBars = { label: `Delete ${bars}`, disabled: editor.exercise.bars.length === 1, onSelect: () => dispatch({ type: 'deleteBar' }) }
  return (
    <div className={`flex items-center ${large ? 'min-w-0 flex-1' : 'gap-1'}`}>
      <HistoryButton large={large} label="Undo (Ctrl+Z)" disabled={editor.history.undo.length === 0} onClick={() => dispatch({ type: 'undo' })}>
        <UndoIcon />
      </HistoryButton>
      <HistoryButton large={large} label="Redo (Ctrl+Shift+Z)" disabled={editor.history.redo.length === 0} onClick={() => dispatch({ type: 'redo' })}>
        <RedoIcon />
      </HistoryButton>
      {dots}
      {large && (
        <Button variant="ghost" size="lg" icon aria-label={deleteBars.label} title={deleteBars.label} disabled={deleteBars.disabled} onClick={deleteBars.onSelect} className={NARROW}>
          <span aria-hidden className="flex [&>svg]:size-5">
            <TrashIcon />
          </span>
        </Button>
      )}
      <Menu
        label="Bar menu"
        large={large}
        buttonClassName={large ? `${buttonClass({ variant: 'ghost', size: 'lg', icon: true })} ${NARROW}` : undefined}
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

/** The phone row's buttons are a little narrower than a finger's 44 px, so six bar dots fit beside them. */
const NARROW = 'w-10!'

/** Undo or redo, greyed out when there's nothing to take back or redo. */
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
  children: ReactNode
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
      className={large ? NARROW : ''}
    >
      <span aria-hidden className={`flex ${large ? '[&>svg]:size-5' : '[&>svg]:size-3.5'}`}>
        {children}
      </span>
    </Button>
  )
}
