import { describe, expect, it } from 'vitest'
import type { Bar, Cursor, EditorState, ExerciseSettings, KeyPress, Row } from './index'
import {
  BEATS_PER_BAR,
  FIGURES,
  REST_FIGURE,
  applyEdit,
  beatIndex,
  beatViews,
  canTieOverBarline,
  commandForKey,
  editorBeatViews,
  loopAt,
  newEditorState,
  newExercise,
  restBar,
  setBeat,
  sticking,
  toggleCutShort,
  toggleTie,
  withBpm,
  withGroove,
  withLoopRange,
  withSwing,
} from './index'

const press = (key: string, mods: Partial<KeyPress> = {}): KeyPress => ({
  key,
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  shiftKey: false,
  ...mods,
})

const ctrl = (key: string, mods: Partial<KeyPress> = {}) => press(key, { ctrlKey: true, ...mods })
const shift = (key: string) => press(key, { shiftKey: true })

/** A cursor on a beat, in the snare row unless given another. */
const cursorAt = (bar: number, beat: number, row: Row = 'snare'): Cursor => ({ bar, beat, row })

/** Applies each key press in turn through the key map. */
const keys = (state: EditorState, ...presses: KeyPress[]) =>
  presses.reduce((s, p) => applyEdit(s, commandForKey(p)!), state)

const fresh = () => newEditorState(newExercise({ id: 'e1', now: 0 }))

/**
 * Writes exercises as they were stored before ADR 0009, outside the undo history: each figure key
 * sets the cursor beat in the cursor row to that figure and moves on a beat, growing the exercise
 * by a bar of rests past the last beat; `t` ties the cursor beat into the one before it and `.`
 * cuts it short, without moving. Notes are now entered on the grid only, so this is a fixture.
 */
function type(typed: string[], state = fresh()): EditorState {
  return typed.reduce((s, key) => {
    const { bar, beat, row } = s.cursor
    const withBars = (bars: Bar[]) => ({ ...s, exercise: { ...s.exercise, bars } })
    if (key === 't') return withBars(toggleTie(s.exercise.bars, row, bar, beat))
    if (key === '.') return withBars(toggleCutShort(s.exercise.bars, row, bar, beat))
    const figure = key === REST_FIGURE.key ? REST_FIGURE : FIGURES.find((f) => f.key === key)
    if (!figure) throw new Error(`no figure for ${JSON.stringify(key)}`)
    let bars = setBeat(s.exercise.bars, row, bar, beat, figure.hits)
    const last = beat === BEATS_PER_BAR - 1
    if (last && bar === bars.length - 1) bars = [...bars, restBar()]
    const cursor = last ? { ...s.cursor, bar: bar + 1, beat: 0 } : { ...s.cursor, beat: beat + 1 }
    const pendingGrid = s.pendingGrid.filter((i) => i !== beatIndex(bar, beat))
    return { ...withBars(bars), cursor, pendingGrid }
  }, state)
}

/** A click on a grid position in the snare row, unless given another. */
const click = (state: EditorState, bar: number, beat: number, position: number, row: Row = 'snare') =>
  applyEdit(state, { type: 'toggleGridPosition', row, bar, beat, position })

/** The snare row's beats as the editor shows them, each with the beat's shared grid. */
const snareViews = (bars: Bar[], tripletBeats?: number[]) =>
  beatViews(bars, tripletBeats).map((beats) => beats.map((v) => ({ ...v.snare, triplet: v.triplet })))

/** As `snareViews`, with the editor's pending grid. */
const editorSnareViews = (state: EditorState) =>
  editorBeatViews(state).map((beats) => beats.map((v) => ({ ...v.snare, triplet: v.triplet })))

/** Each bar's beats as their figure keys, a rest beat as a space so the bar's shape shows. */
const figureKeys = (state: EditorState) =>
  snareViews(state.exercise.bars).map((bar) => bar.map((v) => (v.figure === REST_FIGURE ? ' ' : v.figure?.key)).join(''))

describe('a new exercise', () => {
  it('starts from the fixed defaults', () => {
    const ex = newExercise({ id: 'e1', now: 1234 })
    expect(ex).toMatchObject({
      id: 'e1',
      name: 'Untitled',
      sticking: 'off',
      leadHand: 'R',
      practice: { bpm: 80, loopRange: null, groove: 'off', swing: 0.5 },
      lastOpened: 1234,
    })
    expect(ex.bars).toHaveLength(1)
    expect(ex.bars[0].snare.every((i) => i.kind === 'rest')).toBe(true)
    expect(ex.bars[0].kick.every((i) => i.kind === 'rest')).toBe(true)
    expect(ex).not.toHaveProperty('voice')
  })
})

describe('the key map', () => {
  it('enters no figures: the number row, the bottom row, the home row and - do nothing (ADR 0009)', () => {
    for (const key of [...'1234567890zxcvbasdfgh-', 'Z', 'A']) expect(commandForKey(press(key)), key).toBeNull()
  })

  it('has no tie, cut short, Normal mode or sticking keys: T, ., Esc and Alt+1–4 do nothing', () => {
    for (const key of ['t', 'T', '.', 'Escape']) expect(commandForKey(press(key)), key).toBeNull()
    for (const digit of '1234') {
      expect(commandForKey(press(digit, { altKey: true })), `Alt+${digit}`).toBeNull()
    }
  })

  it('has no vim keys', () => {
    for (const key of [...'hjklwbxpPoOuViaG0$']) expect(commandForKey(press(key)), key).toBeNull()
    expect(commandForKey(ctrl('r'))).toBeNull()
  })

  it('leaves Space to the transport', () => {
    expect(commandForKey(press(' '))).toBeNull()
  })

  it('ignores other keys and modified keys', () => {
    expect(commandForKey(press('q'))).toBeNull()
    expect(commandForKey(press('Enter'))).toBeNull()
    expect(commandForKey(press('2', { ctrlKey: true }))).toBeNull()
    expect(commandForKey(press(' ', { ctrlKey: true }))).toBeNull()
    expect(commandForKey(press('z', { metaKey: true }))).toBeNull()
    expect(commandForKey(press('5', { altKey: true }))).toBeNull()
  })
})

describe('the tempo', () => {
  it('is set as a whole number from 30 to 300 BPM', () => {
    const ex = newExercise({ id: 'e1', now: 0 })
    expect(withBpm(ex, 144).practice.bpm).toBe(144)
    expect(withBpm(ex, 99.6).practice.bpm).toBe(100)
    expect(withBpm(ex, 12).practice.bpm).toBe(30)
    expect(withBpm(ex, 400).practice.bpm).toBe(300)
    expect(withBpm(ex, 144).practice).toMatchObject({ loopRange: null, groove: 'off' })
  })
})

