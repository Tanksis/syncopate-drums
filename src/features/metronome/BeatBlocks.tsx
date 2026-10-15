import { useAppStore } from '@/app/store'
import { keepFocus } from '@/components/keepFocus'
import type { BeatLevel } from '@/core'
import { cycleLevel } from '@/core'

/** Each level's name, as a block's accessible name says it. */
const LEVEL_NAMES: Record<BeatLevel, string> = { accent: 'Accent', normal: 'Normal', soft: 'Soft', off: 'Off' }

/** Each level's colour: a block's fill, and its dial dot's while the beat plays. Off has none. */
export const LEVEL_COLOUR: Record<BeatLevel, string> = {
  accent: 'bg-accent',
  normal: 'bg-mute',
  soft: 'bg-edge/50',
  off: 'bg-card',
}

/** A block's fill height shows its level. */
const LEVEL_HEIGHT: Record<BeatLevel, string> = { accent: 'h-full', normal: 'h-2/3', soft: 'h-1/3', off: 'h-0' }

/**
 * A block per beat of the bar: tapping one cycles its level (Accent, Normal, Soft, Off), heard on
 * the next pass. The beat playing now is outlined and tinted. Up to 8 sit in a row; more take two rows.
 * `tall` keeps them full height on a short screen, as beside the dial on a phone turned sideways;
 * `large` draws them taller still, for the desktop's page.
 */
export function BeatBlocks({ beat, tall = false, large = false }: { beat: number | undefined; tall?: boolean; large?: boolean }) {
  const levels = useAppStore((s) => s.device.metronome.levels)
  const setMetronome = useAppStore((s) => s.setMetronome)
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${blockColumns(levels.length)}, minmax(0, 1fr))` }}>
      {levels.map((level, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Beat ${i + 1}: ${LEVEL_NAMES[level]}. Tap to change`}
          onMouseDown={keepFocus}
          onClick={() => setMetronome({ levels: levels.map((l, j) => (j === i ? cycleLevel(l) : l)) })}
          className={`flex cursor-pointer touch-manipulation items-end rounded-xl p-1 ${blockHeight(levels.length > 8, tall, large)} ${
            beat === i ? 'border-2 border-ink bg-accent-tint' : `bg-card ${level === 'off' ? 'border border-dashed border-edge' : 'border border-line'}`
          }`}
        >
          <span className={`block w-full rounded-lg ${LEVEL_HEIGHT[level]} ${LEVEL_COLOUR[level]}`} />
        </button>
      ))}
    </div>
  )
}

/** A block's height: smaller in two rows, and on a short screen unless `tall`; tallest when `large`. */
function blockHeight(twoRows: boolean, tall: boolean, large: boolean): string {
  if (large) return twoRows ? 'h-20' : 'h-38'
  if (twoRows) return tall ? 'h-12' : 'h-16 short:h-12'
  return tall ? 'h-26' : 'h-26 short:h-16'
}

/** How many blocks sit in a row for `beats` beats: all of them up to 8, then half in each of two rows. */
export function blockColumns(beats: number): number {
  return beats <= 8 ? beats : Math.ceil(beats / 2)
}
