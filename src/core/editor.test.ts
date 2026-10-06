import { describe, expect, it } from 'vitest'
import type { EditorState, KeyPress } from './index'
import { applyEdit, beatViews, commandForKey, newEditorState, newExercise } from './index'

const press = (key: string, mods: Partial<KeyPress> = {}): KeyPress => ({
  key,
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  ...mods,
})

function type(keys: string[], state = newEditorState(newExercise({ id: 'e1', now: 0 }))): EditorState {
  return keys.reduce((s, key) => {
    const command = commandForKey(press(key))
    if (!command) throw new Error(`no command for ${JSON.stringify(key)}`)
    return applyEdit(s, command)
  }, state)
}

const figureKeys = (state: EditorState) => beatViews(state.exercise.bars).map((bar) => bar.map((v) => v.figure?.key).join(''))

describe('a new exercise', () => {
  it('starts from the fixed defaults', () => {
    const ex = newExercise({ id: 'e1', now: 1234 })
    expect(ex).toMatchObject({
      id: 'e1',
      name: 'Untitled',
      voice: 'snare',
      sticking: 'natural',
      leadHand: 'R',
      practice: { bpm: 80, loopRange: null, groove: 'off' },
      lastOpened: 1234,
    })
    expect(ex.practice.swing).toBeCloseTo(0.667, 3)
    expect(ex.bars).toHaveLength(1)
    expect(ex.bars[0].items.every((i) => i.kind === 'rest')).toBe(true)
  })
})

describe('entering figures', () => {
  it('moves the cursor on by a beat after each figure', () => {
    const state = type(['2', '3'])
    expect(state.cursor).toEqual({ bar: 0, beat: 2 })
    expect(figureKeys(state)).toEqual(['23  '])
  })

  it('enters a bar in four keystrokes, then grows the exercise by a bar of rests', () => {
    const state = type(['2', '3', '7', ' '])
    expect(figureKeys(state)).toEqual(['237 ', '    '])
    expect(state.cursor).toEqual({ bar: 1, beat: 0 })
  })

  it('keeps typing into the next bar', () => {
    const state = type(['1', '1', '1', '1', '4', 'z'])
    expect(figureKeys(state)).toEqual(['1111', '4z  '])
    expect(state.cursor).toEqual({ bar: 1, beat: 2 })
  })

  it('leaves the rest of the exercise alone', () => {
    const state = type(['5', '6', '7', '8', '9', '0'])
    expect(state.exercise).toMatchObject({ id: 'e1', name: 'Untitled', practice: { bpm: 80 } })
  })
})

describe('the key map', () => {
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
    expect(commandForKey(press('1', { altKey: true }))).toBeNull()
  })
})