describe('the groove preset', () => {
  it('is set on the exercise, leaving the other practice settings alone', () => {
    const ex = withSwing(newExercise({ id: 'e1', now: 0 }), 0.58)
    expect(withGroove(ex, 'jazzFeathered').practice).toEqual({ ...ex.practice, groove: 'jazzFeathered' })
    expect(withGroove(ex, 'off')).toBe(ex)
  })

  it('turns swing to triplet when a jazz groove is picked on a straight exercise', () => {
    const straight = newExercise({ id: 'e1', now: 0 })
    expect(withGroove(straight, 'jazz').practice).toEqual({ ...straight.practice, groove: 'jazz', swing: 2 / 3 })
    expect(withGroove(straight, 'jazzFeathered').practice.swing).toBe(2 / 3)
    const overHihat = withGroove(straight, 'hihatEighths')
    expect(withGroove(overHihat, 'jazz').practice.swing).toBe(2 / 3)
  })

  it('leaves swing alone for any other swing amount, groove or change', () => {
    const straight = newExercise({ id: 'e1', now: 0 })
    expect(withGroove(withSwing(straight, 0.58), 'jazz').practice.swing).toBe(0.58)
    expect(withGroove(withSwing(straight, 0.75), 'jazzFeathered').practice.swing).toBe(0.75)
    expect(withGroove(straight, 'hihatEighths').practice.swing).toBe(0.5)
    const jazzStraightened = withSwing(withGroove(straight, 'jazz'), 0.5)
    expect(withGroove(jazzStraightened, 'jazzFeathered').practice.swing).toBe(0.5)
    expect(withGroove(jazzStraightened, 'off').practice.swing).toBe(0.5)
    expect(withGroove(withGroove(straight, 'jazz'), 'off').practice.swing).toBe(2 / 3)
  })
})

describe('the swing amount', () => {
  it('is set from 50% (straight) to 75%', () => {
    const ex = newExercise({ id: 'e1', now: 0 })
    expect(withSwing(ex, 0.58).practice.swing).toBe(0.58)
    expect(withSwing(ex, 0.4).practice.swing).toBe(0.5)
    expect(withSwing(ex, 0.8).practice.swing).toBe(0.75)
    expect(withSwing(ex, NaN).practice.swing).toBe(0.5)
    expect(withSwing(ex, 0.62).practice).toMatchObject({ bpm: 80, loopRange: null, groove: 'off' })
  })
})

describe('the loop range', () => {
  // Five bars: four of quarters and one with three, so typing hasn't grown a sixth.
  const five = () => type('1111111111111111111'.split('')).exercise

  it('a bar-number click loops just that bar', () => {
    expect(loopAt(five(), 2).practice.loopRange).toEqual({ first: 2, last: 2 })
    const looped = loopAt(five(), 2)
    expect(loopAt(looped, 0).practice.loopRange).toEqual({ first: 0, last: 0 })
  })

  it('Shift+click extends the range to take in that bar, either way', () => {
    const looped = loopAt(five(), 2)
    expect(loopAt(looped, 4, { extend: true }).practice.loopRange).toEqual({ first: 2, last: 4 })
    expect(loopAt(loopAt(looped, 4, { extend: true }), 0, { extend: true }).practice.loopRange).toEqual({ first: 0, last: 4 })
  })

  it('Shift+click with no range set loops just that bar', () => {
    expect(loopAt(five(), 3, { extend: true }).practice.loopRange).toEqual({ first: 3, last: 3 })
  })

  it('"all" resets it to the whole exercise', () => {
    expect(withLoopRange(loopAt(five(), 2), null).practice.loopRange).toBeNull()
  })

  it('shrinks when its own bars are deleted', () => {
    const exercise = loopAt(loopAt(five(), 2), 4, { extend: true })
    const state = { ...newEditorState(exercise), cursor: cursorAt(4, 0) }
    const once = applyEdit(state, { type: 'deleteBar' })
    expect(once.exercise.practice.loopRange).toEqual({ first: 2, last: 3 })
    const twice = applyEdit(once, { type: 'deleteBar', bar: 3 })
    expect(twice.exercise.practice.loopRange).toEqual({ first: 2, last: 2 })
  })

  it('follows its bars when bars before it are added or deleted', () => {
    // Looping bars 3–4.
    const state = (bar: number) => ({ ...newEditorState(loopAt(loopAt(five(), 2), 3, { extend: true })), cursor: cursorAt(bar, 0) })
    expect(applyEdit(state(0), { type: 'deleteBar' }).exercise.practice.loopRange).toEqual({ first: 1, last: 2 })
    expect(applyEdit(state(0), { type: 'addBar' }).exercise.practice.loopRange).toEqual({ first: 3, last: 4 })
    expect(applyEdit(state(1), { type: 'duplicateBar' }).exercise.practice.loopRange).toEqual({ first: 3, last: 4 })
    // A bar added or deleted inside the range grows or shrinks it.
    expect(applyEdit(state(2), { type: 'addBar' }).exercise.practice.loopRange).toEqual({ first: 2, last: 4 })
    expect(applyEdit(state(2), { type: 'deleteBar' }).exercise.practice.loopRange).toEqual({ first: 2, last: 2 })
  })

  it('undo and redo of an added or deleted bar take the range back with the bars', () => {
    const looped = { ...newEditorState(loopAt(loopAt(five(), 2), 3, { extend: true })), cursor: cursorAt(3, 0) }
    const deleted = applyEdit(looped, { type: 'deleteBar' })
    const undone = applyEdit(deleted, { type: 'undo' })
    expect(undone.exercise.practice.loopRange).toEqual({ first: 2, last: 3 })
    expect(applyEdit(undone, { type: 'redo' }).exercise.practice.loopRange).toEqual({ first: 2, last: 2 })
    const added = applyEdit({ ...looped, cursor: cursorAt(0, 0) }, { type: 'addBar' })
    expect(applyEdit(added, { type: 'undo' }).exercise.practice.loopRange).toEqual({ first: 2, last: 3 })
  })

  it('undo of a note change leaves a range picked since alone', () => {
    const typed = click(newEditorState(five()), 0, 0, 1)
    const relooped = { ...typed, exercise: loopAt(typed.exercise, 4) }
    expect(applyEdit(relooped, { type: 'undo' }).exercise.practice.loopRange).toEqual({ first: 4, last: 4 })
  })

  it('loops the whole exercise again once all its bars are deleted', () => {
    const exercise = loopAt(loopAt(five(), 1), 2, { extend: true })
    const state = { ...newEditorState(exercise), selection: { first: 0, last: 3 }, cursor: cursorAt(3, 0) }
    expect(applyEdit(state, { type: 'deleteBar' }).exercise.practice.loopRange).toBeNull()
  })

  it('is left alone by edits that keep it inside the exercise', () => {
    const exercise = loopAt(five(), 1)
    const state = applyEdit(newEditorState(exercise), { type: 'deleteBar', bar: 4 })
    expect(state.exercise.practice).toBe(exercise.practice)
  })
})

