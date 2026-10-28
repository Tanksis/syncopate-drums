import { describe, expect, it } from 'vitest'
import { bestCleanBpm, newestFirst, withCleanRun, withoutCleanRun } from './cleanRuns'

/** Epoch milliseconds at a local time on a day of October 2026. */
const at = (day: number, hour = 12) => new Date(2026, 9, day, hour).getTime()

describe('clean runs', () => {
  it('log the BPM with when it was played', () => {
    expect(withCleanRun([], 96, at(3))).toEqual([{ bpm: 96, at: at(3) }])
    expect(withCleanRun([{ bpm: 96, at: at(3) }], 104, at(10))).toEqual([
      { bpm: 96, at: at(3) },
      { bpm: 104, at: at(10) },
    ])
  })

  it('keep one run a day at each BPM, the latest', () => {
    const runs = withCleanRun(withCleanRun([], 120, at(28, 9)), 120, at(28, 18))
    expect(runs).toEqual([{ bpm: 120, at: at(28, 18) }])
    expect(withCleanRun(runs, 120, at(29, 9))).toHaveLength(2)
    expect(withCleanRun(runs, 126, at(28, 19))).toHaveLength(2)
  })

  it('drop one logged by mistake', () => {
    const runs = [
      { bpm: 96, at: at(3) },
      { bpm: 104, at: at(10) },
    ]
    expect(withoutCleanRun(runs, at(10))).toEqual([{ bpm: 96, at: at(3) }])
    expect(withoutCleanRun(runs, at(11))).toEqual(runs)
  })

  it('have a best BPM, the fastest, and none before the first', () => {
    expect(bestCleanBpm([])).toBeUndefined()
    expect(bestCleanBpm(undefined)).toBeUndefined()
    expect(
      bestCleanBpm([
        { bpm: 104, at: at(10) },
        { bpm: 120, at: at(20) },
        { bpm: 112, at: at(28) },
      ]),
    ).toBe(120)
  })

  it('list newest first', () => {
    const runs = [
      { bpm: 104, at: at(10) },
      { bpm: 96, at: at(3) },
      { bpm: 120, at: at(28) },
    ]
    expect(newestFirst(runs).map((r) => r.bpm)).toEqual([120, 104, 96])
  })
})
