// Keeping the screen awake for a phone on the music stand: a screen wake lock is held while
// playback runs and for a minute after it stops or pauses, then released so the screen may sleep.
// The browser drops the lock when the page is hidden, so it's requested again on return while
// playing. Where the API is missing, or the browser refuses, the screen simply sleeps as usual.

import { useAppStore } from '@/app/store'

/** How long the screen stays awake after playback stops or pauses. */
const LINGER_MS = 60_000

/**
 * Holds a screen wake lock while playing and for a minute after. Call it once at launch; it
 * returns a function that stops watching and releases the lock.
 */
export function keepAwakeWhilePlaying(): () => void {
  let sentinel: WakeLockSentinel | undefined
  let requesting = false
  let releaseTimer: ReturnType<typeof setTimeout> | undefined

  function acquire(): void {
    if (!('wakeLock' in navigator) || requesting || (sentinel && !sentinel.released)) return
    if (document.visibilityState !== 'visible') return
    requesting = true
    navigator.wakeLock
      .request('screen')
      .then((lock) => {
        sentinel = lock
        // Stopped for over a minute while the request was pending: let go at once.
        if (!useAppStore.getState().playing && releaseTimer === undefined) release()
      })
      .catch(() => {}) // refused (low battery, no permission): the screen sleeps as usual
      .finally(() => (requesting = false))
  }

  function release(): void {
    clearTimeout(releaseTimer)
    releaseTimer = undefined
    sentinel?.release().catch(() => {})
    sentinel = undefined
  }

  function onPlaying(playing: boolean): void {
    if (playing) {
      clearTimeout(releaseTimer)
      releaseTimer = undefined
      acquire()
    } else {
      clearTimeout(releaseTimer)
      releaseTimer = setTimeout(release, LINGER_MS)
    }
  }

  function onVisibilityChange(): void {
    if (useAppStore.getState().playing) acquire()
  }

  const unsubscribe = useAppStore.subscribe((state, previous) => {
    if (state.playing !== previous.playing) onPlaying(state.playing)
  })
  document.addEventListener('visibilitychange', onVisibilityChange)
  return () => {
    unsubscribe()
    document.removeEventListener('visibilitychange', onVisibilityChange)
    release()
  }
}