describe('beats tied or cut short before ADR 0009', () => {
  const views = (state: EditorState) => snareViews(state.exercise.bars)[0]
  // Quarters, with beat 2 tied into and beat 3 cut short to an eighth.
  const stored = () => ({ ...type(['1', '1', '1', '1']), cursor: cursorAt(0, 1) })
  const old = () => type(['.'], { ...type(['t'], stored()), cursor: cursorAt(0, 2) })

  it('keep their tie and cut short through moves and edits elsewhere', () => {
    expect(views(old())[1].tiedInto).toBe(true)
    expect(views(old())[2]).toMatchObject({ cutShort: true, figure: { key: '1' } })
    const edited = keys(click(old(), 0, 3, 2), press('Home'), press('ArrowRight'), press('Tab'))
    expect(views(edited)[1].tiedInto).toBe(true)
    expect(views(edited)[2].cutShort).toBe(true)
    expect(edited.exercise.bars[0].snare.slice(0, 4)).toEqual(old().exercise.bars[0].snare.slice(0, 4))
  })

  it('a tie inside a bar is undone by dragging the hold back', () => {
    const untied = applyEdit(old(), { type: 'setHold', from: { row: 'snare', bar: 0, beat: 0, position: 0 }, to: { row: 'snare', bar: 0, beat: 1, position: 0 } })
    expect(views(untied)[1].tiedInto).toBe(false)
  })
})

describe('moving around', () => {
  // Three bars, cursor on bar 2 beat 3 (0-based: bar 1, beat 2).
  const start = () => ({ ...type(['1', '1', '1', '1', '2', '2', '2', '2', '3']), cursor: cursorAt(1, 2) })

  it('←/→ move by beat, across bar lines, and stop at the ends', () => {
    expect(keys(start(), press('ArrowRight'), press('ArrowRight')).cursor).toEqual(cursorAt(2, 0))
    expect(keys(start(), press('ArrowLeft'), press('ArrowLeft'), press('ArrowLeft')).cursor).toEqual(cursorAt(0, 3))
    const atEnd = { ...start(), cursor: cursorAt(2, 3) }
    expect(keys(atEnd, press('ArrowRight')).cursor).toEqual(cursorAt(2, 3))
    const atStart = { ...start(), cursor: cursorAt(0, 0) }
    expect(keys(atStart, press('ArrowLeft')).cursor).toEqual(cursorAt(0, 0))
  })

  it('↑/↓ and Ctrl+←/→ move by bar, keeping the beat, and stop at the ends', () => {
    expect(keys(start(), press('ArrowDown')).cursor).toEqual(cursorAt(2, 2))
    expect(keys(start(), press('ArrowUp')).cursor).toEqual(cursorAt(0, 2))
    expect(keys(start(), press('ArrowRight', { ctrlKey: true })).cursor).toEqual(cursorAt(2, 2))
    expect(keys(start(), press('ArrowLeft', { ctrlKey: true }), press('ArrowUp')).cursor).toEqual(cursorAt(0, 2))
    expect(keys(start(), press('ArrowDown'), press('ArrowDown')).cursor).toEqual(cursorAt(2, 2))
  })

  it('Home and End jump to the first and last beat of the exercise', () => {
    expect(keys(start(), press('Home')).cursor).toEqual(cursorAt(0, 0))
    expect(keys(start(), press('End')).cursor).toEqual(cursorAt(2, 3))
  })

  it('moving never changes the exercise', () => {
    const state = start()
    expect(keys(state, press('ArrowRight'), press('Home'), press('ArrowDown')).exercise).toBe(state.exercise)
  })

  it('a click moves the cursor to that beat', () => {
    expect(applyEdit(start(), { type: 'moveTo', bar: 0, beat: 3 }).cursor).toEqual(cursorAt(0, 3))
  })
})

describe('turning beats into rests', () => {
  const typedAt = (keysTyped: string[], bar: number, beat: number) => ({ ...type(keysTyped), cursor: cursorAt(bar, beat) })

  it('Backspace turns the beat into a rest and steps back', () => {
    const state = applyEdit(typedAt(['1', '2', '3', '4'], 0, 2), commandForKey(press('Backspace'))!)
    expect(figureKeys(state)[0]).toBe('12 4')
    expect(state.cursor).toEqual(cursorAt(0, 1))
  })

  it('Backspace steps back across a bar line, and stays put on the first beat', () => {
    const state = applyEdit(typedAt(['1', '2', '3', '4', '5'], 1, 0), commandForKey(press('Backspace'))!)
    expect(figureKeys(state)).toEqual(['1234', '    '])
    expect(state.cursor).toEqual(cursorAt(0, 3))
    expect(applyEdit(typedAt(['1'], 0, 0), commandForKey(press('Backspace'))!).cursor).toEqual(cursorAt(0, 0))
  })

  it('Delete turns the beat into a rest in place', () => {
    const state = applyEdit(typedAt(['1', '2', '3', '4'], 0, 2), commandForKey(press('Delete'))!)
    expect(figureKeys(state)[0]).toBe('12 4')
    expect(state.cursor).toEqual(cursorAt(0, 2))
  })
})

