import { describe, expect, it } from 'vitest'
import type { Duration, EditorState, TimeSignature } from './index'
import {
  DEFAULT_DEVICE_SETTINGS,
  TRIPLET_SWING,
  applyEdit,
  compoundValue,
  editorBeatViews,
  grooveOptions,
  hihatFootOptions,
  newEditorState,
  newExercise,
  parseImport,
  placeItems,
  schedule,
  setBeat,
  staffParts,
  sticking,
  withGroove,
} from './index'

const fresh = () => newEditorState(newExercise({ id: 'e1', now: 0 }))
const inTime = (timeSignature: TimeSignature, state = fresh()) => applyEdit(state, { type: 'setTimeSignature', timeSignature })

/** Each bar's beats as the editor shows them, one hits string per beat, joined by spaces. */
const grid = (state: EditorState, row: 'snare' | 'kick' = 'snare') =>
  editorBeatViews(state).map((bar) => bar.map((beat) => beat[row].hits).join(' '))

/** The ticks the snare row's notes are struck at, as stored. */
const struckAt = (state: EditorState) =>
  placeItems(state.exercise.bars, 'snare')
    .filter((p) => p.item.kind === 'note' && !p.continuation)
    .map((p) => p.start)

describe('compound time in the editor', () => {
  it('gives a bar of 6/8 two beats of three eighths, and 12/8 four', () => {
    expect(grid(inTime('6/8'))).toEqual(['... ...'])
    expect(grid(inTime('12/8'))).toEqual(['... ... ... ...'])
  })
})

describe('editing in compound time', () => {
  it('puts a click on the second eighth of a 6/8 beat on the triplet grid', () => {
    const clicked = applyEdit(inTime('6/8'), { type: 'toggleGridPosition', row: 'snare', bar: 0, beat: 0, position: 1 })
    expect(grid(clicked)).toEqual(['.x. ...'])
    expect(placeItems(clicked.exercise.bars, 'snare').filter((p) => p.item.kind === 'note').map((p) => p.start)).toEqual([4])
  })

  it('has no grid switch in compound time', () => {
    const state = inTime('6/8')
    expect(applyEdit(state, { type: 'setBeatGrid', bar: 0, beat: 0, triplet: false })).toBe(state)
  })

  it('lays a pattern on the eighths in 12/8', () => {
    const filled = applyEdit(inTime('12/8'), { type: 'fillPattern', bar: 0, pattern: ['R', 'L', 'K'], grid: 'sixteenths' })
    expect(grid(filled)).toEqual(['xx. xx. xx. xx.'])
    expect(grid(filled, 'kick')).toEqual(['..x ..x ..x ..x'])
  })
})

