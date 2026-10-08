import { describe, expect, it } from 'vitest'
import type { Bar, Cursor, EditorState, ExerciseSettings, KeyPress, Row } from './index'
import { applyEdit, beatViews, commandForKey, editorBeatViews, loopAt, newEditorState, newExercise, sticking, withBpm, withGroove, withLoopRange, withSwing } from './index'

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

function type(keys: string[], state = newEditorState(newExercise({ id: 'e1', now: 0 }))): EditorState {
  return keys.reduce((s, key) => {
    const command = commandForKey(press(key))
    if (!command) throw new Error(`no command for ${JSON.stringify(key)}`)
    return applyEdit(s, command)
  }, state)
}

/** The snare row's beats as the editor shows them, each with the beat's shared grid. */
const snareViews = (bars: Bar[], tripletBeats?: number[]) =>
  beatViews(bars, tripletBeats).map((beats) => beats.map((v) => ({ ...v.snare, triplet: v.triplet })))

/** As `snareViews`, with the editor's pending grid. */
const editorSnareViews = (state: EditorState) =>
  editorBeatViews(state).map((beats) => beats.map((v) => ({ ...v.snare, triplet: v.triplet })))

const figureKeys = (state: EditorState) => snareViews(state.exercise.bars).map((bar) => bar.map((v) => v.figure?.key).join(''))

describe('a new exercise', () => {
  it('starts from the fixed defaults', () => {
    const ex = newExercise({ id: 'e1', now: 1234 })
    expect(ex).toMatchObject({
      id: 'e1',
      name: 'Untitled',
      sticking: 'natural',
      leadHand: 'R',
      practice: { bpm: 80, loopRange: null, groove: 'off' },
      lastOpened: 1234,
    })
    expect(ex.practice.swing).toBeCloseTo(0.667, 3)
    expect(ex.bars).toHaveLength(1)
    expect(ex.bars[0].snare.every((i) => i.kind === 'rest')).toBe(true)
    expect(ex.bars[0].kick.every((i) => i.kind === 'rest')).toBe(true)
    expect(ex).not.toHaveProperty('voice')
  })
})

describe('entering figures', () => {
  it('moves the cursor on by a beat after each figure', () => {
    const state = type(['2', '3'])
    expect(state.cursor).toEqual(cursorAt(0, 2))
    expect(figureKeys(state)).toEqual(['23  '])
  })

  it('enters a bar in four keystrokes, then grows the exercise by a bar of rests', () => {
    const state = type(['2', '3', '7', ' '])
    expect(figureKeys(state)).toEqual(['237 ', '    '])
    expect(state.cursor).toEqual(cursorAt(1, 0))
  })

  it('keeps typing into the next bar', () => {
    const state = type(['1', '1', '1', '1', '4', 'z'])
    expect(figureKeys(state)).toEqual(['1111', '4z  '])
    expect(state.cursor).toEqual(cursorAt(1, 2))
  })

  it('leaves the rest of the exercise alone', () => {
    const state = type(['5', '6', '7', '8', '9', '0'])
    expect(state.exercise).toMatchObject({ id: 'e1', name: 'Untitled', practice: { bpm: 80 } })
  })
})