describe("a beat card's menu", () => {
  /** Snare on beats 1–4 of bar 1 and kick on its beats 1 and 3, the cursor last in the kick row. */
  const groove = () => click(click(click(click(click(click(fresh(), 0, 0, 0), 0, 1, 0), 0, 2, 0), 0, 3, 0), 0, 0, 0, 'kick'), 0, 2, 0, 'kick')
  const rowHits = (state: EditorState, row: Row) => editorBeatViews(state)[0].map((v) => v[row].hits).join(' ')

  it('rests a given beat in both rows, as one undo step, and moves the cursor there', () => {
    const rested = applyEdit(groove(), { type: 'restBeat', bar: 0, beat: 2 })
    expect(rowHits(rested, 'snare')).toBe('x... x... .... x...')
    expect(rowHits(rested, 'kick')).toBe('x... .... .... ....')
    expect(rested.cursor).toEqual(cursorAt(0, 2, 'kick'))
    expect(keys(rested, ctrl('z')).exercise.bars).toEqual(groove().exercise.bars)
  })

  describe('tie over the barline', () => {
    /** Two bars: a snare hit on bar 1's beat 4 and bar 2's beat 1; the kick only on bar 2's beat 1. */
    const twoBars = () => {
      const added = applyEdit(fresh(), { type: 'addBar' })
      return click(click(click(added, 0, 3, 0), 1, 0, 0), 1, 0, 0, 'kick')
    }
    const tiedInto = (state: EditorState, row: Row) => editorBeatViews(state)[1][0][row].tiedInto

    it('ties a bar’s first beat into the last note of the bar before, and unties it again', () => {
      const tied = applyEdit(twoBars(), { type: 'tieOverBarline', bar: 1, row: 'snare' })
      expect(tiedInto(tied, 'snare')).toBe(true)
      expect(tied.cursor).toEqual(cursorAt(1, 0, 'snare'))
      const untied = applyEdit(tied, { type: 'tieOverBarline', bar: 1, row: 'snare' })
      expect(tiedInto(untied, 'snare')).toBe(false)
      expect(untied.exercise.bars).toEqual(twoBars().exercise.bars)
    })

    it('is one undo step', () => {
      const tied = applyEdit(twoBars(), { type: 'tieOverBarline', bar: 1, row: 'snare' })
      expect(keys(tied, ctrl('z')).exercise.bars).toEqual(twoBars().exercise.bars)
    })

    it('is offered where it would tie or untie, and only there', () => {
      const state = twoBars()
      expect(canTieOverBarline(state, 1, 'snare')).toBe(true)
      expect(canTieOverBarline(applyEdit(state, { type: 'tieOverBarline', bar: 1, row: 'snare' }), 1, 'snare')).toBe(true)
      // The exercise's first beat has nothing before it.
      expect(canTieOverBarline(state, 0, 'snare')).toBe(false)
      // The kick row's bar 1 ends in a rest.
      expect(canTieOverBarline(state, 1, 'kick')).toBe(false)
      // No hit on the downbeat to tie.
      expect(canTieOverBarline(click(state, 1, 0, 0), 1, 'snare')).toBe(false)
    })

    it('keeps a beat put on triplets on the triplet grid', () => {
      const pending = applyEdit(twoBars(), { type: 'setBeatGrid', bar: 1, beat: 0, triplet: true })
      const tied = applyEdit(pending, { type: 'tieOverBarline', bar: 1, row: 'snare' })
      expect(editorBeatViews(tied)[1][0]).toMatchObject({ triplet: true, snare: { tiedInto: true } })
      expect(editorBeatViews(applyEdit(tied, { type: 'tieOverBarline', bar: 1, row: 'snare' }))[1][0].triplet).toBe(true)
    })

    it('is refused where it is not offered', () => {
      const state = twoBars()
      expect(applyEdit(state, { type: 'tieOverBarline', bar: 1, row: 'kick' }).exercise.bars).toBe(state.exercise.bars)
      expect(applyEdit(state, { type: 'tieOverBarline', bar: 0, row: 'snare' }).exercise.bars).toBe(state.exercise.bars)
      expect(applyEdit(state, { type: 'tieOverBarline', bar: 0, row: 'snare' }).history.undo).toHaveLength(state.history.undo.length)
    })
  })
})

describe('reshaping bars', () => {
  // Bars 1111 | 2222 | 3333, cursor on bar 2.
  const three = () => ({ ...type('111122223333'.split('')), cursor: cursorAt(1, 2) })
  const tiedInto = (state: EditorState) => snareViews(state.exercise.bars).map((bar) => bar.map((v) => (v.tiedInto ? '⌒' : '-')).join(''))

  it('Ctrl+Enter adds a bar of rests after the current one and moves to it', () => {
    const state = keys(three(), ctrl('Enter'))
    expect(figureKeys(state)).toEqual(['1111', '2222', '    ', '3333', '    '])
    expect(state.cursor).toEqual(cursorAt(2, 0))
  })

  it('Ctrl+D duplicates the current bar and moves on a bar, onto the second of the pair', () => {
    const state = keys(three(), ctrl('d'))
    expect(figureKeys(state)).toEqual(['1111', '2222', '2222', '3333', '    '])
    expect(state.cursor).toEqual(cursorAt(2, 2))
  })

  it('Ctrl+Backspace deletes the current bar', () => {
    const state = keys(three(), ctrl('Backspace'))
    expect(figureKeys(state)).toEqual(['1111', '3333', '    '])
    expect(state.cursor).toEqual(cursorAt(1, 2))
    const last = keys({ ...three(), cursor: cursorAt(3, 1) }, ctrl('Backspace'))
    expect(last.cursor).toEqual(cursorAt(2, 1))
  })

  it('deletes a bar by its index, as the ✕ in the beat strip does, keeping the cursor on its beat', () => {
    const state = applyEdit(three(), { type: 'deleteBar', bar: 0 })
    expect(figureKeys(state)).toEqual(['2222', '3333', '    '])
    expect(state.cursor).toEqual(cursorAt(0, 2))
  })

  it('deleting the only bar when it is already all rests is not a change', () => {
    const fresh = newEditorState(newExercise({ id: 'e1', now: 0 }))
    const state = keys(fresh, ctrl('Backspace'))
    expect(state.exercise).toBe(fresh.exercise)
    expect(keys(state, ctrl('z')).history).toEqual(fresh.history)
  })

  it('deleting the only bar leaves one bar of rests', () => {
    const state = keys(type(['1', '2']), ctrl('Backspace'))
    expect(figureKeys(state)).toEqual(['    '])
    expect(state.cursor).toEqual(cursorAt(0, 2))
  })

  // 1111 | 2222 | 2222 | rests, with bar 1's last note held over the bar line into bar 2.
  const held = () => ({ ...type(['t'], { ...type('111122222222'.split('')), cursor: cursorAt(1, 0) }) })

  it('cuts a tie that would run into an added bar or a bar moved up by a delete', () => {
    expect(tiedInto(held())).toEqual(['----', '⌒---', '----', '----'])
    const added = keys({ ...held(), cursor: cursorAt(0, 0) }, ctrl('Enter'))
    expect(figureKeys(added)).toEqual(['1111', '    ', '2222', '2222', '    '])
    expect(tiedInto(added)).toEqual(['----', '----', '----', '----', '----'])
    const deleted = keys(held(), ctrl('Backspace'))
    expect(figureKeys(deleted)).toEqual(['1111', '2222', '    '])
    expect(tiedInto(deleted)).toEqual(['----', '----', '----'])
  })

  it('a duplicated bar keeps its tie into the next bar, and the original does not tie into the copy', () => {
    const state = keys({ ...held(), cursor: cursorAt(0, 0) }, ctrl('d'))
    expect(figureKeys(state)).toEqual(['1111', '1111', '2222', '2222', '    '])
    expect(tiedInto(state)).toEqual(['----', '----', '⌒---', '----', '----'])
  })
})

