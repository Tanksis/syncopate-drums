// The example exercises, built into the app and never stored (ADR 0008): originals in the style of
// a syncopation method book (never copied from one), each showing one part of the app.

import type { EditCommand } from './editor'
import type { Bar, Exercise, LibraryTab, PracticeSettings, Row } from './model'
import { BEATS_PER_BAR, MIN_SWING, TRIPLET_SWING, newExercise, restBar } from './model'
import { setBeat } from './speller'

/** One example as written here; everything else is a new exercise's default, the lead hand R among it. */
type Example = Pick<Exercise, 'id' | 'name' | 'sticking'> &
  Pick<PracticeSettings, 'bpm' | 'groove' | 'swing'> & {
    /** Each row bar by bar, as four beat figures' hits separated by spaces; a missing row rests. */
    rows: Partial<Record<Row, string[]>>
  }

/** Starts every example's id, so it can never match a stored exercise's UUID. */
const EXAMPLE_PREFIX = 'example:'

const EXAMPLES: readonly Example[] = [
  {
    id: `${EXAMPLE_PREFIX}syncopated-eighths`,
    name: 'Example: syncopated eighths',
    bpm: 80,
    groove: 'off',
    swing: MIN_SWING,
    sticking: 'natural',
    rows: { snare: ['x... x.x. x... x.x.', '..x. x... ..x. x...', 'x.x. ..x. x.x. ..x.', 'x... ..x. ..x. x...'] },
  },
  {
    id: `${EXAMPLE_PREFIX}jazz-comping`,
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
    id: `${EXAMPLE_PREFIX}rock-beat`,
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
    id: `${EXAMPLE_PREFIX}triplets`,
    name: 'Example: triplets',
    bpm: 70,
    groove: 'off',
    swing: MIN_SWING,
    sticking: 'alternate',
    rows: { snare: ['xxx xxx x.x x...', 'xxx .xx xxx x...'] },
  },
]

/** The example exercises, in order, under their fixed ids and never opened; every call gives an equal set. */
export function exampleExercises(): Exercise[] {
  return EXAMPLES.map(({ id, name, bpm, groove, swing, sticking, rows }) => {
    const base = newExercise({ id, now: 0 })
    return {
      ...base,
      name,
      bars: writeRows(rows),
      sticking,
      practice: { ...base.practice, bpm, groove, swing },
    }
  })
}

/** Whether an id is one of the examples', rather than a stored exercise's. */
export function isExample(id: string): boolean {
  return EXAMPLES.some((e) => e.id === id)
}

/** The sidebar tab that lists an exercise: Examples for an example, otherwise Library. */
export function tabListing(id: string): LibraryTab {
  return isExample(id) ? 'examples' : 'library'
}

/**
 * Which edit commands an example takes: those that move the cursor, select or copy bars, or change
 * mode. Every command that would change its bars, sticking, lead hand or overrides is refused, and
 * so are undo, redo and `.`, since it has no changes to go back over or repeat. A new command must
 * be listed here, so it can't slip past the read-only rule. (Practice settings aren't edit commands.)
 */
const EXAMPLE_ACCEPTS: Record<EditCommand['type'], boolean> = {
  move: true,
  moveTo: true,
  moveRow: true,
  jump: true,
  goToBar: true,
  moveWord: true,
  selectBars: true,
  copyBars: true,
  normal: true,
  insert: true,
  pending: true,
  enterFigure: false,
  toggleGridPosition: false,
  setHold: false,
  setBeatGrid: false,
  toggleTie: false,
  toggleCutShort: false,
  rest: false,
  addBar: false,
  openBar: false,
  duplicateBar: false,
  deleteBar: false,
  pasteBars: false,
  putBars: false,
  replaceBars: false,
  repeatChange: false,
  replaceBeats: false,
  setExerciseSettings: false,
  flipOverride: false,
  resetOverrides: false,
  undo: false,
  redo: false,
}

/** Whether an open example takes this edit command; a refused one leaves it as it is. */
export function exampleAccepts(command: EditCommand): boolean {
  return EXAMPLE_ACCEPTS[command.type]
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
