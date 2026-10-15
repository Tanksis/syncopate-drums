// Starting, pausing and stopping playback: the engine plays the exercise or the metronome, one at a
// time, and the store records which is playing and where a pause resumes.

import type { PlayPosition } from '@/core'
import { useAppStore } from '@/app/store'
import { audioInterrupted, pausePlayback, startPlayback, stopPlayback } from './engine'

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

/** Stops the exercise if it is playing, as leaving the Practice screen does. A pause is kept, to resume from. */
export function stopExercise(): void {
  const { playing, setPlaying } = useAppStore.getState()
  if (!playing) return
  stopPlayback()
  setPlaying(false)
}

/** Plays the metronome from its first beat, stopping an exercise that is playing, or stops it if already playing. */
export function toggleMetronome(): void {
  const { metronomePlaying, setPlaying, setMetronomePlaying } = useAppStore.getState()
  if (metronomePlaying) {
    stopPlayback()
    setMetronomePlaying(false)
    return
  }
  setPlaying(false)
  setMetronomePlaying(true)
  startPlayback(() => ({ kind: 'metronome', metronome: useAppStore.getState().device.metronome })).catch((error: unknown) => {
    console.error(error)
    setMetronomePlaying(false)
  })
}

/** Plays the open exercise, stopping the metronome if it is playing. */
function play(from: PlayPosition | 'start'): void {
  const { setPlaying, setMetronomePlaying } = useAppStore.getState()
  setMetronomePlaying(false)
  setPlaying(true)
  startPlayback(() => {
    const { editor, device } = useAppStore.getState()
    return { kind: 'exercise', exercise: editor.exercise, device }
  }, from).catch((error: unknown) => {
    console.error(error)
    setPlaying(false)
  })
}

/** How long after the page shows again the audio has to come back by itself. */
const RESUME_GRACE_MS = 1000

/**
 * Coming back to the app (on iOS) can leave the audio stopped by the system while the transport
 * still shows it playing: then it is stopped, so Play starts it afresh. Call it once at launch.
 */
export function stopWhenAudioInterrupted(): void {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return
    setTimeout(() => {
      if (!audioInterrupted()) return
      stopPlayback()
      const { setPlaying, setMetronomePlaying } = useAppStore.getState()
      setPlaying(false)
      setMetronomePlaying(false)
    }, RESUME_GRACE_MS)
  })
}
