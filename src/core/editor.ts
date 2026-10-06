// The grid editor's commands: a pure reducer over the editor state, and the key map that
// turns a key press into a command, so the UI only dispatches.

import { FIGURES, REST_FIGURE } from './figures'
import type { Exercise } from './model'
import { BEATS_PER_BAR, restBar } from './model'
import { setBeat, toggleCutShort, toggleTie } from './speller'

export interface Cursor {
  bar: number
  beat: number
}

export interface EditorState {
  exercise: Exercise
  cursor: Cursor
}

export type EditCommand =
  | { type: 'enterFigure'; hits: string }
  | { type: 'toggleTie' }
  | { type: 'toggleCutShort' }

/** The parts of a key press the key map reads, as `KeyboardEvent` reports them. */
export interface KeyPress {
  key: string
  ctrlKey: boolean
  altKey: boolean
  metaKey: boolean
}

export function newEditorState(exercise: Exercise): EditorState {
  return { exercise, cursor: { bar: 0, beat: 0 } }
}

export function applyEdit(state: EditorState, command: EditCommand): EditorState {
  switch (command.type) {
    case 'enterFigure': {
      const { bar, beat } = state.cursor
      let bars = setBeat(state.exercise.bars, bar, beat, command.hits)
      let cursor: Cursor
      if (beat < BEATS_PER_BAR - 1) cursor = { bar, beat: beat + 1 }
      else {
        // Typing past the last beat grows the exercise by a bar of rests.
        if (bar === bars.length - 1) bars = [...bars, restBar()]
        cursor = { bar: bar + 1, beat: 0 }
      }
      return { exercise: { ...state.exercise, bars }, cursor }
    }
    case 'toggleTie':
    case 'toggleCutShort': {
      const { bar, beat } = state.cursor
      const toggle = command.type === 'toggleTie' ? toggleTie : toggleCutShort
      const bars = toggle(state.exercise.bars, bar, beat)
      return bars === state.exercise.bars ? state : { ...state, exercise: { ...state.exercise, bars } }
    }
  }
}

export function commandForKey(press: KeyPress): EditCommand | null {
  if (press.ctrlKey || press.altKey || press.metaKey) return null
  const key = press.key.toLowerCase()
  if (key === 't') return { type: 'toggleTie' }
  if (key === '.') return { type: 'toggleCutShort' }
  const figure = key === REST_FIGURE.key ? REST_FIGURE : FIGURES.find((f) => f.key === key)
  return figure ? { type: 'enterFigure', hits: figure.hits } : null
}
