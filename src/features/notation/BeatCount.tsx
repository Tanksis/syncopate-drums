import { useEffect, useState } from 'react'
import { useAppStore } from '@/app/store'
import type { CountedBeat } from '@/core'
import { beatCountAt } from '@/core'
import { playhead } from '@/features/playback/engine'

/**
 * The beat the drummer is hearing while the exercise plays, read on each animation frame; undefined
 * when stopped, or when the beat count is switched off (`on`), when it doesn't read at all.
 */
export function useBeatCount(on: boolean): CountedBeat | undefined {
  const playing = useAppStore((s) => s.playing)
  const [now, setNow] = useState<CountedBeat>()
  useEffect(() => {
    if (!playing || !on) {
      setNow(undefined)
      return
    }
    let frame = requestAnimationFrame(function step() {
      const head = playhead()
      if (head) {
        const count = beatCountAt(head.position)
        // The same beat keeps the same object, so React skips the render while the beat is unchanged.
        setNow((old) => (old?.countIn === count.countIn && old.beat === count.beat ? old : count))
      }
      frame = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(frame)
  }, [playing, on])
  return now
}

/**
 * The beat count in the notation card's top-right corner: the bar's beats, the current one enlarged
 * (only lit, with reduced motion) and beat 1 in the accent colour, with **count-in** beside it during
 * the count-in. Smaller on a phone. Decoration only: the audio is what the drummer counts by.
 */
export function BeatCount({ count, small }: { count: CountedBeat; small: boolean }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute z-10 flex items-baseline font-semibold tabular-nums ${small ? 'top-2 right-3 gap-2' : 'top-3 right-5 gap-3'}`}
    >
      {count.countIn && <span className="mr-2 text-sm text-mute">count-in</span>}
      {Array.from({ length: count.beats }, (_, beat) => {
        const on = count.beat === beat
        return (
          <span
            key={beat}
            className={`${small ? 'text-2xl' : 'text-3xl'} transition-[color,scale] duration-75 motion-reduce:scale-100! ${
              on ? (beat === 0 ? 'scale-150 text-accent' : 'scale-125 text-ink') : 'text-line'
            }`}
          >
            {beat + 1}
          </span>
        )
      })}
    </div>
  )
}
