// The example exercises, built into the app and never stored (ADR 0008): originals in the style of
// a syncopation method book (never copied from one), each showing one part of the app.

import type { EditCommand } from './editor'
import type { Bar, Exercise, LibraryTab, PracticeSettings, Row, TimeSignature } from './model'
import { MIN_SWING, TRIPLET_SWING, meter, newExercise, restBar } from './model'
import { isRudiment, rudimentExercises } from './rudiments'
import { setBeat } from './speller'

/** One example as written here; everything else is a new exercise's default, the lead hand R among it. */
type Example = Pick<Exercise, 'id' | 'name' | 'sticking'> &
  Pick<PracticeSettings, 'bpm' | 'pattern' | 'swing'> &
  Partial<Pick<PracticeSettings, 'hihatFoot'>> & {
    /** 4/4 unless given. */
    timeSignature?: TimeSignature
    /** Each row bar by bar, as each beat figure's hits separated by spaces; a missing row rests. */
    rows: Partial<Record<Row, string[]>>
  }

/** Starts every example's id, so it can never match a stored exercise's UUID. */
const EXAMPLE_PREFIX = 'example:'

/** Starts every example's name, so a copy in the Library is easy to tell from its source. */
const EXAMPLE_NAME_PREFIX = 'Example: '

const EXAMPLES: readonly Example[] = [
  {
    id: `${EXAMPLE_PREFIX}syncopated-eighths`,
    name: `${EXAMPLE_NAME_PREFIX}syncopated eighths`,
    bpm: 80,
    pattern: 'off',
    swing: MIN_SWING,
    sticking: 'natural',
    rows: { snare: ['x... x.x. x... x.x.', '..x. x... ..x. x...', 'x.x. ..x. x.x. ..x.', 'x... ..x. ..x. x...'] },
  },
  {
    id: `${EXAMPLE_PREFIX}jazz-comping`,
    name: `${EXAMPLE_NAME_PREFIX}jazz comping`,
    bpm: 100,
    pattern: 'ride',
    hihatFoot: 'twoAndFour',
    swing: TRIPLET_SWING,
    sticking: 'off',
    rows: {
      snare: ['.... ..x. .... ....', 'x... .... ..x. ....', '..x. ..x. .... ....', '.... x... .... ..x.'],
      kick: ['.... .... .... ..x.', '.... ..x. .... ....', '.... .... x... ....', '..x. .... .... ....'],
    },
  },
  {
    id: `${EXAMPLE_PREFIX}rock-beat`,
    name: `${EXAMPLE_NAME_PREFIX}rock beat`,
    bpm: 90,
    pattern: 'hihatEighths',
    swing: MIN_SWING,
    sticking: 'off',
    rows: {
      snare: ['.... x... .... x...', '.... x... .... x...'],
      kick: ['x... .... x.x. ....', 'x... ...x ..x. ....'],
    },
  },
  {
    id: `${EXAMPLE_PREFIX}triplets`,
    name: `${EXAMPLE_NAME_PREFIX}triplets`,
    bpm: 70,
    pattern: 'off',
    swing: MIN_SWING,
    sticking: 'alternate',
    rows: { snare: ['xxx xxx x.x x...', 'xxx .xx xxx x...'] },
  },
  {
    id: `${EXAMPLE_PREFIX}slow-blues`,
    name: `${EXAMPLE_NAME_PREFIX}slow blues`,
    bpm: 50,
    pattern: 'slowBlues128',
    swing: MIN_SWING,
    sticking: 'off',
    timeSignature: '12/8',
    rows: {
      snare: ['... x.. ... x..'],
      kick: ['x.. ..x x.x ...'],
    },
  },
  {
    id: `${EXAMPLE_PREFIX}afro-cuban`,
    name: `${EXAMPLE_NAME_PREFIX}afro-cuban 6/8`,
    bpm: 72,
    pattern: 'bell68',
    swing: MIN_SWING,
    sticking: 'off',
    timeSignature: '6/8',
    rows: {
      snare: ['... x..', '..x x..'],
      kick: ['x.. ..x', 'x.. ...'],
    },
  },
]