describe('selecting, copying and pasting bars', () => {
  // Bars 1111 | 2222 | 3333 | 4444 | rests, cursor on bar 1.
  const four = () => ({ ...type('1111222233334444'.split('')), cursor: cursorAt(0, 1) })

  it('Shift+←/→ select bars from the cursor bar, moving the cursor with the selection', () => {
    const state = keys(four(), shift('ArrowRight'), shift('ArrowRight'))
    expect(state.selection).toEqual({ first: 0, last: 2 })
    expect(state.cursor).toEqual(cursorAt(2, 1))
    expect(keys(state, shift('ArrowLeft')).selection).toEqual({ first: 0, last: 1 })
    const back = keys({ ...four(), cursor: cursorAt(2, 0) }, shift('ArrowLeft'), shift('ArrowLeft'))
    expect(back.selection).toEqual({ first: 0, last: 2 })
  })

  it('copying keeps the selection, so it can then be deleted', () => {
    const state = keys(four(), shift('ArrowRight'), ctrl('c'))
    expect(state.selection).toEqual({ first: 0, last: 1 })
    expect(figureKeys(keys(state, ctrl('Backspace')))).toEqual(['3333', '4444', '    '])
  })

  it('moving without Shift clears the selection', () => {
    const state = keys(four(), shift('ArrowRight'), press('ArrowRight'))
    expect(state.selection).toBeNull()
  })

  it('Ctrl+C then Ctrl+V pastes the selected bars, replacing from the current bar on', () => {
    const state = keys(four(), shift('ArrowRight'), ctrl('c'), press('ArrowDown'), press('ArrowDown'), ctrl('v'))
    expect(figureKeys(state)).toEqual(['1111', '2222', '3333', '1111', '2222'])
    expect(state.cursor).toEqual(cursorAt(3, 0))
  })

  it('pasting past the end grows the exercise', () => {
    const state = keys(four(), shift('ArrowRight'), ctrl('c'), press('End'), ctrl('v'))
    expect(figureKeys(state)).toEqual(['1111', '2222', '3333', '4444', '1111', '2222'])
  })

  it('with nothing selected, Ctrl+C copies the current bar', () => {
    const state = keys(four(), ctrl('c'), press('ArrowDown'), ctrl('v'), ctrl('v'))
    expect(figureKeys(state)).toEqual(['1111', '1111', '3333', '4444', '    '])
  })

  it('Ctrl+V with nothing copied does nothing', () => {
    const state = four()
    expect(keys(state, ctrl('v')).exercise).toBe(state.exercise)
  })

  it('Ctrl+Backspace deletes the selected bars', () => {
    const state = keys({ ...four(), cursor: cursorAt(1, 0) }, shift('ArrowRight'), ctrl('Backspace'))
    expect(figureKeys(state)).toEqual(['1111', '4444', '    '])
    expect(state.cursor).toEqual(cursorAt(1, 0))
    expect(state.selection).toBeNull()
  })
})

describe('undo and redo', () => {
  const undo = ctrl('z')
  const redo = ctrl('Z', { shiftKey: true })
  /** Clicks on the downbeats of beats 1, 2 and 3. */
  const clicked = () => click(click(click(fresh(), 0, 0, 0), 0, 1, 0), 0, 2, 0)

  it('Ctrl+Z undoes each change in turn, putting the cursor back', () => {
    const state = keys(clicked(), undo)
    expect(figureKeys(state)).toEqual(['11  '])
    expect(state.cursor).toEqual(cursorAt(0, 1))
    expect(figureKeys(keys(state, undo, undo))).toEqual(['    '])
  })

  it('delete then undo restores the bar', () => {
    const before = { ...type('11112222'.split('')), cursor: cursorAt(0, 1) }
    const state = keys(before, ctrl('Backspace'), undo)
    expect(figureKeys(state)).toEqual(['1111', '2222', '    '])
    expect(state.cursor).toEqual(cursorAt(0, 1))
  })

  it('paste then undo puts back the bars it replaced', () => {
    const before = { ...type('11112222'.split('')), cursor: cursorAt(0, 0) }
    const state = keys(before, ctrl('c'), press('ArrowDown'), ctrl('v'), undo)
    expect(figureKeys(state)).toEqual(['1111', '2222', '    '])
  })

  it('Ctrl+Shift+Z redoes what was undone, until a new change', () => {
    const state = keys(clicked(), undo, undo, redo)
    expect(figureKeys(state)).toEqual(['11  '])
    expect(figureKeys(keys(state, redo))).toEqual(['111 '])
    const changed = click(state, 0, 3, 0)
    expect(keys(changed, redo).exercise).toBe(changed.exercise)
  })

  it('covers rests and bar changes, but not moves', () => {
    const start = { ...type(['2', '2']), cursor: cursorAt(0, 1) }
    const moves = ['ArrowLeft', 'ArrowRight']
    const steps = ['Backspace', 'ArrowRight', 'Delete'].map((k) => press(k)).concat([ctrl('Enter'), ctrl('d')])
    const edited = keys(start, ...steps)
    const undone = keys(edited, ...steps.filter((p) => !moves.includes(p.key)).map(() => undo))
    expect(undone.exercise.bars).toEqual(start.exercise.bars)
    expect(keys(undone, undo).exercise).toBe(undone.exercise)
  })

  it('a rest over a rest is not a change', () => {
    const state = type(['1'])
    expect(keys(state, press('Delete'))).toBe(state)
  })

  it('with nothing to undo or redo, nothing changes', () => {
    const state = type(['1'])
    expect(keys(state, redo).exercise).toBe(state.exercise)
    const empty = fresh()
    expect(keys(empty, undo).exercise).toBe(empty.exercise)
  })
})

describe('sticking settings', () => {
  const set = (state: EditorState, settings: Partial<ExerciseSettings>) =>
    applyEdit(state, { type: 'setExerciseSettings', settings })

  it('change the exercise, each as one undoable step', () => {
    const start = click(fresh(), 0, 0, 0)
    const edited = set(set(start, { sticking: 'alternate' }), { leadHand: 'L' })
    expect(edited.exercise).toMatchObject({ sticking: 'alternate', leadHand: 'L' })
    expect(edited.exercise.bars).toBe(start.exercise.bars)

    const undone = keys(edited, ctrl('z'))
    expect(undone.exercise).toMatchObject({ sticking: 'alternate', leadHand: 'R' })
    expect(keys(undone, ctrl('z')).exercise).toMatchObject({ sticking: 'off', leadHand: 'R' })
    expect(keys(undone, ctrl('z'), ctrl('z')).exercise.bars).not.toBe(start.exercise.bars)
    expect(keys(undone, ctrl('Z', { shiftKey: true })).exercise.leadHand).toBe('L')
  })

  it('setting what is already set is not a change', () => {
    const state = type(['1'])
    expect(set(state, { sticking: 'off' })).toBe(state)
  })
})

