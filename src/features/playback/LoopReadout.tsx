import { useAppStore } from '@/app/store'
import { keepFocus } from '@/components/keepFocus'
import { loopBars } from '@/core'

/** The header's loop range: the bars that repeat, and "all" to loop the whole exercise again. */
export function LoopReadout() {
  const loopRange = useAppStore((s) => s.editor.exercise.practice.loopRange)
  const barCount = useAppStore((s) => s.editor.exercise.bars.length)
  const loopAll = useAppStore((s) => s.loopAll)
  const { first, last } = loopBars(loopRange, barCount)
  const bars = first === last ? `bar ${first + 1}` : `bars ${first + 1}–${last + 1}`
  return (
    <div className="flex items-center gap-2" title="Click a bar number to loop it, Shift+click to extend">
      <span className="text-mute">Loop</span>
      <span className={`tabular-nums ${loopRange ? 'font-semibold text-loop-ink' : ''}`}>{loopRange ? bars : 'all bars'}</span>
      {loopRange && (
        <button
          type="button"
          title="Loop the whole exercise"
          // Keep focus off the button, so Space and Enter go to the editor rather than clicking it.
          onMouseDown={keepFocus}
          onClick={loopAll}
          className="cursor-pointer rounded-md border border-edge bg-panel px-2 py-0.5 hover:border-accent"
        >
          all
        </button>
      )}
    </div>
  )
}
