import { useId, useState } from 'react'
import { Dialog, DialogButton } from '@/components/Dialog'
import { keepFocus } from '@/components/keepFocus'
import type { PatternGrid, PatternStep } from '@/core'
import { parsePattern } from '@/core'

const GRIDS: readonly { grid: PatternGrid; name: string }[] = [
  { grid: 'sixteenths', name: '16ths' },
  { grid: 'triplets', name: 'Triplets' },
]

/**
 * Asks for a sticking pattern of R, L, K and `.` and its grid, 16ths or triplets. The submit button
 * is greyed out while the pattern can't be read, with the reason under the field once something is
 * typed. Enter submits, Escape cancels.
 */
export function PatternDialog({
  title,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  title: string
  submitLabel: string
  onSubmit: (pattern: PatternStep[], grid: PatternGrid) => void
  onCancel: () => void
}) {
  const [text, setText] = useState('')
  const [grid, setGrid] = useState<PatternGrid>('sixteenths')
  const errorId = useId()
  const parsed = parsePattern(text)
  const error = 'error' in parsed && text.trim() !== '' ? parsed.error : null
  const submit = () => {
    if ('steps' in parsed) onSubmit(parsed.steps, grid)
  }
  return (
    <Dialog
      title={title}
      onCancel={onCancel}
      buttons={
        <>
          <DialogButton onClick={onCancel}>Cancel</DialogButton>
          <DialogButton primary disabled={!('steps' in parsed)} onClick={submit}>
            {submitLabel}
          </DialogButton>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-mute">Pattern: R, L, K and . for a rest</span>
          {/* 16 px, so iOS doesn't zoom in when it's focused. */}
          <input
            data-autofocus
            value={text}
            placeholder="RLRK"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-invalid={error !== null}
            aria-describedby={error ? errorId : undefined}
            onChange={(e) => setText(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              e.preventDefault()
              submit()
            }}
            className="rounded-md border border-edge bg-card px-2 py-1 font-mono text-base tracking-widest uppercase outline-none focus:border-accent aria-invalid:border-danger"
          />
          {error && (
            <span id={errorId} className="text-sm text-danger">
              {error}
            </span>
          )}
        </label>
        <div role="group" aria-label="Grid" className="flex items-center justify-between gap-2">
          <span className="text-mute">Grid</span>
          <div className="flex overflow-hidden rounded-md border border-edge">
            {GRIDS.map((option) => (
              <button
                key={option.grid}
                type="button"
                aria-pressed={option.grid === grid}
                // Keep focus in the pattern field, so Enter still fills.
                onMouseDown={keepFocus}
                onClick={() => setGrid(option.grid)}
                className="cursor-pointer border-l border-edge bg-card px-2 py-0.5 first:border-l-0 hover:text-accent aria-pressed:bg-accent aria-pressed:text-on-accent aria-pressed:hover:text-on-accent"
              >
                {option.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Dialog>
  )
}
