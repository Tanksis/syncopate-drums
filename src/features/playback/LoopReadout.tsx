import { useAppStore } from '@/app/store'
import { Button } from '@/components/Button'
import { loopBars } from '@/core'

/** The header's loop range: the bars that repeat, and "all" to loop the whole exercise again. */
export function LoopReadout() {
  const loopRange = useAppStore((s) => s.editor.exercise.practice.loopRange)
  const barCount = useAppStore((s) => s.editor.exercise.bars.length)
  const loopAll = useAppStore((s) => s.loopAll)
  const { first, last } = loopBars(loopRange, barCount)
  const bars = first === last ? `bar ${first + 1}` : `bars ${first + 1}–${last + 1}`
  return (
    <div className="flex items-center gap-2 whitespace-nowrap" title="Click a bar number to loop it, Shift+click to extend">
      <span className="text-mute">Loop</span>
      <span className={`tabular-nums ${loopRange ? 'font-semibold text-loop-ink' : ''}`}>{loopRange ? bars : 'all bars'}</span>
      {loopRange && (
        <Button title="Loop the whole exercise" onClick={loopAll}>
          all
        </Button>
      )}
    </div>
  )
}
