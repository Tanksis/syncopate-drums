import { useEffect, useState } from 'react'
import { useAppStore } from '@/app/store'
import { positionLabel } from '@/core'
import { playhead } from './engine'

/** The header's playback position: the count-in, then bar · beat, as the drummer hears it. */
export function PlaybackPosition() {
  const playing = useAppStore((s) => s.playing)
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (!playing) {
      setLabel('')
      return
    }
    let frame = requestAnimationFrame(function step() {
      const head = playhead()
      // React skips the render while the label is unchanged, so this is cheap between beats.
      setLabel(head ? positionLabel(head.position) : '')
      frame = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(frame)
  }, [playing])

  return (
    <span className="inline-block w-24 tabular-nums" aria-label="Playback position" aria-live="off">
      {label}
    </span>
  )
}