describe('sticking overrides', () => {
  /** Flips the note at that tick of bar 1, as a click on its hand does. */
  const flip = (state: EditorState, ...ticks: number[]) =>
    ticks.reduce((s, tick) => applyEdit(s, { type: 'flipOverride', note: { id: `0:${tick}` } }), state)
  /** The shown hands in order, with `-` for a note that shows none. */
  const hands = (state: EditorState) => sticking(state.exercise).map((n) => n.shown ?? '-').join('')
  const overrides = (state: EditorState) => sticking(state.exercise).map((n) => n.override ?? '-').join('')
  /** Types the keys into a new exercise under natural sticking. */
  const typeNatural = (keys: string[]) => type(keys, newEditorState({ ...newExercise({ id: 'e1', now: 0 }), sticking: 'natural' }))
  /** `x.x.` `xxxx`, cursor on the sixteenths, whose notes start at ticks 12, 15, 18 and 21. */
  const start = () => ({ ...typeNatural(['2', '4']), cursor: cursorAt(0, 1) })

  it('a flip sets the opposite hand on that note, leaving the others alone', () => {
    expect(hands(start())).toBe('RL' + 'RLRL')
    expect(hands(flip(start(), 15))).toBe('RL' + 'RRRL')
    expect(hands(flip(start(), 12, 21))).toBe('RL' + 'LLRR')
  })

  it('flipping an overridden note again clears its override', () => {
    expect(overrides(flip(start(), 15, 15))).toBe('------')
    expect(hands(flip(start(), 15, 15))).toBe('RL' + 'RLRL')
  })

  it('flips the note by its id, wherever the cursor is', () => {
    const state = flip(start(), 6)
    expect(hands(state)).toBe('RR' + 'RLRL')
    expect(state.cursor).toEqual(cursorAt(0, 1))
  })

  it('does nothing for a note that is not there', () => {
    const state = start()
    expect(flip(state, 3)).toBe(state)
  })

  it('each flip is one undoable step', () => {
    const flipped = flip(start(), 12, 15)
    expect(overrides(keys(flipped, ctrl('z')))).toBe('--' + 'L---')
    expect(overrides(keys(flipped, ctrl('z'), ctrl('z')))).toBe('------')
    expect(overrides(keys(flipped, ctrl('z'), ctrl('Z', { shiftKey: true })))).toBe('--' + 'LR--')
  })

  it('survives re-entering a neighbouring beat and a duration change on its own note', () => {
    const flipped = flip(start(), 18)
    // Re-entering beat 1 as straight sixteenths.
    const neighbour = type(['4'], { ...flipped, cursor: cursorAt(0, 0) })
    expect(overrides(neighbour)).toBe('----' + '--L-')
    // `xxxx` → `x...`: the overridden first sixteenth becomes a quarter.
    const longer = type(['1'], { ...flip(start(), 12), cursor: cursorAt(0, 1) })
    expect(snareViews(longer.exercise.bars)[0][1].hits).toBe('x...')
    expect(overrides(longer)).toBe('--' + 'L')
  })

  it('is dropped when its beat becomes a rest', () => {
    const flipped = flip(start(), 15)
    const rested = keys({ ...flipped, cursor: cursorAt(0, 1) }, press('Delete'))
    expect(overrides(rested)).toBe('--')
    expect(overrides(type(['4'], { ...rested, cursor: cursorAt(0, 1) }))).toBe('------')
  })

  it('is kept across mode switches, and hidden but kept with sticking off', () => {
    const set = (state: EditorState, settings: Partial<ExerciseSettings>) =>
      applyEdit(state, { type: 'setExerciseSettings', settings })
    const flipped = flip(start(), 15)
    const alternate = set(flipped, { sticking: 'alternate' })
    expect(overrides(alternate)).toBe('--' + '-R--')
    expect(hands(set(flipped, { sticking: 'off' }))).toBe('------')
    expect(hands(set(set(flipped, { sticking: 'off' }), { sticking: 'natural' }))).toBe('RL' + 'RRRL')
    expect(overrides(set(flipped, { sticking: 'off' }))).toBe('--' + '-R--')
  })

  it('cannot be flipped while sticking is hidden', () => {
    const off = applyEdit(start(), { type: 'setExerciseSettings', settings: { sticking: 'off' } })
    expect(flip(off, 0)).toBe(off)
  })

  it('reset clears every override in one undoable step, and is not a change with none set', () => {
    const flipped = flip(start(), 12, 21, 6)
    expect(overrides(flipped)).toBe('-R' + 'L--R')
    const reset = applyEdit(flipped, { type: 'resetOverrides' })
    expect(overrides(reset)).toBe('------')
    expect(overrides(keys(reset, ctrl('z')))).toBe('-R' + 'L--R')
    expect(applyEdit(reset, { type: 'resetOverrides' })).toBe(reset)
  })
})

describe('clicking grid positions', () => {

  it('clicks several positions in one beat, the cursor moving to that beat without advancing', () => {
    const state = click(click(fresh(), 0, 2, 2), 0, 2, 0)
    expect(state.cursor).toEqual(cursorAt(0, 2))
    expect(figureKeys(state)).toEqual(['  2 '])
  })

  it('makes each click one undo step', () => {
    const state = click(click(fresh(), 0, 1, 0), 0, 1, 2)
    expect(figureKeys(keys(state, ctrl('z')))).toEqual([' 1  '])
    expect(figureKeys(keys(state, ctrl('z'), ctrl('z')))).toEqual(['    '])
  })

  it('removes the & of an eighth pair, giving a quarter', () => {
    expect(figureKeys(click(type(['2']), 0, 0, 2))).toEqual(['1   '])
  })

  it('strikes the downbeat of a tied-into beat again', () => {
    const tied = type(['t'], { ...type(['1', '1']), cursor: cursorAt(0, 1) })
    expect(snareViews(tied.exercise.bars)[0][1].tiedInto).toBe(true)
    const struck = click(tied, 0, 1, 0)
    expect(snareViews(struck.exercise.bars)[0][1]).toMatchObject({ tiedInto: false, figure: { key: '1' } })
  })
})

