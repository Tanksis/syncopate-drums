import { describe, expect, it } from 'vitest'
import type { EditorState, Exercise, PatternGrid, PatternStep, Row } from './index'
import { applyEdit, editorBeatViews, exerciseFromPattern, newEditorState, newExercise, parsePattern, restBar, setBeat, sticking, toggleTie } from './index'

describe('parsing a sticking pattern', () => {
  it('reads R, L, K and . in any case, ignoring whitespace', () => {
    expect(parsePattern('rlrk rlkk')).toEqual({ steps: ['R', 'L', 'R', 'K', 'R', 'L', 'K', 'K'] })
    expect(parsePattern(' R l.\tK ')).toEqual({ steps: ['R', 'L', '.', 'K'] })
  })

  it('refuses any other character, naming it', () => {
    expect(parsePattern('RLX')).toEqual({ error: 'Use only R, L, K and . (not X)' })
  })

  it('refuses a pattern with no steps', () => {
    expect(parsePattern('  ')).toEqual({ error: 'Type a pattern, such as RLRK' })
  })
})

/** An editor on a new exercise of `bars` bars of rests. */
const editor = (bars = 1) => {
  const ex = newExercise({ id: 'e1', now: 0 })
  return newEditorState({ ...ex, bars: Array.from({ length: bars }, restBar) })
}

const steps = (text: string): PatternStep[] => {
  const parsed = parsePattern(text)
  if ('error' in parsed) throw new Error(parsed.error)
  return parsed.steps
}

const fill = (state: EditorState, text: string, grid: PatternGrid = 'sixteenths', bar = 0) =>
  applyEdit(state, { type: 'fillPattern', bar, pattern: steps(text), grid })

/** A row's hits in each beat of a bar, as the editor shows its grid. */
const hits = (state: EditorState, row: Row, bar = 0) =>
  editorBeatViews(state)[bar].map((v) => v[row].positions.map((p) => (p === 'hit' ? 'x' : '.')).join(''))

/** The sticking line of a bar, with `-` for a note that shows none. */
const line = (state: EditorState, bar = 0) =>
  sticking(state.exercise)
    .filter((n) => n.bar === bar)
    .map((n) => n.shown ?? '-')
    .join('')

describe('filling a bar with a pattern', () => {
  it('lays the steps on every beat in order: hands on the snare, K on the kick', () => {
    const state = fill(editor(), 'RLKK')
    expect(hits(state, 'snare')).toEqual(['xx..', 'xx..', 'xx..', 'xx..'])
    expect(hits(state, 'kick')).toEqual(['..xx', '..xx', '..xx', '..xx'])
    expect(line(state)).toBe('RLKK'.repeat(4))
  })

  it('carries a pattern of any length on across beats: RLK starts beat 2 on L', () => {
    const state = fill(editor(), 'RLK')
    expect(hits(state, 'snare')).toEqual(['xx.x', 'x.xx', '.xx.', 'xx.x'])
    expect(line(state)).toBe('RLKRLKRLKRLKRLKR')
  })

  it('rests both rows on a .', () => {
    const state = fill(editor(), 'RL.L')
    expect(hits(state, 'snare')).toEqual(['xx.x', 'xx.x', 'xx.x', 'xx.x'])
    expect(hits(state, 'kick')).toEqual(['....', '....', '....', '....'])
  })

  it('holds each note until the next hit in its row or the end of the beat', () => {
    const state = fill(editor(), 'R...')
    expect(editorBeatViews(state)[0][0].snare.positions).toEqual(['hit', 'hold', 'hold', 'hold'])
  })

  it('puts every beat on the triplet grid for triplets', () => {
    const state = fill(editor(), 'RLK', 'triplets')
    expect(editorBeatViews(state)[0].map((v) => v.triplet)).toEqual([true, true, true, true])
    expect(hits(state, 'snare')).toEqual(['xx.', 'xx.', 'xx.', 'xx.'])
    expect(hits(state, 'kick')).toEqual(['..x', '..x', '..x', '..x'])
  })

  it('keeps a triplet beat on the triplet grid where it would read the same on either', () => {
    const state = fill(editor(), 'R..', 'triplets')
    expect(editorBeatViews(state)[0].map((v) => v.triplet)).toEqual([true, true, true, true])
    expect(hits(state, 'snare')).toEqual(['x..', 'x..', 'x..', 'x..'])
  })

  it('replaces both rows of only that bar, and moves the cursor to it', () => {
    let state = fill(editor(2), 'KKKK', 'sixteenths', 1)
    state = fill(state, 'RLRL', 'sixteenths', 1)
    expect(hits(state, 'kick', 1)).toEqual(['....', '....', '....', '....'])
    expect(hits(state, 'snare', 0)).toEqual(['....', '....', '....', '....'])
    expect(state.cursor).toEqual({ bar: 1, beat: 0, row: 'snare' })
  })

  it('unties a tie into the bar, and rests a note that was tied over out of it', () => {
    // Bar 1's last quarter tied into bar 2's first, and bar 2's last into bar 3's first.
    let bars = Array.from({ length: 3 }, restBar)
    for (const [bar, beat] of [[0, 3], [1, 0], [1, 3], [2, 0]]) bars = setBeat(bars, 'snare', bar, beat, 'x...')
    bars = toggleTie(toggleTie(bars, 'snare', 1, 0), 'snare', 2, 0)
    const state = fill({ ...editor(), exercise: { ...editor().exercise, bars } }, 'KKKK', 'sixteenths', 1)
    expect(hits(state, 'snare', 0)).toEqual(['....', '....', '....', 'x...'])
    expect(hits(state, 'snare', 2)).toEqual(['....', '....', '....', '....'])
    expect(sticking(state.exercise).filter((n) => n.row === 'snare')).toHaveLength(1)
  })

  it('is one undo step', () => {
    const before = editor()
    const undone = applyEdit(fill(before, 'RLRK'), { type: 'undo' })
    expect(undone.exercise.bars).toEqual(before.exercise.bars)
    expect(undone.exercise.sticking).toBe('off')
  })
})

