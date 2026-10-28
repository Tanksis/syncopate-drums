// Clean runs: the tempos a drummer has played an exercise cleanly at, and when.

/** A tempo an exercise was played cleanly at, and when it was logged. */
export interface CleanRun {
  bpm: number
  /** Epoch milliseconds. */
  at: number
}

const sameDay = (a: number, b: number) => new Date(a).toDateString() === new Date(b).toDateString()

/**
 * The runs with one more at `bpm`, logged `now`. A day keeps one run at each BPM, so a second tap
 * the same day moves it to the later time rather than logging it twice.
 */
export function withCleanRun(runs: readonly CleanRun[], bpm: number, now: number): CleanRun[] {
  return [...runs.filter((run) => run.bpm !== bpm || !sameDay(run.at, now)), { bpm, at: now }]
}

/** The runs without the one logged at `at`, logged by mistake. */
export function withoutCleanRun(runs: readonly CleanRun[], at: number): CleanRun[] {
  return runs.filter((run) => run.at !== at)
}

/** The fastest tempo played cleanly, or undefined before the first run. */
export function bestCleanBpm(runs: readonly CleanRun[] | undefined): number | undefined {
  return runs?.length ? Math.max(...runs.map((run) => run.bpm)) : undefined
}

/** The runs as a history lists them, the latest first. */
export function newestFirst(runs: readonly CleanRun[]): CleanRun[] {
  return [...runs].sort((a, b) => b.at - a.at)
}
