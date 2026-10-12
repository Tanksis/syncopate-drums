// Sticking patterns: a fill typed as hands, kicks and rests (`RLRK`, `RL.L`), laid on a bar's grid.

import type { Bar, Exercise, Hand, Item, Row } from './model'
import { BEATS_PER_BAR, ROWS, TICKS_PER_BEAT, itemTicks, restBar } from './model'
import { setBeat, slotTicks } from './speller'
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
 * `.` a rest in both, each note holding until the next hit in its row or the end of the beat. A tie
 * into the bar is undone, as there is nothing left to tie into.
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
  let bars = exercise.bars.map((b, i) => (i === bar ? restBar() : i === bar - 1 ? untieLast(b) : b))
  for (let beat = 0; beat < BEATS_PER_BAR; beat++) {
    const beatSteps = ticks.map(() => pattern[step++ % pattern.length])
    beatSteps.forEach((s, i) => {
      if (s === 'R' || s === 'L') typed.set(beat * TICKS_PER_BEAT + ticks[i], s)
    })
    const hits = (row: Row) => beatSteps.map((s) => ((row === 'kick' ? s === 'K' : s === 'R' || s === 'L') ? 'x' : '.')).join('')
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

/** A bar with each row's final note no longer tied over into the bar after. */
function untieLast(bar: Bar): Bar {
  const untie = (items: Item[]) => {
    const last = items.at(-1)
    return last?.kind === 'note' && last.tiedToNext ? [...items.slice(0, -1), { ...last, tiedToNext: false }] : items
  }
  return { snare: untie(bar.snare), kick: untie(bar.kick) }
}
