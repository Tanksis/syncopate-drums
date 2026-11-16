import { useEffect, useState } from 'react'
import { useAppStore } from '@/app/store'
import { positionLabel } from '@/core'
import { playhead } from './engine'

/**
 * The header's playback position: the count-in, then bar · beat, as the drummer hears it; while
 * paused, where playback resumes. Its box keeps the size of the longest label ("‖ count-in · 4"),
 * empty or not, so nothing beside it moves as playback starts and stops.
 */
export function PlaybackPosition() {
  const playing = useAppStore((s) => s.playing)
  const paused = useAppStore((s) => (s.paused?.exerciseId === s.editor.exercise.id ? s.paused.position : undefined))
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (!playing) {
      setLabel(paused ? `‖ ${positionLabel(paused)}` : '')
      return
    }
    let frame = requestAnimationFrame(function step() {
      const head = playhead()
      // React skips the render while the label is unchanged, so this is cheap between beats.
      setLabel(head ? positionLabel(head.position) : '')
      frame = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(frame)
  }, [playing, paused])

  return (
    <span className="inline-block h-5 w-22 tabular-nums" aria-label="Playback position" aria-live="off">
      {label}
    </span>
  )
}
