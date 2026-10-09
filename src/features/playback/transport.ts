// Starting, pausing and stopping playback: the engine plays, the store records that it is playing
// and where a pause resumes.

import type { PlayPosition } from '@/core'
import { useAppStore } from '@/app/store'
import { pausePlayback, startPlayback, stopPlayback } from './engine'

/** Plays from the count-in, or stops if already playing. Call it from a click or key press. */
export function togglePlayback(): void {
  const { playing, setPlaying, setPaused } = useAppStore.getState()
  setPaused(undefined)
  if (playing) {
    stopPlayback()
    setPlaying(false)
    return
  }
  play('start')
}

/**
 * Pauses, or resumes where the pause left off. With nothing paused in the open exercise, plays
 * from the count-in. Call it from a click or key press.
 */
export function togglePause(): void {
  const { playing, paused, editor, setPlaying, setPaused } = useAppStore.getState()
  if (playing) {
    const position = pausePlayback()
    setPlaying(false)
    setPaused(position && { exerciseId: editor.exercise.id, position })
    return
  }
  setPaused(undefined)
  play(paused?.exerciseId === editor.exercise.id ? paused.position : 'start')
}

function play(from: PlayPosition | 'start'): void {
  const { setPlaying } = useAppStore.getState()
  setPlaying(true)
  startPlayback(() => {
    const { editor, device } = useAppStore.getState()
    return { exercise: editor.exercise, device }
  }, from).catch((error: unknown) => {
    console.error(error)
    setPlaying(false)
  })
}