describe('dragging a hold', () => {
  const drag = (state: EditorState, bar: number, beat: number, position: number, end: number) =>
    applyEdit(state, { type: 'setHold', from: { row: 'snare', bar, beat, position }, to: { row: 'snare', bar, beat, position: end } })
  const text = (state: EditorState) => snareViews(state.exercise.bars)[0].map((v) => v.positions.map((p) => p[0]).join(''))

  it('sets the hold, moving the cursor to the beat without advancing', () => {
    const state = drag(type(['2', '2']), 0, 0, 0, 1)
    expect(text(state)[0]).toBe('hehh')
    expect(state.cursor).toEqual(cursorAt(0, 0))
  })

  it('is one undo step', () => {
    const state = drag(drag(type(['2']), 0, 0, 2, 3), 0, 0, 0, 1)
    expect(text(keys(state, ctrl('z')))[0]).toBe('hhhe')
    expect(text(keys(state, ctrl('z'), ctrl('z')))[0]).toBe('hhhh')
  })

  it('records nothing when the drag changes nothing', () => {
    const state = type(['2'])
    const dragged = drag(state, 0, 0, 0, 0)
    expect(dragged.history).toBe(state.history)
    expect(dragged.cursor).toEqual(cursorAt(0, 0))
  })

  it('cuts a note short when dragged to one grid position, as the old cut short did', () => {
    const cut = drag(type(['1']), 0, 0, 0, 1)
    expect(text(cut)[0]).toBe('heee')
  })

  it('drags on the pending triplet grid, which the beat then keeps on its own', () => {
    const pending = applyEdit(type(['1']), { type: 'setBeatGrid', bar: 0, beat: 0, triplet: true })
    const state = drag(pending, 0, 0, 0, 1)
    expect(snareViews(state.exercise.bars)[0][0]).toMatchObject({ triplet: true, positions: ['hit', 'empty', 'empty'] })
    expect(state.pendingGrid).toEqual([])
    // Held to the end again, it reads the same on either grid, and stays on triplets in the editor.
    const back = drag(state, 0, 0, 0, 3)
    expect(snareViews(back.exercise.bars)[0][0]).toMatchObject({ triplet: false, figure: { key: '1' } })
    expect(editorSnareViews(back)[0][0]).toMatchObject({ triplet: true, positions: ['hit', 'hold', 'hold'] })
  })

  it('drags into a later beat on its pending triplet grid, which it keeps', () => {
    const pending = applyEdit(type(['1']), { type: 'setBeatGrid', bar: 0, beat: 1, triplet: true })
    const into = (state: EditorState, position: number) =>
      applyEdit(state, { type: 'setHold', from: { row: 'snare', bar: 0, beat: 0, position: 0 }, to: { row: 'snare', bar: 0, beat: 1, position } })
    const state = into(pending, 1)
    expect(snareViews(state.exercise.bars)[0][1]).toMatchObject({ triplet: true, tiedInto: true, positions: ['hold', 'empty', 'empty'] })
    expect(state.cursor).toEqual(cursorAt(0, 0))
    // Held right through, it reads the same on either grid, and stays on triplets in the editor.
    const through = into(pending, 3)
    expect(snareViews(through.exercise.bars)[0][1].triplet).toBe(false)
    expect(editorSnareViews(through)[0][1]).toMatchObject({ triplet: true, positions: ['hold', 'hold', 'hold'] })
  })
})
describe('switching a beat between the sixteenth and triplet grid', () => {
  const grid = (state: EditorState, bar: number, beat: number, triplet: boolean) =>
    applyEdit(state, { type: 'setBeatGrid', bar, beat, triplet })
  const view = (state: EditorState, bar: number, beat: number) => editorSnareViews(state)[bar][beat]

  it('puts an empty beat on the triplet grid, with three empty positions', () => {
    const state = grid(fresh(), 0, 1, true)
    expect(view(state, 0, 1)).toMatchObject({ triplet: true, positions: ['empty', 'empty', 'empty'] })
    expect(view(state, 0, 0)).toMatchObject({ triplet: false, positions: ['empty', 'empty', 'empty', 'empty'] })
  })

  it('takes clicks on triplet positions: positions 1 and 3 make the beat triplet x.x', () => {
    const state = click(click(grid(fresh(), 0, 1, true), 0, 1, 0), 0, 1, 2)
    expect(snareViews(state.exercise.bars)[0][1]).toMatchObject({ triplet: true, hits: 'x.x', figure: { key: 's' } })
    expect(state.pendingGrid).toEqual([])
  })

  it('keeps the beat on the triplet grid while only its downbeat is clicked, without saving it', () => {
    const state = click(grid(fresh(), 0, 1, true), 0, 1, 0)
    expect(view(state, 0, 1)).toMatchObject({ triplet: true, positions: ['hit', 'hold', 'hold'] })
    expect(snareViews(state.exercise.bars)[0][1]).toMatchObject({ triplet: false, figure: { key: '1' } })
  })

  it('shows no sixteenth figure for a beat on the pending grid', () => {
    const empty = grid(fresh(), 0, 1, true)
    expect(view(empty, 0, 1).figure).toBeUndefined()
    const downbeat = click(empty, 0, 1, 0)
    expect(view(downbeat, 0, 1)).toMatchObject({ hits: 'x..', figure: undefined })
  })

  it('keeps a downbeat hit, clears the others and holds the downbeat to the end of the beat', () => {
    const state = grid(type(['7']), 0, 0, true)
    expect(view(state, 0, 0)).toMatchObject({ triplet: true, positions: ['hit', 'hold', 'hold'] })
    expect(figureKeys(state)).toEqual(['1   '])
    const back = grid(type(['a']), 0, 0, false)
    expect(view(back, 0, 0)).toMatchObject({ triplet: false, positions: ['hit', 'hold', 'hold', 'hold'] })
    expect(figureKeys(back)).toEqual(['1   '])
    expect(figureKeys(grid(type(['3']), 0, 0, true))).toEqual(['    '])
  })

  it('keeps a tie into the beat', () => {
    const tied = type(['t'], { ...type(['1', '2']), cursor: cursorAt(0, 1) })
    const state = grid(tied, 0, 1, true)
    expect(view(state, 0, 1)).toMatchObject({ triplet: true, tiedInto: true, positions: ['hold', 'hold', 'hold'] })
  })

  it('moves the cursor to the beat without advancing', () => {
    expect(grid(fresh(), 0, 2, true).cursor).toEqual(cursorAt(0, 2))
  })

  it('makes each switch one undo step, the pending grid with it', () => {
    const switched = grid(fresh(), 0, 1, true)
    const undone = keys(switched, ctrl('z'))
    expect(view(undone, 0, 1).triplet).toBe(false)
    expect(view(applyEdit(undone, { type: 'redo' }), 0, 1).triplet).toBe(true)
    const triplets = grid(type(['a']), 0, 0, false)
    expect(figureKeys(keys(triplets, ctrl('z')))).toEqual(['a   '])
    const clicked = click(switched, 0, 1, 1)
    expect(view(keys(clicked, ctrl('z')), 0, 1)).toMatchObject({ triplet: true, positions: ['empty', 'empty', 'empty'] })
  })

  it('is no change when the beat is already on that grid', () => {
    const state = type(['a'])
    expect(grid(state, 0, 0, true).exercise).toBe(state.exercise)
    expect(grid(state, 0, 0, true).history.undo).toHaveLength(0)
    expect(grid(fresh(), 0, 0, false).history.undo).toHaveLength(0)
  })

  it('leaves the pending grid when the beat changes by any other command, not when another beat does', () => {
    const pending = grid(type(['1', '1']), 0, 1, true)
    expect(view(pending, 0, 1).triplet).toBe(true)
    expect(view(keys({ ...pending, cursor: cursorAt(0, 1) }, press('Delete')), 0, 1).triplet).toBe(false)
    expect(view(keys({ ...pending, cursor: cursorAt(0, 2) }, press('Delete')), 0, 1).triplet).toBe(true)
    expect(view(keys({ ...pending, cursor: cursorAt(0, 0) }, press('Delete')), 0, 1).triplet).toBe(true)
  })

  it('goes back on the triplet grid when the last triplet off the downbeat is clicked off', () => {
    const state = click(type(['s']), 0, 0, 2)
    expect(view(state, 0, 0)).toMatchObject({ triplet: true, positions: ['hit', 'hold', 'hold'] })
    expect(figureKeys(state)).toEqual(['1   '])
  })
})