describe('moving between simple and compound time', () => {
  /** A 4/4 bar written beat by beat in the snare row. */
  const written = (...beats: string[]) => {
    const state = fresh()
    const bars = beats.reduce((b, hits, beat) => setBeat(b, 'snare', 0, beat, hits), state.exercise.bars)
    return { ...state, exercise: { ...state.exercise, bars } }
  }

  it('keeps a triplet beat and clears a straight one to its downbeat going to 12/8', () => {
    const changed = inTime('12/8', written('xxx', 'x.x.', '.x..', 'x...'))
    expect(grid(changed)).toEqual(['xxx x.. ... x..'])
    const struck = placeItems(changed.exercise.bars, 'snare').filter((p) => p.item.kind === 'note').map((p) => p.start)
    expect(struck).toEqual([0, 4, 8, 12, 36])
  })

  it('keeps a straight beat and clears a triplet one to its downbeat going back to 4/4', () => {
    const in68 = inTime('6/8')
    const bars = setBeat(setBeat(in68.exercise.bars, 'snare', 0, 0, 'x.x'), 'snare', 0, 1, '.xx')
    const changed = inTime('4/4', { ...in68, exercise: { ...in68.exercise, bars } })
    expect(grid(changed)).toEqual(['x... .... .... ....'])
  })

  it('turns off a groove and a hi-hat foot that compound time has no place for, and undo brings them back', () => {
    const state = fresh()
    const practice = { ...state.exercise.practice, groove: 'jazz' as const, hihatFoot: 'ands' as const }
    const changed = inTime('6/8', { ...state, exercise: { ...state.exercise, practice } })
    expect(changed.exercise.practice).toMatchObject({ groove: 'off', hihatFoot: 'off' })
    expect(applyEdit(changed, { type: 'undo' }).exercise.practice).toMatchObject({ groove: 'jazz', hihatFoot: 'ands' })
  })

  it('keeps triplet beats between two simple time signatures', () => {
    expect(grid(inTime('3/4', written('xxx', 'x.x.')))).toEqual(['xxx x.x. ....'])
  })

  it('pastes a bar copied in 4/4 into 6/8 on the triplet grid, keeping only its downbeats', () => {
    const copied = applyEdit(written('xxxx', '.x.x'), { type: 'copyBars' })
    const pasted = applyEdit(inTime('6/8', copied), { type: 'pasteBars' })
    expect(grid(pasted)).toEqual(['x.. ...'])
    expect(struckAt(pasted)).toEqual([0])
  })

  it('pastes a bar copied in 6/8 into 4/4 keeping only its downbeats, and one copied in 3/4 as it is', () => {
    const in68 = inTime('6/8')
    const bars = setBeat(setBeat(in68.exercise.bars, 'snare', 0, 0, 'xxx'), 'snare', 0, 1, '.x.')
    const copied = applyEdit({ ...in68, exercise: { ...in68.exercise, bars } }, { type: 'copyBars' })
    expect(grid(applyEdit(inTime('4/4', copied), { type: 'pasteBars' }))).toEqual(['x... .... .... ....'])
    const copied34 = applyEdit(inTime('3/4', written('xxx')), { type: 'copyBars' })
    expect(grid(applyEdit(inTime('4/4', copied34), { type: 'pasteBars' }))).toEqual(['xxx .... .... ....'])
  })

  it('offers no groove in compound time, and turning one on there is no change', () => {
    expect(grooveOptions('6/8').map((p) => p.id)).toEqual(['off'])
    expect(grooveOptions('3/4').map((p) => p.id)).toContain('hihatEighths')
    const { exercise } = inTime('12/8')
    expect(withGroove(exercise, 'hihatEighths')).toBe(exercise)
  })

  it('offers the hi-hat foot on 1 and on the beats in compound time', () => {
    expect(hihatFootOptions('6/8')).toEqual(['off', 'one', 'quarters'])
    expect(hihatFootOptions('12/8')).toEqual(['off', 'one', 'quarters'])
  })
})

describe('sticking in compound time', () => {
  it('runs the eighths on hand to hand through a beat with only its downbeat', () => {
    // Clicked on, a beat with only its downbeat is written as a plain quarter.
    const state = applyEdit(inTime('6/8'), { type: 'toggleGridPosition', row: 'snare', bar: 0, beat: 0, position: 0 })
    const bars = setBeat(state.exercise.bars, 'snare', 0, 1, 'xxx')
    const hands = sticking({ ...state.exercise, bars, sticking: 'natural', leadHand: 'R' }).map((n) => n.shown)
    expect(hands).toEqual(['R', 'L', 'R', 'L'])
  })
})

describe('importing compound time', () => {
  /** An export file of one exercise in 6/8, changed. */
  const file = (change: (exercise: EditorState['exercise']) => object) =>
    JSON.stringify({ format: 'drum-app-exercises', version: 5, folders: [], exercises: [change(inTime('6/8').exercise)] })

  it('keeps only the downbeat of a straight beat in a 6/8 bar', () => {
    const parsed = parseImport(file((e) => ({ ...e, bars: setBeat(e.bars, 'snare', 0, 0, 'xxxx') })))
    if (!parsed.ok) throw new Error(parsed.reason)
    expect(struckAt(newEditorState(parsed.exercises[0]))).toEqual([0])
  })

  it('turns off a groove and a hi-hat foot that 6/8 has no place for', () => {
    const parsed = parseImport(file((e) => ({ ...e, practice: { ...e.practice, groove: 'jazz', hihatFoot: 'ands' } })))
    if (!parsed.ok) throw new Error(parsed.reason)
    expect(parsed.exercises[0].practice).toMatchObject({ groove: 'off', hihatFoot: 'off' })
  })
})

