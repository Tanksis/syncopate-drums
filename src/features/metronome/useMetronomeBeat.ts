import { useEffect, useState } from 'react'
import { useAppStore } from '@/app/store'
import { metronomeBeat } from '@/core'
import { playhead } from '@/features/playback/engine'

/** The beat the drummer hears now, counted from 0, while the metronome plays; undefined otherwise. */
export function useMetronomeBeat(): number | undefined {
  const playing = useAppStore((s) => s.metronomePlaying)
  const [beat, setBeat] = useState<number | undefined>(undefined)

  useEffect(() => {
    setBeat(undefined)
    if (!playing) return
    let frame = requestAnimationFrame(function step() {
      const head = playhead()
      // React skips the render while the beat is unchanged, so this is cheap between beats.
      setBeat(head ? metronomeBeat(head.position).beat : undefined)
      frame = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(frame)
  }, [playing])

  return beat
}