describe('the kick row (ADR 0005)', () => {
  const kick = (state: EditorState, bar: number, beat: number, position: number) =>
    applyEdit(state, { type: 'toggleGridPosition', row: 'kick', bar, beat, position })
  /** Each bar's kick row, as hits per beat. */
  const kickHits = (state: EditorState) => editorBeatViews(state).map((bar) => bar.map((v) => v.kick.hits).join(' '))
  /** Snare figures 1 2 3 4 in bar 1, and a kick on the & of beat 1. */
  const start = () => kick(type(['1', '2', '3', '4']), 0, 0, 2)

  it('takes a click without touching the snare row, moving the cursor to its beat and row', () => {
    const snared = type(['1', '2', '3', '4'])
    const state = kick(snared, 0, 0, 2)
    expect(state.exercise.bars[0].snare).toBe(snared.exercise.bars[0].snare)
    expect(kickHits(state)).toEqual(['..x. .... .... ....', '.... .... .... ....'])
    expect(state.cursor).toEqual(cursorAt(0, 0, 'kick'))
    expect(figureKeys(keys(state, ctrl('z')))).toEqual(figureKeys(snared))
    expect(kickHits(keys(state, ctrl('z')))[0]).toBe('.... .... .... ....')
  })

  it('drags a kick hold in the kick row', () => {
    const state = applyEdit(start(), {
      type: 'setHold',
      from: { row: 'kick', bar: 0, beat: 0, position: 2 },
      to: { row: 'kick', bar: 0, beat: 1, position: 2 },
    })
    expect(editorBeatViews(state)[0][1].kick).toMatchObject({ tiedInto: true, positions: ['hold', 'hold', 'empty', 'empty'] })
    expect(figureKeys(state)).toEqual(figureKeys(start()))
    expect(state.cursor).toEqual(cursorAt(0, 0, 'kick'))
  })

  it('switches a beat to triplets in both rows at once, keeping each downbeat', () => {
    const state = kick(kick(type(['5']), 0, 0, 0), 0, 0, 2)
    expect(kickHits(state)[0].slice(0, 4)).toBe('x.x.')
    const switched = applyEdit(state, { type: 'setBeatGrid', bar: 0, beat: 0, triplet: true })
    expect(editorBeatViews(switched)[0][0]).toMatchObject({ triplet: true, snare: { hits: 'x..' }, kick: { hits: 'x..' } })
    // A click on the kick's "let" lands on the shared triplet grid.
    expect(editorBeatViews(kick(switched, 0, 0, 2))[0][0]).toMatchObject({ triplet: true, kick: { hits: 'x.x' }, snare: { hits: 'x..' } })
  })

  it('carries both rows with every bar command', () => {
    const state = start()
    const kicks = kickHits(state)[0]
    expect(kickHits(keys(state, ctrl('d')))).toEqual([kicks, kicks, '.... .... .... ....'])
    expect(kickHits(keys(state, ctrl('c'), press('ArrowDown'), ctrl('v')))).toEqual([kicks, kicks])
    expect(kickHits(keys(state, ctrl('Backspace')))).toEqual(['.... .... .... ....'])
  })

  it('deletes a lone bar with only kicks in it, leaving a bar of rests', () => {
    const only = kick(newEditorState(newExercise({ id: 'e1', now: 0 })), 0, 0, 0)
    expect(kickHits(applyEdit(only, { type: 'deleteBar' }))).toEqual(['.... .... .... ....'])
  })

  it('cuts a kick tie that would run into an added bar', () => {
    const twoBars = applyEdit(newEditorState(newExercise({ id: 'e1', now: 0 })), { type: 'addBar' })
    const tied = applyEdit(kick(twoBars, 0, 3, 0), {
      type: 'setHold',
      from: { row: 'kick', bar: 0, beat: 3, position: 0 },
      to: { row: 'kick', bar: 1, beat: 0, position: 2 },
    })
    expect(editorBeatViews(tied)[1][0].kick.tiedInto).toBe(true)
    const added = applyEdit({ ...tied, cursor: cursorAt(0, 0) }, { type: 'addBar' })
    expect(editorBeatViews(added)[1][0].kick.tiedInto).toBe(false)
    expect(added.exercise.bars[0].kick.at(-1)).toMatchObject({ tiedToNext: false })
  })
})

describe("the cursor's row", () => {
  /** Each bar's kick row, as hits per beat. */
  const kickHits = (state: EditorState) => editorBeatViews(state).map((bar) => bar.map((v) => v.kick.hits).join(' '))

  it('starts in the snare row; Tab moves to the other row', () => {
    expect(fresh().cursor.row).toBe('snare')
    const tabbed = keys(fresh(), press('Tab'))
    expect(tabbed.cursor).toEqual(cursorAt(0, 0, 'kick'))
    expect(keys(tabbed, press('Tab')).cursor.row).toBe('snare')
  })

  it('undo takes the cursor back to the row of the change, and redo to where undo left it', () => {
    const state = keys(click(fresh(), 0, 1, 0, 'kick'), press('Tab'), press('ArrowRight'))
    const undone = keys(state, ctrl('z'))
    expect(undone.cursor).toEqual(cursorAt(0, 0, 'snare'))
    expect(kickHits(undone)[0]).toBe('.... .... .... ....')
    expect(keys(undone, ctrl('z', { shiftKey: true })).cursor).toEqual(cursorAt(0, 2, 'snare'))
  })

  it('stays in its row as the cursor moves', () => {
    expect(keys(fresh(), press('Tab'), press('ArrowRight'), press('Home')).cursor.row).toBe('kick')
  })

  it('Backspace and Delete rest the beat in the cursor row only', () => {
    // Snare 1111, kick 2222, cursor on the kick row's beat 3.
    const kicked = type('2222'.split(''), { ...type('1111'.split('')), cursor: cursorAt(0, 0, 'kick') })
    const both = { ...kicked, cursor: cursorAt(0, 2, 'kick') }
    expect(kickHits(keys(both, press('Backspace')))[0]).toBe('x.x. x.x. .... x.x.')
    expect(kickHits(keys(both, press('Delete')))[0]).toBe('x.x. x.x. .... x.x.')
    for (const key of ['Backspace', 'Delete']) expect(figureKeys(keys(both, press(key)))[0]).toBe('1111')
  })
})