describe("a fill's sticking", () => {
  it('turns sticking off into natural', () => {
    const state = fill(editor(), 'RLRK')
    expect(state.exercise.sticking).toBe('natural')
  })

  it('writes no overrides where natural sticking already gives the typed hands', () => {
    const state = fill(editor(), 'RLKK')
    expect(sticking(state.exercise).filter((n) => n.override)).toEqual([])
  })

  it('overrides the hands that differ from the computed ones, so the typed ones show', () => {
    const state = fill(editor(), 'RRLL')
    expect(line(state)).toBe('RRLL'.repeat(4))
    expect(sticking(state.exercise).filter((n) => n.override).map((n) => n.override)).toEqual(['R', 'L', 'R', 'L', 'R', 'L', 'R', 'L'])
  })

  it('shows the typed hands under alternate sticking and a left lead too', () => {
    let state = applyEdit(editor(), { type: 'setExerciseSettings', settings: { sticking: 'alternate', leadHand: 'L' } })
    state = fill(state, 'RL.LRLRK')
    expect(state.exercise.sticking).toBe('alternate')
    expect(line(state)).toBe('RLLRLRK'.repeat(2))
  })
})

describe('a new exercise from a pattern', () => {
  const made = (pattern: string, grid: PatternGrid = 'sixteenths', bars = 4) =>
    exerciseFromPattern({ id: 'p1', now: 5, folderId: 'f1', pattern, grid, bars })
  const barLine = (exercise: Exercise, bar: number) =>
    sticking(exercise)
      .filter((n) => n.bar === bar)
      .map((n) => n.shown ?? '-')
      .join('')

  it('carries the pattern on across its bars: RLK over 2 bars starts bar 2 where bar 1 stopped', () => {
    const exercise = made('RLK', 'sixteenths', 2)
    expect(exercise.bars).toHaveLength(2)
    expect(barLine(exercise, 0)).toBe('RLKRLKRLKRLKRLKR')
    expect(barLine(exercise, 1)).toBe('LKRLKRLKRLKRLKRL')
  })

  it('lays it on triplets too', () => {
    const exercise = made('RLKK', 'triplets', 2)
    expect(barLine(exercise, 0)).toBe('RLKKRLKKRLKK')
    expect(barLine(exercise, 1)).toBe('RLKKRLKKRLKK')
    expect(editorBeatViews(newEditorState(exercise))[1].map((v) => v.triplet)).toEqual([true, true, true, true])
  })

  it('is named after the pattern as typed, with its spaces tidied', () => {
    expect(made('  rlrk   rlkk ').name).toBe('RLRK RLKK')
  })

  it('uses natural sticking and the usual new-exercise defaults otherwise', () => {
    const exercise = made('RLKK')
    const blank = newExercise({ id: 'p1', now: 5, folderId: 'f1' })
    expect(exercise.sticking).toBe('natural')
    expect(exercise.bars).toHaveLength(4)
    expect({ ...exercise, bars: blank.bars, name: blank.name, sticking: blank.sticking }).toEqual(blank)
  })
})

/** The sticking overrides on a bar's snare notes, in order. */
const overrides = (state: EditorState, bar = 0) =>
  state.exercise.bars[bar].snare.flatMap((item) => (item.kind === 'note' && item.override ? [item.override] : []))

