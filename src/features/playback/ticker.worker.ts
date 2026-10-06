// A steady timer for the playback scheduler. Worker timers keep running when the main
// thread is busy or the tab is in the background, where page timers get throttled.

const TICK_MS = 25

let timer: ReturnType<typeof setInterval> | undefined

onmessage = (e: MessageEvent<'start' | 'stop'>) => {
  clearInterval(timer)
  if (e.data === 'start') timer = setInterval(() => postMessage('tick'), TICK_MS)
}