describe('the key map', () => {
  it('maps the home row to the triplet figures', () => {
    expect(commandForKey(press('a'))).toEqual({ type: 'enterFigure', hits: 'xxx' })
    expect(commandForKey(press('S'))).toEqual({ type: 'enterFigure', hits: 'x.x' })
    expect(commandForKey(press('h'))).toEqual({ type: 'enterFigure', hits: '..x' })
  })

  it('maps the number row, the bottom row and Space to figures', () => {
    expect(commandForKey(press('2'))).toEqual({ type: 'enterFigure', hits: 'x.x.' })
    expect(commandForKey(press('b'))).toEqual({ type: 'enterFigure', hits: 'xx..' })
    expect(commandForKey(press('B'))).toEqual({ type: 'enterFigure', hits: 'xx..' })
    expect(commandForKey(press(' '))).toEqual({ type: 'enterFigure', hits: '....' })
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
    const ex = newExercise({ id: 'e1', now: 0 })
    expect(withGroove(ex, 'jazzFeathered').practice).toEqual({ ...ex.practice, groove: 'jazzFeathered' })
    expect(withGroove(ex, 'off')).toBe(ex)
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
    const typed = type(['1'], newEditorState(five()))
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

describe('ties and cut short', () => {
  const views = (state: EditorState) => snareViews(state.exercise.bars)[state.cursor.bar]

  it('T ties the cursor beat into the one before it, without moving the cursor', () => {
    const state = { ...type(['1', '1']), cursor: cursorAt(0, 1) }
    const tied = type(['t'], state)
    expect(tied.cursor).toEqual(cursorAt(0, 1))
    expect(views(tied)[1].tiedInto).toBe(true)
    expect(views(type(['T'], tied))[1].tiedInto).toBe(false)
  })

  it('. cuts the cursor beat short, without moving the cursor', () => {
    const state = { ...type(['1']), cursor: cursorAt(0, 0) }
    const cut = type(['.'], state)
    expect(cut.cursor).toEqual(cursorAt(0, 0))
    expect(views(cut)[0].cutShort).toBe(true)
    expect(views(type(['.'], cut))[0].cutShort).toBe(false)
  })

  it('leaves the state alone when there is nothing to tie or cut', () => {
    const state = type(['3'])
    expect(type(['t'], state)).toBe(state)
    expect(type(['.'], state)).toBe(state)
  })

  it('maps T and . to the toggles', () => {
    expect(commandForKey(press('t'))).toEqual({ type: 'toggleTie' })
    expect(commandForKey(press('T'))).toEqual({ type: 'toggleTie' })
    expect(commandForKey(press('.'))).toEqual({ type: 'toggleCutShort' })
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
  const held = () => ({ ...applyEdit({ ...type('111122222222'.split('')), cursor: cursorAt(1, 0) }, { type: 'toggleTie' }) })

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

  it('Ctrl+Z undoes each change in turn, putting the cursor back', () => {
    const state = keys(type(['1', '2', '3']), undo)
    expect(figureKeys(state)).toEqual(['12  '])
    expect(state.cursor).toEqual(cursorAt(0, 2))
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
    const typed = type(['1', '2', '3'])
    const state = keys(typed, undo, undo, redo)
    expect(figureKeys(state)).toEqual(['12  '])
    expect(figureKeys(keys(state, redo))).toEqual(['123 '])
    const changed = type(['5'], state)
    expect(keys(changed, redo).exercise).toBe(changed.exercise)
  })

  it('covers ties, cut short, rests and bar changes, but not moves', () => {
    const start = { ...type(['1', '1']), cursor: cursorAt(0, 1) }
    const moves = ['ArrowLeft', 'ArrowRight']
    const steps = ['t', 'ArrowLeft', '.', 'Backspace', 'ArrowRight', 'Delete'].map((k) => press(k)).concat([ctrl('Enter'), ctrl('d')])
    const edited = keys(start, ...steps)
    const undone = keys(edited, ...steps.filter((p) => !moves.includes(p.key)).map(() => undo))
    expect(undone.exercise.bars).toEqual(start.exercise.bars)
    expect(figureKeys(keys(undone, undo))).toEqual(['1   '])
  })

  it('a rest over a rest is not a change', () => {
    const state = type(['1'])
    expect(keys(state, press('Delete'))).toBe(state)
  })

  it('with nothing to undo or redo, nothing changes', () => {
    const state = type(['1'])
    expect(keys(state, redo).exercise).toBe(state.exercise)
    const fresh = newEditorState(newExercise({ id: 'e1', now: 0 }))
    expect(keys(fresh, undo).exercise).toBe(fresh.exercise)
  })
})

describe('sticking settings', () => {
  const set = (state: EditorState, settings: Partial<ExerciseSettings>) =>
    applyEdit(state, { type: 'setExerciseSettings', settings })

  it('change the exercise, each as one undoable step', () => {
    const start = type(['1', '2'])
    const edited = set(set(start, { sticking: 'alternate' }), { leadHand: 'L' })
    expect(edited.exercise).toMatchObject({ sticking: 'alternate', leadHand: 'L' })
    expect(edited.exercise.bars).toBe(start.exercise.bars)

    const undone = keys(edited, ctrl('z'))
    expect(undone.exercise).toMatchObject({ sticking: 'alternate', leadHand: 'R' })
    expect(keys(undone, ctrl('z')).exercise).toMatchObject({ sticking: 'natural', leadHand: 'R' })
    expect(keys(undone, ctrl('z'), ctrl('z')).exercise.bars).not.toBe(start.exercise.bars)
    expect(keys(undone, ctrl('Z', { shiftKey: true })).exercise.leadHand).toBe('L')
  })

  it('setting what is already set is not a change', () => {
    const state = type(['1'])
    expect(set(state, { sticking: 'natural' })).toBe(state)
  })
})

describe('sticking overrides', () => {
  const alt = (key: string) => press(key, { altKey: true })
  /** The shown hands in order, with `-` for a note that shows none. */
  const hands = (state: EditorState) => sticking(state.exercise).map((n) => n.shown ?? '-').join('')
  const overrides = (state: EditorState) => sticking(state.exercise).map((n) => n.override ?? '-').join('')
  /** `x.x.` `xxxx` under natural sticking, cursor on the sixteenths. */
  const start = () => ({ ...type(['2', '4']), cursor: cursorAt(0, 1) })

  it('Alt+1–4 flips the 1st–4th struck note of the cursor beat, leaving the others alone', () => {
    expect(hands(start())).toBe('RL' + 'RLRL')
    expect(hands(keys(start(), alt('2')))).toBe('RL' + 'RRRL')
    expect(hands(keys(start(), alt('1'), alt('4')))).toBe('RL' + 'LLRR')
  })

  it('flipping an overridden note again clears its override', () => {
    expect(overrides(keys(start(), alt('2'), alt('2')))).toBe('------')
    expect(hands(keys(start(), alt('2'), alt('2')))).toBe('RL' + 'RLRL')
  })

  it('a click flips the note by its id, wherever the cursor is', () => {
    const state = applyEdit(start(), { type: 'flipOverride', note: { id: '0:6' } })
    expect(hands(state)).toBe('RR' + 'RLRL')
    expect(state.cursor).toEqual(cursorAt(0, 1))
  })

  it('counts struck notes only, and does nothing past the last one', () => {
    // `.xxx` then a tie into `x.x.`: the beat's first struck note is the one after the tie.
    const state = { ...keys(type(['9', '2']), press('ArrowLeft'), press('t')), cursor: cursorAt(0, 1) }
    expect(hands(keys(state, alt('1')))).toBe('LRL' + 'R')
    expect(keys(state, alt('2'))).toBe(state)
  })

  it('Alt+1–4 works by the physical key too, as on a Mac where Alt types another character', () => {
    expect(commandForKey(press('¡', { altKey: true, code: 'Digit1' }))).toEqual({ type: 'flipOverride', note: { index: 0 } })
    expect(commandForKey(press('3', { altKey: true }))).toEqual({ type: 'flipOverride', note: { index: 2 } })
  })

  it('each flip is one undoable step', () => {
    const flipped = keys(start(), alt('1'), alt('2'))
    expect(overrides(keys(flipped, ctrl('z')))).toBe('--' + 'L---')
    expect(overrides(keys(flipped, ctrl('z'), ctrl('z')))).toBe('------')
    expect(overrides(keys(flipped, ctrl('z'), ctrl('Z', { shiftKey: true })))).toBe('--' + 'LR--')
  })

  it('survives re-entering a neighbouring beat and a duration change on its own note', () => {
    const flipped = keys(start(), alt('3'))
    // Re-entering beat 1 as straight sixteenths.
    const neighbour = keys({ ...flipped, cursor: cursorAt(0, 0) }, press('4'))
    expect(overrides(neighbour)).toBe('----' + '--L-')
    // `xxxx` → `x...`: the overridden first sixteenth becomes a quarter.
    const longer = keys({ ...keys(start(), alt('1')), cursor: cursorAt(0, 1) }, press('1'))
    expect(snareViews(longer.exercise.bars)[0][1].hits).toBe('x...')
    expect(overrides(longer)).toBe('--' + 'L')
  })

  it('is dropped when its beat becomes a rest', () => {
    const flipped = keys(start(), alt('2'))
    const rested = keys({ ...flipped, cursor: cursorAt(0, 1) }, press('Delete'))
    expect(overrides(rested)).toBe('--')
    expect(overrides(keys({ ...rested, cursor: cursorAt(0, 1) }, press('4')))).toBe('------')
  })

  it('is kept across mode switches, and hidden but kept with sticking off', () => {
    const set = (state: EditorState, settings: Partial<ExerciseSettings>) =>
      applyEdit(state, { type: 'setExerciseSettings', settings })
    const flipped = keys(start(), alt('2'))
    const alternate = set(flipped, { sticking: 'alternate' })
    expect(overrides(alternate)).toBe('--' + '-R--')
    expect(hands(set(flipped, { sticking: 'off' }))).toBe('------')
    expect(hands(set(set(flipped, { sticking: 'off' }), { sticking: 'natural' }))).toBe('RL' + 'RRRL')
    expect(overrides(set(flipped, { sticking: 'off' }))).toBe('--' + '-R--')
  })

  it('cannot be flipped while sticking is hidden', () => {
    const off = applyEdit(start(), { type: 'setExerciseSettings', settings: { sticking: 'off' } })
    expect(keys(off, alt('1'))).toBe(off)
    expect(applyEdit(off, { type: 'flipOverride', note: { id: '0:0' } })).toBe(off)
  })

  it('reset clears every override in one undoable step, and is not a change with none set', () => {
    const flipped = keys(start(), alt('1'), alt('4'), press('ArrowLeft'), alt('2'))
    expect(overrides(flipped)).toBe('-R' + 'L--R')
    const reset = applyEdit(flipped, { type: 'resetOverrides' })
    expect(overrides(reset)).toBe('------')
    expect(overrides(keys(reset, ctrl('z')))).toBe('-R' + 'L--R')
    expect(applyEdit(reset, { type: 'resetOverrides' })).toBe(reset)
  })
})

/**
 * Types keys through the key map in whatever mode the editor is in, as vim writes them: one
 * character per key, with `<Esc>`, `<BS>`, `<Del>`, `<Left>`… and `<C-r>` for Ctrl+R.
 */
function vim(state: EditorState, typed: string, { vimKeys = true } = {}): EditorState {
  const named: Record<string, string> = { Esc: 'Escape', BS: 'Backspace', Del: 'Delete', Left: 'ArrowLeft', Right: 'ArrowRight' }
  const presses = [...typed.matchAll(/<(C-)?(\w+)>|./g)].map(([char, ctrlMod, name]) => {
    if (!name) return press(char, { shiftKey: char !== char.toLowerCase() || '$?'.includes(char) })
    return press(named[name] ?? name, { ctrlKey: !!ctrlMod })
  })
  return presses.reduce((s, p) => {
    const command = commandForKey(p, { ...s, vimKeys })
    return command ? applyEdit(s, command) : s
  }, state)
}

describe('vim modes', () => {
  const fresh = () => newEditorState(newExercise({ id: 'e1', now: 0 }))

  it('opens in Insert mode; Esc goes to Normal mode, stepping back onto the last beat typed', () => {
    expect(fresh().mode).toBe('insert')
    const state = vim(fresh(), '123<Esc>')
    expect(state.mode).toBe('normal')
    expect(state.cursor).toEqual(cursorAt(0, 2))
  })

  it('i returns to Insert on the cursor beat, a on the beat after it', () => {
    const normal = vim(fresh(), '123<Esc>')
    expect(vim(normal, 'i')).toMatchObject({ mode: 'insert', cursor: cursorAt(0, 2) })
    expect(vim(normal, 'a')).toMatchObject({ mode: 'insert', cursor: cursorAt(0, 3) })
    expect(figureKeys(vim(normal, 'a4'))).toEqual(['1234', '    '])
  })

  it('figure keys do not enter figures in Normal mode', () => {
    const normal = vim(fresh(), '1<Esc>')
    expect(vim(normal, '2').exercise).toBe(normal.exercise)
  })

  it('with vim keys off there is no Normal mode: Esc does nothing', () => {
    const state = vim(fresh(), '12<Esc>3', { vimKeys: false })
    expect(state.mode).toBe('insert')
    expect(figureKeys(state)).toEqual(['123 '])
  })

  it('with vim keys off the arrows, Backspace, Delete and Ctrl shortcuts still work', () => {
    const state = vim(fresh(), '1234<Left><Left><BS><Del><C-Enter>', { vimKeys: false })
    expect(figureKeys(state)).toEqual(['1  4', '    ', '    '])
    expect(figureKeys(vim(state, '<C-z>', { vimKeys: false }))).toEqual(['1  4', '    '])
  })
})

describe('vim Normal mode', () => {
  // Bars 1111 | 2222 | 3333 | 4444 | rests, in Normal mode with the cursor on bar 2, beat 3.
  const four = (cursor = cursorAt(1, 2)) => ({ ...vim(type('1111222233334444'.split('')), '<Esc>'), cursor })

  it('h/l move by beat and w/b by bar, a beat being a character and a bar a word', () => {
    expect(vim(four(), 'l').cursor).toEqual(cursorAt(1, 3))
    expect(vim(four(), 'll').cursor).toEqual(cursorAt(2, 0))
    expect(vim(four(), 'h').cursor).toEqual(cursorAt(1, 1))
    expect(vim(four(), 'w').cursor).toEqual(cursorAt(2, 0))
    expect(vim(four(), 'b').cursor).toEqual(cursorAt(1, 0))
    expect(vim(four(), 'bb').cursor).toEqual(cursorAt(0, 0))
    expect(vim(four(cursorAt(4, 1)), 'w').cursor).toEqual(cursorAt(4, 3))
  })

  it('0/$ go to the first and last beat of the bar, gg/G to the start and end of the exercise', () => {
    expect(vim(four(), '0').cursor).toEqual(cursorAt(1, 0))
    expect(vim(four(), '$').cursor).toEqual(cursorAt(1, 3))
    expect(vim(four(), 'gg').cursor).toEqual(cursorAt(0, 0))
    expect(vim(four(), 'G').cursor).toEqual(cursorAt(4, 3))
  })

  it('takes a count before a move, and before G to go to that bar', () => {
    expect(vim(four(), '3l').cursor).toEqual(cursorAt(2, 1))
    expect(vim(four(), '2w').cursor).toEqual(cursorAt(3, 0))
    expect(vim(four(), '10h').cursor).toEqual(cursorAt(0, 0))
    expect(vim(four(), '3G').cursor).toEqual(cursorAt(2, 0))
    expect(vim(four(), '4gg').cursor).toEqual(cursorAt(3, 0))
  })

  it('x turns the cursor beat into a rest, and a count of beats from it, leaving the cursor', () => {
    expect(figureKeys(vim(four(), 'x'))).toEqual(['1111', '22 2', '3333', '4444', '    '])
    const state = vim(four(), '3x')
    expect(figureKeys(state)).toEqual(['1111', '22  ', ' 333', '4444', '    '])
    expect(state.cursor).toEqual(cursorAt(1, 2))
    expect(figureKeys(vim(state, 'u'))).toEqual(['1111', '2222', '3333', '4444', '    '])
  })

  it('dd deletes the cursor bar; 2dd two bars, and u restores both', () => {
    expect(figureKeys(vim(four(), 'dd'))).toEqual(['1111', '3333', '4444', '    '])
    const state = vim(four(), '2dd')
    expect(figureKeys(state)).toEqual(['1111', '4444', '    '])
    expect(state.cursor).toEqual(cursorAt(1, 2))
    const undone = vim(state, 'u')
    expect(figureKeys(undone)).toEqual(['1111', '2222', '3333', '4444', '    '])
    expect(undone.cursor).toEqual(cursorAt(1, 2))
    expect(figureKeys(vim(undone, '<C-r>'))).toEqual(['1111', '4444', '    '])
  })

  it('yy then p puts the bar after the cursor bar, P before it', () => {
    const start = four()
    const yanked = vim(start, 'yy')
    expect(yanked.exercise).toBe(start.exercise)
    const after = vim(yanked, 'wwp')
    expect(figureKeys(after)).toEqual(['1111', '2222', '3333', '4444', '2222', '    '])
    expect(after.cursor).toEqual(cursorAt(4, 0))
    expect(figureKeys(vim(yanked, 'P'))).toEqual(['1111', '2222', '2222', '3333', '4444', '    '])
  })

  it('2yy yanks two bars, and 3p puts them three times', () => {
    const state = vim(four(cursorAt(0, 0)), '2yyG3p')
    expect(figureKeys(state)).toEqual(['1111', '2222', '3333', '4444', '    ', '1111', '2222', '1111', '2222', '1111', '2222'])
    expect(figureKeys(vim(state, 'u'))).toEqual(['1111', '2222', '3333', '4444', '    '])
  })

  it('p with nothing yanked does nothing', () => {
    const state = four()
    expect(vim(state, 'p').exercise).toBe(state.exercise)
  })

  it('o/O open a bar of rests below or above the cursor bar, in Insert mode', () => {
    const below = vim(four(), 'o')
    expect(figureKeys(below)).toEqual(['1111', '2222', '    ', '3333', '4444', '    '])
    expect(below).toMatchObject({ mode: 'insert', cursor: cursorAt(2, 0) })
    const above = vim(four(), 'O5')
    expect(figureKeys(above)).toEqual(['1111', '5   ', '2222', '3333', '4444', '    '])
    expect(above.mode).toBe('insert')
  })

  it('r and a figure key replace the cursor beat, leaving the cursor and the mode', () => {
    const state = vim(four(), 'r5')
    expect(figureKeys(state)).toEqual(['1111', '2252', '3333', '4444', '    '])
    expect(state).toMatchObject({ mode: 'normal', cursor: cursorAt(1, 2) })
    expect(figureKeys(vim(four(), 'r '))).toEqual(['1111', '22 2', '3333', '4444', '    '])
    expect(figureKeys(vim(four(), '2ra'))).toEqual(['1111', '22aa', '3333', '4444', '    '])
    const start = four()
    expect(vim(start, 'rq').exercise).toBe(start.exercise)
  })

  it('. repeats the last change where the cursor is now, with its count unless given another', () => {
    expect(figureKeys(vim(four(), 'dd.'))).toEqual(['1111', '4444', '    '])
    expect(figureKeys(vim(four(), 'r5l.'))).toEqual(['1111', '2255', '3333', '4444', '    '])
    expect(figureKeys(vim(four(cursorAt(0, 0)), '2xw.'))).toEqual(['  11', '  22', '3333', '4444', '    '])
    expect(figureKeys(vim(four(cursorAt(0, 0)), 'xw3.'))).toEqual([' 111', '   2', '3333', '4444', '    '])
  })

  it('. does not repeat moves, yanks or undo, and is one undoable step', () => {
    const state = vim(four(), 'ddlyyu.')
    expect(figureKeys(state)).toEqual(['1111', '3333', '4444', '    '])
    expect(figureKeys(vim(state, 'u'))).toEqual(['1111', '2222', '3333', '4444', '    '])
    const nothing = vim(newEditorState(four().exercise), '<Esc>')
    expect(vim(nothing, '.').exercise).toBe(nothing.exercise)
  })

  it('. repeats a figure typed in Insert mode', () => {
    const state = vim(type(['1', '2']), '<Esc>0.')
    expect(figureKeys(state)).toEqual(['22  '])
  })

  it('. repeats a typed figure in place, as r does: no change on the beat just typed, then stamps with a count', () => {
    const typed = vim(type(['1', '2']), '<Esc>')
    const again = vim(typed, '.')
    expect(again.exercise).toBe(typed.exercise)
    expect(again.cursor).toEqual(cursorAt(0, 1))
    expect(figureKeys(vim(typed, 'l2.'))).toEqual(['1222'])
  })

  it('a counted G or gg extends the selection', () => {
    expect(vim(four(cursorAt(0, 0)), 'V3G').selection).toEqual({ first: 0, last: 2 })
    expect(vim(four(cursorAt(3, 0)), 'V2gg').selection).toEqual({ first: 1, last: 3 })
  })

  it('V selects the cursor bar, moves extend the selection, and y yanks it and ends it', () => {
    const selecting = vim(four(), 'Vw')
    expect(selecting.selection).toEqual({ first: 1, last: 2 })
    expect(selecting.mode).toBe('normal')
    const yanked = vim(selecting, 'y')
    expect(yanked.selection).toBeNull()
    expect(figureKeys(vim(yanked, 'Gp'))).toEqual(['1111', '2222', '3333', '4444', '    ', '2222', '3333'])
  })

  it('V then d (or x) deletes the selected bars', () => {
    expect(figureKeys(vim(four(), 'Vwd'))).toEqual(['1111', '4444', '    '])
    expect(figureKeys(vim(four(), 'Vbx'))).toEqual(['1111', '3333', '4444', '    '])
  })

  it('V then p replaces the selected bars with the yanked ones', () => {
    const state = vim(four(cursorAt(0, 0)), 'yywVwp')
    expect(figureKeys(state)).toEqual(['1111', '1111', '4444', '    '])
    expect(state.selection).toBeNull()
    expect(figureKeys(vim(state, 'u'))).toEqual(['1111', '2222', '3333', '4444', '    '])
  })

  it('Esc or V again ends the selection, staying in Normal mode', () => {
    expect(vim(four(), 'Vw<Esc>')).toMatchObject({ selection: null, mode: 'normal', cursor: cursorAt(2, 0) })
    expect(vim(four(), 'VwV').selection).toBeNull()
  })

  it('the arrows, Backspace, Delete, Ctrl shortcuts and Alt+1–4 work in Normal mode too', () => {
    const context = { ...four(), vimKeys: true }
    expect(commandForKey(press('ArrowRight'), context)).toEqual({ type: 'move', by: 'beat', step: 1 })
    expect(commandForKey(press('Backspace'), context)).toEqual({ type: 'rest', stepBack: true })
    expect(commandForKey(press('Delete'), context)).toEqual({ type: 'rest', stepBack: false })
    expect(commandForKey(ctrl('d'), context)).toEqual({ type: 'duplicateBar' })
    expect(commandForKey(ctrl('z'), context)).toEqual({ type: 'undo' })
    expect(commandForKey(press('1', { altKey: true }), context)).toEqual({ type: 'flipOverride', note: { index: 0 } })
    // Ctrl+Space is left to the transport.
    expect(commandForKey(ctrl(' '), context)).toBeNull()
  })

  it('Ctrl+R redoes only in Normal mode, leaving it to the browser in Insert mode', () => {
    expect(commandForKey(ctrl('r'), { ...four(), vimKeys: true })).toEqual({ type: 'redo', count: 1 })
    expect(commandForKey(ctrl('r'))).toBeNull()
  })

  it('reads Shift and a letter as the capital, even when the key comes unshifted', () => {
    expect(commandForKey(press('g', { shiftKey: true }), { ...four(), vimKeys: true })).toEqual({ type: 'jump', to: 'end' })
  })

  it('Esc drops the keys pending', () => {
    expect(vim(four(), '2d<Esc>').pending).toBe('')
    expect(figureKeys(vim(four(), '2d<Esc>d'))).toEqual(figureKeys(four()))
  })

  it('a key that completes no command drops the keys pending', () => {
    const state = vim(four(), '3q')
    expect(state.pending).toBe('')
    expect(vim(state, 'l').cursor).toEqual(cursorAt(1, 3))
  })
})

describe('clicking grid positions', () => {
  const click = (state: EditorState, bar: number, beat: number, position: number) =>
    applyEdit(state, { type: 'toggleGridPosition', row: 'snare', bar, beat, position })
  const fresh = () => newEditorState(newExercise({ id: 'e1', now: 0 }))

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

  it('works in Insert and Normal mode without changing the mode', () => {
    expect(click(fresh(), 0, 0, 0).mode).toBe('insert')
    const clicked = click(vim(fresh(), '<Esc>'), 0, 3, 0)
    expect(clicked.mode).toBe('normal')
    expect(figureKeys(clicked)).toEqual(['   1'])
  })

  it('is not the change . repeats', () => {
    const clicked = click(vim(fresh(), '2<Esc>'), 0, 2, 3)
    const repeated = vim({ ...clicked, cursor: cursorAt(0, 1) }, '.')
    expect(figureKeys(repeated)).toEqual(['22x '])
  })

  it('removes the & of an eighth pair, giving a quarter', () => {
    expect(figureKeys(click(type(['2']), 0, 0, 2))).toEqual(['1   '])
  })

  it('strikes the downbeat of a tied-into beat again', () => {
    const tied = keys(type(['1', '1']), press('ArrowLeft'), press('t'))
    expect(snareViews(tied.exercise.bars)[0][1].tiedInto).toBe(true)
    const struck = click(tied, 0, 1, 0)
    expect(snareViews(struck.exercise.bars)[0][1]).toMatchObject({ tiedInto: false, figure: { key: '1' } })
  })
})

describe('dragging a hold', () => {
  const drag = (state: EditorState, bar: number, beat: number, position: number, end: number) =>
    applyEdit(state, { type: 'setHold', from: { row: 'snare', bar, beat, position }, to: { row: 'snare', bar, beat, position: end } })
  const text = (state: EditorState) => snareViews(state.exercise.bars)[0].map((v) => v.positions.map((p) => p[0]).join(''))

  it('sets the hold, moving the cursor to the beat without advancing or changing the mode', () => {
    const state = drag(vim(type(['2', '2']), '<Esc>'), 0, 0, 0, 1)
    expect(text(state)[0]).toBe('hehh')
    expect(state.cursor).toEqual(cursorAt(0, 0))
    expect(state.mode).toBe('normal')
    expect(drag(type(['2', '2']), 0, 1, 2, 3).mode).toBe('insert')
  })

  it('is one undo step', () => {
    const state = drag(drag(type(['2']), 0, 0, 2, 3), 0, 0, 0, 1)
    expect(text(keys(state, ctrl('z')))[0]).toBe('hhhe')
    expect(text(keys(state, ctrl('z'), ctrl('z')))[0]).toBe('hhhh')
  })

  it('is not the change . repeats', () => {
    const dragged = drag(vim(type(['4', '4']), '<Esc>'), 0, 0, 0, 1)
    expect(dragged.lastChange).toEqual(vim(type(['4', '4']), '<Esc>').lastChange)
  })

  it('records nothing when the drag changes nothing', () => {
    const state = type(['2'])
    const dragged = drag(state, 0, 0, 0, 0)
    expect(dragged.history).toBe(state.history)
    expect(dragged.cursor).toEqual(cursorAt(0, 0))
  })

  it('a figure key over a beat with custom holds resets them', () => {
    const custom = drag(type(['2']), 0, 0, 0, 1)
    expect(snareViews(custom.exercise.bars)[0][0].figure).toBeUndefined()
    const retyped = type(['2'], { ...custom, cursor: cursorAt(0, 0) })
    expect(figureKeys(retyped)).toEqual(['2   '])
    const replaced = vim({ ...custom, cursor: cursorAt(0, 0) }, '<Esc>r2')
    expect(figureKeys(replaced)).toEqual(['2   '])
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
  const click = (state: EditorState, bar: number, beat: number, position: number) =>
    applyEdit(state, { type: 'toggleGridPosition', row: 'snare', bar, beat, position })
  const fresh = () => newEditorState(newExercise({ id: 'e1', now: 0 }))
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

  it('shows no sixteenth figure for a beat on the pending grid, for the palette to light', () => {
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
    const tied = keys(type(['1', '2']), press('ArrowLeft'), press('t'))
    const state = grid(tied, 0, 1, true)
    expect(view(state, 0, 1)).toMatchObject({ triplet: true, tiedInto: true, positions: ['hold', 'hold', 'hold'] })
  })

  it('moves the cursor to the beat without advancing, keeping the mode', () => {
    const state = grid(vim(fresh(), '<Esc>'), 0, 2, true)
    expect(state.cursor).toEqual(cursorAt(0, 2))
    expect(state.mode).toBe('normal')
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
    const state = grid(type(['a']), 0, 0, true)
    expect(state.history.undo).toHaveLength(1)
    expect(grid(fresh(), 0, 0, false).history.undo).toHaveLength(0)
  })

  it('is not the change . repeats', () => {
    const switched = grid(vim(fresh(), '2<Esc>'), 0, 2, true)
    const repeated = vim({ ...switched, cursor: cursorAt(0, 1) }, '.')
    expect(figureKeys(repeated)).toEqual(['22  '])
  })

  it('leaves the pending grid when the beat changes by any other command, not when another beat does', () => {
    const pending = grid(type(['1', '1']), 0, 1, true)
    expect(view(pending, 0, 1).triplet).toBe(true)
    expect(view(keys(pending, press('t')), 0, 1).triplet).toBe(false)
    expect(view(keys(pending, press('ArrowRight'), press('2')), 0, 1).triplet).toBe(true)
    expect(view(keys(pending, press('1')), 0, 1).triplet).toBe(false)
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
    const yanked = vim(state, '<Esc>yyp')
    expect(kickHits(yanked)).toEqual([kicks, kicks, '.... .... .... ....'])
    expect(figureKeys(yanked)).toEqual(['1234', '1234', '    '])
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
  const fresh = () => newEditorState(newExercise({ id: 'e1', now: 0 }))
  /** Each bar's kick row, as hits per beat. */
  const kickHits = (state: EditorState) => editorBeatViews(state).map((bar) => bar.map((v) => v.kick.hits).join(' '))

  it('starts in the snare row; Tab moves to the other row in either mode', () => {
    expect(fresh().cursor.row).toBe('snare')
    const tabbed = keys(fresh(), press('Tab'))
    expect(tabbed.cursor).toEqual(cursorAt(0, 0, 'kick'))
    expect(keys(tabbed, press('Tab')).cursor.row).toBe('snare')
    expect(vim(fresh(), '<Esc><Tab>').cursor.row).toBe('kick')
    expect(vim(fresh(), '<Esc><Tab><Tab>').cursor.row).toBe('snare')
  })

  it('j moves down to the kick row and k up to the snare row in Normal mode', () => {
    const down = vim(fresh(), '<Esc>j')
    expect(down.cursor.row).toBe('kick')
    expect(vim(down, 'j').cursor.row).toBe('kick')
    expect(vim(down, 'k').cursor.row).toBe('snare')
    expect(vim(down, 'kk').cursor.row).toBe('snare')
  })

  it('Tab then 2 gives two eighths in the kick row, leaving the snare row alone', () => {
    const state = keys(fresh(), press('Tab'), press('2'))
    expect(kickHits(state)).toEqual(['x.x. .... .... ....'])
    expect(figureKeys(state)).toEqual(['    '])
    expect(state.cursor).toEqual(cursorAt(0, 1, 'kick'))
  })

  it('stays in its row as typing runs into a new bar, and as the cursor moves', () => {
    const state = keys(fresh(), press('Tab'), ...'1111'.split('').map((k) => press(k)), press('5'))
    expect(kickHits(state)).toEqual(['x... x... x... x...', 'x.xx .... .... ....'])
    expect(state.cursor).toEqual(cursorAt(1, 1, 'kick'))
    expect(keys(state, press('ArrowUp'), press('Home')).cursor.row).toBe('kick')
  })

  it('Space, Backspace and Delete rest the beat in the cursor row only', () => {
    // Snare 1111, kick 2222, cursor on the kick row's beat 3.
    const kicked = type('2222'.split(''), { ...type('1111'.split('')), cursor: cursorAt(0, 0, 'kick') })
    const both = { ...kicked, cursor: cursorAt(0, 2, 'kick') }
    expect(kickHits(keys(both, press(' ')))[0]).toBe('x.x. x.x. .... x.x.')
    expect(kickHits(keys(both, press('Backspace')))[0]).toBe('x.x. x.x. .... x.x.')
    expect(kickHits(keys(both, press('Delete')))[0]).toBe('x.x. x.x. .... x.x.')
    for (const key of [' ', 'Backspace', 'Delete']) expect(figureKeys(keys(both, press(key)))[0]).toBe('1111')
  })

  it('T and . tie and cut short in the cursor row only', () => {
    const kicked = type(['1', '1'], { ...type('1111'.split('')), cursor: cursorAt(0, 0, 'kick') })
    const both = { ...kicked, cursor: cursorAt(0, 1, 'kick') }
    const tied = keys(both, press('t'))
    expect(editorBeatViews(tied)[0][1]).toMatchObject({ kick: { tiedInto: true }, snare: { tiedInto: false } })
    const cut = keys(both, press('.'))
    expect(editorBeatViews(cut)[0][1]).toMatchObject({ kick: { cutShort: true }, snare: { cutShort: false } })
  })

  it('r replaces the beat in the cursor row only', () => {
    const state = vim({ ...type('1111'.split('')), cursor: cursorAt(0, 0) }, '<Esc>j2r2')
    expect(kickHits(state)[0]).toBe('x.x. x.x. .... ....')
    expect(figureKeys(state)[0]).toBe('1111')
  })

  it('. repeats the last change on the current row', () => {
    // A figure typed in the snare row, then repeated on the kick row's next beat.
    const typed = vim(fresh(), '2<Esc>')
    const repeated = vim(typed, 'jl.')
    expect(kickHits(repeated)[0]).toBe('.... x.x. .... ....')
    expect(figureKeys(repeated)[0]).toBe('2   ')
    // And a rest made in the kick row, repeated back on the snare row.
    const kicked = vim({ ...type('1111'.split('')), cursor: cursorAt(0, 0, 'kick') }, '1111<Esc>')
    const rested = vim({ ...kicked, cursor: cursorAt(0, 0, 'kick') }, 'xkl.')
    expect(kickHits(rested)[0]).toBe('.... x... x... x...')
    expect(figureKeys(rested)[0]).toBe('1 11')
  })
})