/** The example exercises, in order, under their fixed ids and never opened; every call gives an equal set. */
export function exampleExercises(): Exercise[] {
  return EXAMPLES.map(({ id, name, bpm, pattern, hihatFoot = 'off', swing, sticking, timeSignature = '4/4', rows }) => {
    const base = newExercise({ id, now: 0 })
    return {
      ...base,
      name,
      timeSignature,
      bars: writeRows(rows, meter(timeSignature).beats),
      sticking,
      practice: { ...base.practice, bpm, pattern, hihatFoot, swing },
    }
  })
}

/** Whether an id is one of the examples', rather than a stored exercise's. */
export function isExample(id: string): boolean {
  return EXAMPLES.some((e) => e.id === id)
}

/**
 * Copy to Library: an ordinary exercise under a new id, opened now, named without the "Example: "
 * prefix, with the example's notes, sticking and practice settings as they are now (a slowed tempo
 * carries over), in the folder given.
 */
export function copyExample(
  example: Exercise,
  { id, now, folderId }: { id: string; now: number; folderId: string | null },
): Exercise {
  return { ...example, id, name: exampleTitle(example), lastOpened: now, folderId }
}

/** An example's name without the "Example: " prefix, as the Examples tab lists it. */
export function exampleTitle(example: Exercise): string {
  const { name } = example
  return name.startsWith(EXAMPLE_NAME_PREFIX) ? name.slice(EXAMPLE_NAME_PREFIX.length) : name
}

/** Whether an id is a built-in exercise's, an example's or a rudiment's: read-only and never stored. */
export function isBuiltIn(id: string): boolean {
  return isExample(id) || isRudiment(id)
}

/** The built-in exercises: the examples, then the rudiments. */
export function builtInExercises(): Exercise[] {
  return [...exampleExercises(), ...rudimentExercises()]
}

/** The sidebar tab that lists an exercise: Examples for an example, Rudiments for a rudiment, otherwise Library. */
export function tabListing(id: string): LibraryTab {
  return isExample(id) ? 'examples' : isRudiment(id) ? 'rudiments' : 'library'
}

/**
 * Which edit commands an example takes: those that move the cursor, or select or copy bars. Every
 * command that would change its bars, time signature, sticking, lead hand, overrides or marks is refused, and so are undo
 * and redo, since it has no changes to go back over. A new command must be listed here, so it can't
 * slip past the read-only rule. (Practice settings aren't edit commands.)
 */
const EXAMPLE_ACCEPTS: Record<EditCommand['type'], boolean> = {
  move: true,
  moveTo: true,
  moveRow: true,
  jump: true,
  selectBars: true,
  copyBars: true,
  toggleGridPosition: false,
  toggleMark: false,
  setHold: false,
  setBeatGrid: false,
  rest: false,
  restBeat: false,
  tieOverBarline: false,
  addBar: false,
  duplicateBar: false,
  deleteBar: false,
  pasteBars: false,
  fillPattern: false,
  kicksInGaps: false,
  setExerciseSettings: false,
  setTimeSignature: false,
  flipOverride: false,
  resetOverrides: false,
  undo: false,
  redo: false,
}

/** Whether an open example takes this edit command; a refused one leaves it as it is. */
export function exampleAccepts(command: EditCommand): boolean {
  return EXAMPLE_ACCEPTS[command.type]
}

/**
 * Whether an open built-in exercise takes this edit command: an example's rule, and a rudiment's,
 * which also takes a change of Lead hand alone, since it is practised leading with either hand
 * (ADR 0018). Its sticking mode stays put: the hands are the rudiment.
 */
export function builtInAccepts(id: string, command: EditCommand): boolean {
  if (isRudiment(id) && command.type === 'setExerciseSettings') return Object.keys(command.settings).every((key) => key === 'leadHand')
  return exampleAccepts(command)
}

/** The bars of `beats` beats, each beat written through the speller so the spelling is the app's own. */
function writeRows(rows: Example['rows'], beats: number): Bar[] {
  const barCount = Math.max(...Object.values(rows).map((bars) => bars.length))
  let bars: Bar[] = Array.from({ length: barCount }, () => restBar(beats))
  for (const [row, lines] of Object.entries(rows) as [Row, string[]][]) {
    lines.forEach((line, bar) => {
      line.split(' ').forEach((hits, beat) => (bars = setBeat(bars, row, bar, beat, hits)))
    })
  }
  return bars
}
