import { useAppStore } from '@/app/store'
import { keepFocus } from '@/components/keepFocus'
import type { BeatLevel } from '@/core'
import { cycleLevel } from '@/core'

export const LEVEL_NAMES: Record<BeatLevel, string> = { accent: 'Accent', normal: 'Normal', soft: 'Soft', off: 'Off' }

/** A block's fill: its height shows the level, and the accent is in the accent colour. */
const LEVEL_FILL: Record<BeatLevel, string> = {
  accent: 'h-full bg-accent',
  normal: 'h-2/3 bg-mute',
  soft: 'h-1/3 bg-edge/50',
  off: 'h-0',
}

/**
 * A block per beat of the bar: tapping one cycles its level (Accent, Normal, Soft, Off), heard on
 * the next pass. The beat playing now is outlined. Up to 8 sit in a row; more take two rows.
 */
export function BeatBlocks({ beat }: { beat: number | undefined }) {
  const levels = useAppStore((s) => s.device.metronome.levels)
  const setMetronome = useAppStore((s) => s.setMetronome)
  const columns = levels.length <= 8 ? levels.length : Math.ceil(levels.length / 2)
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {levels.map((level, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Beat ${i + 1}: ${LEVEL_NAMES[level]}. Tap to change`}
          onMouseDown={keepFocus}
          onClick={() => setMetronome({ levels: levels.map((l, j) => (j === i ? cycleLevel(l) : l)) })}
          className={`flex cursor-pointer touch-manipulation items-end rounded-xl bg-card p-1 ${levels.length > 8 ? 'h-16' : 'h-26'} ${
            beat === i ? 'border-2 border-ink' : level === 'off' ? 'border border-dashed border-edge' : 'border border-line'
          }`}
        >
          <span className={`block w-full rounded-lg ${LEVEL_FILL[level]}`} />
        </button>
      ))}
    </div>
  )
}
