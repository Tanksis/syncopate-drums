// Sticking patterns: a fill typed as hands, kicks and rests (`RLRK`, `RL.L`), laid on a bar's grid.

import type { Bar, Exercise, Hand, Row } from './model'
import { BEATS_PER_BAR, ROWS, TICKS_PER_BEAT, itemTicks, newExercise, restBar } from './model'
import { setBeat, slotTicks, toggleHit, toggleTie } from './speller'
import { sticking } from './sticking'

/** One step of a pattern: a hand on the snare, a kick, or a rest in both rows. */
export type PatternStep = 'R' | 'L' | 'K' | '.'

/** The grid a pattern is laid on: four steps a beat, or three. */
export type PatternGrid = 'sixteenths' | 'triplets'

const STEPS: readonly string[] = ['R', 'L', 'K', '.']

/**
 * A typed pattern's steps, or why it can't be one. Case doesn't matter and whitespace is ignored;
 * any other character, or no steps at all, is refused.
 */
export function parsePattern(text: string): { steps: PatternStep[] } | { error: string } {
  const chars = [...text.replace(/\s/g, '').toUpperCase()]
  const wrong = chars.find((c) => !STEPS.includes(c))
  if (wrong) return { error: `Use only R, L, K and . (not ${wrong})` }
  if (chars.length === 0) return { error: 'Type a pattern, such as RLRK' }
  return { steps: chars as PatternStep[] }
}

/**
 * The exercise with a bar replaced, in both rows, by a pattern repeated from step `from` (0, the
 * pattern's start, by default) on every beat's grid: R and L on the snare row, K on the kick row,
 * `.` a rest in both, each note holding until the next hit in its row or the end of the beat. Ties
 * into and out of the bar are cut (see `cutTies`).
 *
 * Sticking off becomes natural, and each hand that the sticking would give otherwise is written as
 * an override, so the typed hands are the ones shown. `next` is the step the following bar would
 * start on, to carry the pattern on across barlines.
 */
export function withPattern(
  exercise: Exercise,
  bar: number,
  pattern: readonly PatternStep[],
  grid: PatternGrid,
  from = 0,
): { exercise: Exercise; next: number } {
  const ticks = slotTicks(grid === 'triplets')
  const typed = new Map<number, Hand>()
  let step = from
  let bars = cutTies(exercise.bars, bar).map((b, i) => (i === bar ? restBar() : b))
  for (let beat = 0; beat < BEATS_PER_BAR; beat++) {
    const beatSteps = ticks.map(() => pattern[step++ % pattern.length])
    beatSteps.forEach((s, i) => {
      if (s === 'R' || s === 'L') typed.set(beat * TICKS_PER_BEAT + ticks[i], s)
    })
    const hits = (row: Row) => beatSteps.map((s) => (rowOf(s) === row ? 'x' : '.')).join('')
    bars = ROWS.reduce((written, row) => setBeat(written, row, bar, beat, hits(row)), bars)
  }
  const filled = { ...exercise, bars, sticking: exercise.sticking === 'off' ? 'natural' : exercise.sticking }
  const computed = new Map(
    sticking(filled).flatMap((n) => (n.row === 'snare' && n.bar === bar && n.computed ? [[n.start, n.computed]] : [])),
  )
  let tick = 0
  const snare = bars[bar].snare.map((item) => {
    const at = tick
    tick += itemTicks(item)
    const hand = typed.get(at)
    return item.kind === 'note' && hand && computed.get(at) !== hand ? { ...item, override: hand } : item
  })
  bars = bars.map((b, i) => (i === bar ? { ...b, snare } : b))
  return { exercise: { ...filled, bars }, next: step % pattern.length }
}

/**
 * A new exercise of `bars` bars filled with a typed pattern, carried on across them (each bar
 * starts where the one before stopped) and named after it, upper case with its spaces tidied. It
 * has natural sticking and the usual new-exercise defaults otherwise. The pattern must parse.
 */
export function exerciseFromPattern({
  id,
  now,
  folderId,
  pattern,
  grid,
  bars,
}: {
  id: string
  now: number
  folderId: string | null
  pattern: string
  grid: PatternGrid
  bars: number
}): Exercise {
  const parsed = parsePattern(pattern)
  if ('error' in parsed) throw new Error(parsed.error)
  const name = pattern.trim().replace(/\s+/g, ' ').toUpperCase()
  let exercise: Exercise = {
    ...newExercise({ id, now, folderId }),
    name,
    sticking: 'natural',
    bars: Array.from({ length: bars }, restBar),
  }
  let from = 0
  for (let bar = 0; bar < bars; bar++) ({ exercise, next: from } = withPattern(exercise, bar, parsed.steps, grid, from))
  return exercise
}

/** The row a step strikes: hands on the snare, K on the kick; a rest strikes neither. */
const rowOf = (step: PatternStep): Row | null => (step === 'K' ? 'kick' : step === '.' ? null : 'snare')

/**
 * The bars with no tie into or out of a bar about to be replaced: a tie into it is undone, and a
 * note tied over out of it becomes a rest, as a removed hit's tied continuation does.
 */
function cutTies(bars: Bar[], bar: number): Bar[] {
  const tiedOver = (b: number, row: Row) => {
    const last = bars[b]?.[row].at(-1)
    return last?.kind === 'note' && last.tiedToNext
  }
  return ROWS.reduce((cut, row) => {
    const untied = tiedOver(bar - 1, row) ? toggleTie(cut, row, bar, 0) : cut
    return tiedOver(bar, row) ? toggleHit(toggleTie(untied, row, bar + 1, 0), row, bar + 1, 0, 0) : untied
  }, bars)
}
