// Starting and stopping playback: the engine plays, the store records that it is playing.

import { useAppStore } from '@/app/store'
import { startPlayback, stopPlayback } from './engine'

/** Plays from the count-in, or stops if already playing. Call it from a click or key press. */
export function togglePlayback(): void {
  const { playing, setPlaying } = useAppStore.getState()
  if (playing) {
    stopPlayback()
    setPlaying(false)
    return
  }
  setPlaying(true)
  startPlayback(() => {
    const { editor, device } = useAppStore.getState()
    return { exercise: editor.exercise, device }
  }).catch((error: unknown) => {
    console.error(error)
    setPlaying(false)
  })
}
