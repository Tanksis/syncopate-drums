import { useState } from 'react'
import { useAppStore } from '@/app/store'
import { Button } from '@/components/Button'
import { LoopIcon } from '@/components/icons'
import { keepFocus } from '@/components/keepFocus'
import { Popover } from '@/components/Popover'
import { inLoopRange, loopBars, loopLabel, pickLoopBar } from '@/core'

/**
 * The chip's look. Its label keeps room for a range of one-digit bars, so setting a loop or clearing it
 * doesn't widen the chip and move what's beside it.
 */
const chipClass = 'inline-flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-full border px-2.5 whitespace-nowrap'
const chipOff = 'border-edge bg-card text-mute hover:border-accent hover:text-ink aria-expanded:border-accent aria-expanded:text-ink'
const chipOn = 'border-loop-line bg-loop text-loop-ink hover:border-loop-ink aria-expanded:border-loop-ink'

/**
 * The loop range as a chip, "Loop · All bars" or the looped bars in the loop's colour, which opens
 * the bar picker under it. `large` for a finger, on the phone.
 */
export function LoopChip({ large = false }: { large?: boolean }) {
  const loopRange = useAppStore((s) => s.editor.exercise.practice.loopRange)
  const barCount = useAppStore((s) => s.editor.exercise.bars.length)
  const label = loopLabel(loopRange, barCount)
  return (
    <Popover
      label={`Loop: ${label}`}
      panelLabel="Loop"
      title="Choose the bars to loop"
      buttonClassName={`${chipClass} ${loopRange ? chipOn : chipOff}`}
      icon={
        <>
          <LoopIcon />
          <span className="text-mute">Loop ·</span>
          <span className="min-w-15 text-left font-semibold tabular-nums">{label}</span>
        </>
      }
    >
      <LoopPicker large={large} />
    </Popover>
  )
}

/**
 * The bars to choose a loop from: the first bar chosen loops alone, a second loops from one to the
 * other, and All bars clears it. The bars in the loop are lit in its colour.
 */
function LoopPicker({ large }: { large: boolean }) {
  const loopRange = useAppStore((s) => s.editor.exercise.practice.loopRange)
  const barCount = useAppStore((s) => s.editor.exercise.bars.length)
  const loopBar = useAppStore((s) => s.loopBar)
  const loopAll = useAppStore((s) => s.loopAll)
  // The bar chosen first, waiting for the bar the loop runs to.
  const [pick, setPick] = useState<number | null>(null)

  const choose = (bar: number) => {
    const step = pickLoopBar(pick, bar)
    loopBar(bar, { extend: step.extend })
    setPick(step.next)
  }
  const looped = loopRange ? loopBars(loopRange, barCount) : null
  const status =
    pick !== null
      ? `${loopLabel(loopRange, barCount)} loops. Choose another bar to loop up to it.`
      : looped
        ? `${loopLabel(loopRange, barCount)} ${looped.first === looped.last ? 'loops' : 'loop'}. Choose a bar to start a new loop.`
        : 'Choose a bar to loop it, then another to loop from one to the other.'

  return (
    <div className={`flex flex-col gap-3 ${large ? '' : 'text-sm'}`}>
      <p role="status" className="m-0 text-mute">
        {status}
      </p>
      <div role="group" aria-label="Bars" className={`grid gap-1.5 ${large ? 'grid-cols-5' : 'grid-cols-6'}`}>
        {Array.from({ length: barCount }, (_, bar) => {
          const on = inLoopRange(loopRange, bar)
          return (
            <button
              key={bar}
              type="button"
              aria-pressed={on}
              aria-label={`Bar ${bar + 1}`}
              onMouseDown={keepFocus}
              onClick={() => choose(bar)}
              className={`flex cursor-pointer items-center justify-center rounded-md border font-semibold tabular-nums ${large ? 'h-11 text-base' : 'h-8'} ${
                on ? 'border-loop-line bg-loop text-loop-ink hover:border-loop-ink' : 'border-edge bg-card text-ink hover:border-accent hover:text-accent'
              } ${pick === bar ? 'outline-2 outline-offset-1 outline-loop-ink' : ''}`}
            >
              {bar + 1}
            </button>
          )
        })}
      </div>
      <Button
        size={large ? 'lg' : 'md'}
        aria-pressed={!loopRange}
        onClick={() => {
          loopAll()
          setPick(null)
        }}
        className="aria-pressed:border-accent aria-pressed:text-accent"
      >
        All bars
      </Button>
      {!large && <p className="m-0 text-xs text-mute">Or click a bar number over the staff; Shift+click extends the loop.</p>}
    </div>
  )
}
