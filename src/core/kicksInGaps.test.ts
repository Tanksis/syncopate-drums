import { describe, expect, it } from 'vitest'
import type { EditorState, PatternGrid, Row } from './index'
import { applyEdit, editorBeatViews, newEditorState, newExercise, parsePattern, restBar } from './index'

/** An editor on a new exercise of `bars` bars of rests. */
const editor = (bars = 1) => {
  const ex = newExercise({ id: 'e1', now: 0 })
  return newEditorState({ ...ex, bars: Array.from({ length: bars }, restBar) })
}

const fill = (state: EditorState, text: string, grid: PatternGrid = 'sixteenths', bar = 0) => {
  const parsed = parsePattern(text)
  if ('error' in parsed) throw new Error(parsed.error)
  return applyEdit(state, { type: 'fillPattern', bar, pattern: parsed.steps, grid })
}

/** A row's hits in each beat of a bar, as the editor shows its grid. */
const hits = (state: EditorState, row: Row, bar = 0) =>
  editorBeatViews(state)[bar].map((v) => v[row].positions.map((p) => (p === 'hit' ? 'x' : '.')).join(''))

describe('kicks in the gaps', () => {
  it('turns the gaps of a GRID line into kicks, leaving the snare row as it was', () => {
    const grid = fill(editor(), 'RLRL RL.L RLR. RLRL')
    const state = applyEdit(grid, { type: 'kicksInGaps', bars: 0 })
    expect(hits(state, 'snare')).toEqual(['xxxx', 'xx.x', 'xxx.', 'xxxx'])
    expect(hits(state, 'kick')).toEqual(['....', '..x.', '...x', '....'])
  })

  it('cuts a hold short where it covers a gap', () => {
    const state = applyEdit(fill(editor(), 'R...'), { type: 'kicksInGaps', bars: 0 })
    const beat = editorBeatViews(state)[0][0]
    expect(beat.snare.positions).toEqual(['hit', 'empty', 'empty', 'empty'])
    expect(beat.kick.positions).toEqual(['empty', 'hit', 'hit', 'hit'])
  })

  it('cuts a kick held over a gap short and strikes it again there', () => {
    const state = applyEdit(fill(editor(), 'K...'), { type: 'kicksInGaps', bars: 0 })
    expect(hits(state, 'kick')).toEqual(['xxxx', 'xxxx', 'xxxx', 'xxxx'])
  })

  it('fills an empty beat with four sixteenth kicks', () => {
    const state = applyEdit(editor(), { type: 'kicksInGaps', bars: 0 })
    expect(editorBeatViews(state)[0].map((v) => v.triplet)).toEqual([false, false, false, false])
    expect(hits(state, 'kick')).toEqual(['xxxx', 'xxxx', 'xxxx', 'xxxx'])
  })

  it('puts kicks on the empty triplet positions of a triplet beat', () => {
    const state = applyEdit(fill(editor(), 'RL.', 'triplets'), { type: 'kicksInGaps', bars: 0 })
    expect(editorBeatViews(state)[0].map((v) => v.triplet)).toEqual([true, true, true, true])
    expect(hits(state, 'snare')).toEqual(['xx.', 'xx.', 'xx.', 'xx.'])
    expect(hits(state, 'kick')).toEqual(['..x', '..x', '..x', '..x'])
  })

  it('follows a beat switched to triplets before it has any hits', () => {
    const switched = applyEdit(editor(), { type: 'setBeatGrid', bar: 0, beat: 1, triplet: true })
    const state = applyEdit(switched, { type: 'kicksInGaps', bars: 0 })
    expect(hits(state, 'kick')).toEqual(['xxxx', 'xxx', 'xxxx', 'xxxx'])
  })

  it('leaves the sticking mode and the overrides as they were', () => {
    const filled = fill(editor(), 'RLRL RL.L RLR. RLRL')
    const flipped = applyEdit(filled, { type: 'flipOverride', note: { id: '0:0' } })
    const off = applyEdit(flipped, { type: 'setExerciseSettings', settings: { sticking: 'off' } })
    const state = applyEdit(off, { type: 'kicksInGaps', bars: 0 })
    expect(state.exercise.sticking).toBe('off')
    const overrides = (s: EditorState) => s.exercise.bars[0].snare.flatMap((item) => (item.kind === 'note' && item.override ? [item.override] : []))
    expect(overrides(state)).toEqual(overrides(off))
    expect(overrides(state)).toEqual(['L'])
  })

  it('is one undo step', () => {
    const filled = fill(editor(), 'RL.L')
    const state = applyEdit(applyEdit(filled, { type: 'kicksInGaps', bars: 0 }), { type: 'undo' })
    expect(state.exercise.bars).toBe(filled.exercise.bars)
  })

  it('does every bar at once', () => {
    const filled = fill(fill(editor(2), 'RL.L'), 'R.LR', 'sixteenths', 1)
    const state = applyEdit(filled, { type: 'kicksInGaps', bars: 'all' })
    expect(hits(state, 'kick', 0)).toEqual(['..x.', '..x.', '..x.', '..x.'])
    expect(hits(state, 'kick', 1)).toEqual(['.x..', '.x..', '.x..', '.x..'])
    expect(applyEdit(state, { type: 'undo' }).exercise.bars).toBe(filled.exercise.bars)
  })
})
