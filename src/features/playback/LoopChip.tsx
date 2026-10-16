import { useAppStore } from '@/app/store'
import { keepFocus } from '@/components/keepFocus'
import { LoopIcon } from '@/components/icons'
import { loopLabel } from '@/core'

/** How to set a loop, shown on the chip whether or not one is set. */
const LOOP_HINT = 'Click a bar number to loop it, Shift+click to extend'

const chipClass = 'inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-edge bg-card px-2.5 whitespace-nowrap'

/**
 * The loop range as a chip: "Loop · All bars", or the looped bars in the loop's colour. Clicking a
 * loop clears it, back to all bars; a bar number on the staff sets one.
 */
export function LoopChip() {
  const loopRange = useAppStore((s) => s.editor.exercise.practice.loopRange)
  const barCount = useAppStore((s) => s.editor.exercise.bars.length)
  const loopAll = useAppStore((s) => s.loopAll)
  const label = loopLabel(loopRange, barCount)
  const content = (
    <>
      <LoopIcon />
      <span className="text-mute">Loop ·</span>
      <span className="font-semibold tabular-nums">{label}</span>
    </>
  )
  if (!loopRange)
    return (
      <span className={`${chipClass} text-mute`} title={LOOP_HINT}>
        {content}
      </span>
    )
  return (
    <button
      type="button"
      title={`Clear the loop, to play all bars. ${LOOP_HINT}`}
      onMouseDown={keepFocus}
      onClick={loopAll}
      className={`${chipClass} cursor-pointer border-loop-line bg-loop text-loop-ink hover:border-loop-ink`}
    >
      {content}
    </button>
  )
}
