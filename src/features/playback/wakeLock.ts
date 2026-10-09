// Keeping the screen awake for a phone on the music stand: a screen wake lock is held while
// playback runs and for a minute after it stops or pauses, then released so the screen may sleep.
// The browser drops the lock when the page is hidden, so it's requested again on return while
// playing or within that minute. Where the API is missing, or the browser refuses, the screen
// simply sleeps as usual.

import { useAppStore } from '@/app/store'

/** How long the screen stays awake after playback stops or pauses. */
const LINGER_MS = 60_000

/** Holds a screen wake lock while playing and for a minute after. Call it once at launch. */
export function keepAwakeWhilePlaying(): void {
  let sentinel: WakeLockSentinel | undefined
  let requesting = false
  /** Set while the minute after playback stops or pauses runs. */
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
        if (!awake()) release()
      })
      .catch(() => {}) // refused (low battery, no permission): the screen sleeps as usual
      .finally(() => (requesting = false))
  }

  function release(): void {
    sentinel?.release().catch(() => {})
    sentinel = undefined
  }

  /** Whether the screen should be kept awake: playing, or within the minute after. */
  function awake(): boolean {
    return useAppStore.getState().playing || releaseTimer !== undefined
  }

  useAppStore.subscribe((state, previous) => {
    if (state.playing === previous.playing) return
    clearTimeout(releaseTimer)
    releaseTimer = undefined
    if (state.playing) acquire()
    else
      releaseTimer = setTimeout(() => {
        releaseTimer = undefined
        release()
      }, LINGER_MS)
  })
  // The browser drops the lock while the page is hidden; take it again on return.
  document.addEventListener('visibilitychange', () => {
    if (awake()) acquire()
  })
}
