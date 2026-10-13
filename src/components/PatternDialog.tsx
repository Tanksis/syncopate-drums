import type { KeyboardEvent } from 'react'
import { useId, useState } from 'react'
import { Dialog, DialogButton } from '@/components/Dialog'
import { keepFocus } from '@/components/keepFocus'
import type { PatternGrid, PatternStep } from '@/core'
import { parsePattern } from '@/core'

/** The bars New from pattern makes at first, and at most. */
const DEFAULT_BARS = 4
const MAX_BARS = 64

/** What the dialog submits: the pattern as typed and its steps, its grid, and the bars to make. */
export interface PatternChoice {
  text: string
  steps: PatternStep[]
  grid: PatternGrid
  /** Only when the dialog asks for bars. */
  bars: number
}

const GRIDS: readonly { grid: PatternGrid; name: string }[] = [
  { grid: 'sixteenths', name: '16ths' },
  { grid: 'triplets', name: 'Triplets' },
]

/**
 * Asks for a sticking pattern of R, L, K and `.` and its grid, 16ths or triplets, and with `askBars`
 * how many bars to make (1 to 64). The submit button is greyed out while the pattern can't be read,
 * with the reason under the field once something is typed, or while the bars are out of range.
 * Enter submits, Escape cancels.
 */
export function PatternDialog({
  title,
  submitLabel,
  askBars = false,
  onSubmit,
  onCancel,
}: {
  title: string
  submitLabel: string
  askBars?: boolean
  onSubmit: (choice: PatternChoice) => void
  onCancel: () => void
}) {
  const [text, setText] = useState('')
  const [grid, setGrid] = useState<PatternGrid>('sixteenths')
  const [barsText, setBarsText] = useState(String(DEFAULT_BARS))
  const errorId = useId()
  const parsed = parsePattern(text)
  const error = 'error' in parsed && text.trim() !== '' ? parsed.error : null
  const bars = Number(barsText)
  const barsValid = !askBars || (Number.isInteger(bars) && bars >= 1 && bars <= MAX_BARS)
  const valid = 'steps' in parsed && barsValid
  const submit = () => {
    if ('steps' in parsed && barsValid) onSubmit({ text, steps: parsed.steps, grid, bars: askBars ? bars : 1 })
  }
  const submitOnEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    submit()
  }
  return (
    <Dialog
      title={title}
      onCancel={onCancel}
      buttons={
        <>
          <DialogButton onClick={onCancel}>Cancel</DialogButton>
          <DialogButton primary disabled={!valid} onClick={submit}>
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
            onKeyDown={submitOnEnter}
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
        {askBars && (
          <label className="flex items-center justify-between gap-2">
            <span className="text-mute">Bars</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_BARS}
              value={barsText}
              aria-invalid={!barsValid}
              onChange={(e) => setBarsText(e.currentTarget.value)}
              onKeyDown={submitOnEnter}
              className="w-20 rounded-md border border-edge bg-card px-2 py-1 text-base outline-none focus:border-accent aria-invalid:border-danger"
            />
          </label>
        )}
      </div>
    </Dialog>
  )
}
