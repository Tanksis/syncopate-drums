// The example exercises a first launch opens with: originals in the style of a syncopation method
// book (never copied from one), each showing one part of the app.

import type { Bar, Exercise, PracticeSettings, Row } from './model'
import { BEATS_PER_BAR, MIN_SWING, TRIPLET_SWING, newExercise, restBar } from './model'
import { setBeat } from './speller'

/** One example as written here; everything else is a new exercise's default, the lead hand R among it. */
type Example = Pick<Exercise, 'name' | 'sticking'> &
  Pick<PracticeSettings, 'bpm' | 'groove' | 'swing'> & {
    /** Each row bar by bar, as four beat figures' hits separated by spaces; a missing row rests. */
    rows: Partial<Record<Row, string[]>>
  }

const EXAMPLES: readonly Example[] = [
  {
    name: 'Example: syncopated eighths',
    bpm: 80,
    groove: 'off',
    swing: MIN_SWING,
    sticking: 'natural',
    rows: { snare: ['x... x.x. x... x.x.', '..x. x... ..x. x...', 'x.x. ..x. x.x. ..x.', 'x... ..x. ..x. x...'] },
  },
  {
    name: 'Example: jazz comping',
    bpm: 100,
    groove: 'jazz',
    swing: TRIPLET_SWING,
    sticking: 'off',
    rows: {
      snare: ['.... ..x. .... ....', 'x... .... ..x. ....', '..x. ..x. .... ....', '.... x... .... ..x.'],
      kick: ['.... .... .... ..x.', '.... ..x. .... ....', '.... .... x... ....', '..x. .... .... ....'],
    },
  },
  {
    name: 'Example: rock beat',
    bpm: 90,
    groove: 'hihatEighths',
    swing: MIN_SWING,
    sticking: 'off',
    rows: {
      snare: ['.... x... .... x...', '.... x... .... x...'],
      kick: ['x... .... x.x. ....', 'x... ...x ..x. ....'],
    },
  },
  {
    name: 'Example: triplets',
    bpm: 70,
    groove: 'off',
    swing: MIN_SWING,
    sticking: 'alternate',
    rows: { snare: ['xxx xxx x.x x...', 'xxx .xx xxx x...'] },
  },
]

/** The example exercises, in order, each under a new id; every call makes a fresh set. */
export function exampleExercises({ newId, now }: { newId: () => string; now: number }): Exercise[] {
  return EXAMPLES.map(({ name, bpm, groove, swing, sticking, rows }) => {
    const base = newExercise({ id: newId(), now })
    return {
      ...base,
      name,
      bars: writeRows(rows),
      sticking,
      practice: { ...base.practice, bpm, groove, swing },
    }
  })
}

/** The bars, each beat written through the speller so the spelling is the app's own. */
function writeRows(rows: Example['rows']): Bar[] {
  const barCount = Math.max(...Object.values(rows).map((bars) => bars.length))
  let bars: Bar[] = Array.from({ length: barCount }, restBar)
  for (const [row, lines] of Object.entries(rows) as [Row, string[]][]) {
    lines.forEach((line, bar) => {
      const beats = line.split(' ')
      for (let beat = 0; beat < BEATS_PER_BAR; beat++) bars = setBeat(bars, row, bar, beat, beats[beat])
    })
  }
  return bars
}