describe('kicks in the gaps', () => {
  it('turns the gaps of a GRID line into kicks, leaving the snare row as it was', () => {
    const grid = fill(editor(), 'RLRL RL.L RLR. RLRL')
    const state = applyEdit(grid, { type: 'kicksInGaps', bar: 0 })
    expect(hits(state, 'snare')).toEqual(['xxxx', 'xx.x', 'xxx.', 'xxxx'])
    expect(hits(state, 'kick')).toEqual(['....', '..x.', '...x', '....'])
  })

  it('cuts a hold short where it covers a gap', () => {
    const state = applyEdit(fill(editor(), 'R...'), { type: 'kicksInGaps', bar: 0 })
    const beat = editorBeatViews(state)[0][0]
    expect(beat.snare.positions).toEqual(['hit', 'empty', 'empty', 'empty'])
    expect(beat.kick.positions).toEqual(['empty', 'hit', 'hit', 'hit'])
  })

  it('leaves the next bar sounding where a hold tied over the barline is cut short', () => {
    const tied = applyEdit(fill(fill(editor(2), 'R...'), 'R...', 'sixteenths', 1), { type: 'tieOverBarline', bar: 1, row: 'snare' })
    expect(editorBeatViews(tied)[1][0].snare.positions).toEqual(['hold', 'hold', 'hold', 'hold'])
    const state = applyEdit(tied, { type: 'kicksInGaps', bar: 0 })
    expect(editorBeatViews(state)[1][0].snare.positions).toEqual(['hit', 'hold', 'hold', 'hold'])
    expect(hits(state, 'kick', 1)).toEqual(['....', '....', '....', '....'])
  })

  it('cuts a kick held over a gap short and strikes it again there', () => {
    const state = applyEdit(fill(editor(), 'K...'), { type: 'kicksInGaps', bar: 0 })
    expect(hits(state, 'kick')).toEqual(['xxxx', 'xxxx', 'xxxx', 'xxxx'])
  })

  it('fills an empty beat with four sixteenth kicks', () => {
    const state = applyEdit(editor(), { type: 'kicksInGaps', bar: 0 })
    expect(editorBeatViews(state)[0].map((v) => v.triplet)).toEqual([false, false, false, false])
    expect(hits(state, 'kick')).toEqual(['xxxx', 'xxxx', 'xxxx', 'xxxx'])
  })

  it('puts kicks on the empty triplet positions of a triplet beat', () => {
    const state = applyEdit(fill(editor(), 'RL.', 'triplets'), { type: 'kicksInGaps', bar: 0 })
    expect(editorBeatViews(state)[0].map((v) => v.triplet)).toEqual([true, true, true, true])
    expect(hits(state, 'snare')).toEqual(['xx.', 'xx.', 'xx.', 'xx.'])
    expect(hits(state, 'kick')).toEqual(['..x', '..x', '..x', '..x'])
  })

  it('follows a beat switched to triplets before it has any hits', () => {
    const switched = applyEdit(editor(), { type: 'setBeatGrid', bar: 0, beat: 1, triplet: true })
    const state = applyEdit(switched, { type: 'kicksInGaps', bar: 0 })
    expect(hits(state, 'kick')).toEqual(['xxxx', 'xxx', 'xxxx', 'xxxx'])
  })

  it('leaves the sticking mode and the overrides as they were', () => {
    const filled = fill(editor(), 'RLRL RL.L RLR. RLRL')
    const flipped = applyEdit(filled, { type: 'flipOverride', note: { id: '0:0' } })
    const off = applyEdit(flipped, { type: 'setExerciseSettings', settings: { sticking: 'off' } })
    const state = applyEdit(off, { type: 'kicksInGaps', bar: 0 })
    expect(state.exercise.sticking).toBe('off')
    expect(overrides(state)).toEqual(overrides(off))
    expect(overrides(state)).toEqual(['L'])
  })

  it('is one undo step', () => {
    const filled = fill(editor(), 'RL.L')
    const state = applyEdit(applyEdit(filled, { type: 'kicksInGaps', bar: 0 }), { type: 'undo' })
    expect(state.exercise.bars).toBe(filled.exercise.bars)
  })

  it('does every bar at once', () => {
    const filled = fill(fill(editor(2), 'RL.L'), 'R.LR', 'sixteenths', 1)
    const state = applyEdit(filled, { type: 'kicksInGaps', bar: 'all' })
    expect(hits(state, 'kick', 0)).toEqual(['..x.', '..x.', '..x.', '..x.'])
    expect(hits(state, 'kick', 1)).toEqual(['.x..', '.x..', '.x..', '.x..'])
    expect(applyEdit(state, { type: 'undo' }).exercise.bars).toBe(filled.exercise.bars)
  })
})