describe('playing compound time', () => {
  it('clicks the dotted quarters and never swings', () => {
    const state = inTime('6/8')
    const bars = setBeat(state.exercise.bars, 'snare', 0, 0, 'xxx')
    const ex = { ...state.exercise, bars, practice: { ...state.exercise.practice, bpm: 60, swing: TRIPLET_SWING } }
    const { events } = schedule(ex, ex.practice, { ...DEFAULT_DEVICE_SETTINGS, countIn: false }, 'start', 2)
    expect(events.map((e) => `${e.time.toFixed(3)} ${e.kind}`)).toEqual([
      '0.000 click',
      '0.000 exercise',
      '0.333 exercise',
      '0.667 exercise',
      '1.000 click',
    ])
  })

  it('writes every beat of 6/8 as three eighths, never swung', () => {
    const state = inTime('6/8')
    const bars = setBeat(state.exercise.bars, 'snare', 0, 0, 'x.x')
    const parts = staffParts(bars, 'off', { swung: true, compound: true })
    expect(parts[0].hands.map((e) => `${e.start} ${e.kind} ${e.duration}${e.triplet ? '3' : ''}`)).toEqual([
      '0 chord quarter3',
      '8 chord eighth3',
      '12 rest quarter',
    ])
  })
})

describe('writing compound time', () => {
  it('cuts a note held over a beat at the beat line, tied', () => {
    const state = applyEdit(inTime('6/8'), { type: 'toggleGridPosition', row: 'snare', bar: 0, beat: 0, position: 0 })
    const held = applyEdit(state, {
      type: 'setHold',
      from: { row: 'snare', bar: 0, beat: 0, position: 0 },
      to: { row: 'snare', bar: 0, beat: 1, position: 1 },
    })
    const parts = staffParts(held.exercise.bars, 'off', { compound: true })
    expect(parts[0].hands.map((e) => `${e.start} ${e.kind} ${e.duration}${e.triplet ? '3' : ''}${e.kind === 'chord' && e.notes[0].tied ? ' tied' : ''}`)).toEqual([
      '0 chord quarter',
      '12 chord eighth3 tied',
      '16 rest quarter3',
    ])
  })

  it('cuts a note held through a whole second beat at the beat line, tied', () => {
    const state = applyEdit(inTime('6/8'), { type: 'toggleGridPosition', row: 'snare', bar: 0, beat: 0, position: 0 })
    const held = applyEdit(state, {
      type: 'setHold',
      from: { row: 'snare', bar: 0, beat: 0, position: 0 },
      to: { row: 'snare', bar: 0, beat: 1, position: 3 },
    })
    const parts = staffParts(held.exercise.bars, 'off', { compound: true })
    expect(parts[0].hands.map((e) => `${e.start} ${e.duration}${e.dotted ? '.' : ''}${e.kind === 'chord' && e.notes[0].tied ? ' tied' : ''}`)).toEqual([
      '0 quarter',
      '12 quarter tied',
    ])
  })

  it('writes each value half as long again: a beat is a dotted quarter, two eighths a quarter', () => {
    const value = (duration: Duration, dotted: boolean, triplet: boolean) => compoundValue({ duration, dotted, triplet })
    expect(value('quarter', false, false)).toEqual({ duration: 'quarter', dotted: true })
    expect(value('quarter', false, true)).toEqual({ duration: 'quarter', dotted: false })
    expect(value('eighth', false, true)).toEqual({ duration: 'eighth', dotted: false })
    expect(value('eighth', false, false)).toEqual({ duration: 'eighth', dotted: true })
  })
})
