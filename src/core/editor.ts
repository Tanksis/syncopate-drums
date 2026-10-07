// The grid editor's commands: a pure reducer over the editor state, and the key map that
// turns a key press into a command, so the UI only dispatches.

import { FIGURES, REST_FIGURE } from './figures'
import type { Bar, Exercise, Hand, LoopRange } from './model'
import {
  BEATS_PER_BAR,
  TICKS_PER_BEAT,
  itemTicks,
  loopRangeAfterDelete,
  loopRangeAfterInsert,
  restBar,
  withLoopRange,
  withLoopRangeInBars,
} from './model'
import { beatViews, setBeat, toggleCutShort, toggleTie } from './speller'
import type { NoteSticking } from './sticking'
import { overrideCount, sticking } from './sticking'

export interface Cursor {
  bar: number
  beat: number
}

/** A run of whole bars, first to last inclusive. The cursor sits on one end of it. */
export interface BarSelection {
  first: number
  last: number
}

export interface EditorState {
  exercise: Exercise
  cursor: Cursor
  selection: BarSelection | null
  /** Bars copied with Ctrl+C, kept for the session only. */
  clipboard: Bar[] | null
  history: History
}

/** The exercise settings that are edited like its notes: every change to them can be undone. */
export type ExerciseSettings = Pick<Exercise, 'sticking' | 'leadHand' | 'voice'>

const SETTING_KEYS: readonly (keyof ExerciseSettings)[] = ['sticking', 'leadHand', 'voice']

/** The bars, settings and cursor as they were before a change, to go back to. */
interface Snapshot {
  bars: Bar[]
  settings: ExerciseSettings
  cursor: Cursor
  /** Taken back only with a change that added or deleted bars, which moved it. */
  loopRange: LoopRange | null
}

interface History {
  undo: Snapshot[]
  redo: Snapshot[]
}

/** How many changes back undo can go. */
const UNDO_LIMIT = 200

export type EditCommand =
  | { type: 'enterFigure'; hits: string }
  | { type: 'toggleTie' }
  | { type: 'toggleCutShort' }
  /** Moves the cursor by beats or bars, stopping at the ends of the exercise. */
  | { type: 'move'; by: 'beat' | 'bar'; step: number }
  | { type: 'moveTo'; bar: number; beat: number }
  | { type: 'jump'; to: 'start' | 'end' }
  /** Turns the cursor beat into a rest, then steps back a beat (Backspace) or stays (Delete). */
  | { type: 'rest'; stepBack: boolean }
  /** Adds a bar of rests after the cursor bar. */
  | { type: 'addBar' }
  | { type: 'duplicateBar' }
  /** Deletes the given bar, or else the selected bars, or else the cursor bar. */
  | { type: 'deleteBar'; bar?: number }
  /** Extends the bar selection by a bar, moving the cursor to its moving end. */
  | { type: 'selectBars'; step: number }
  /** Copies the selected bars, or else the cursor bar. */
  | { type: 'copyBars' }
  /** Pastes the copied bars over the bars from the cursor bar on, growing the exercise if needed. */
  | { type: 'pasteBars' }
  | { type: 'setExerciseSettings'; settings: Partial<ExerciseSettings> }
  /**
   * Sets the opposite hand as a sticking override on a struck note, or clears its override. Does
   * nothing while sticking is hidden.
   */
  | { type: 'flipOverride'; note: OverrideTarget }
  | { type: 'resetOverrides' }
  | { type: 'undo' }
  | { type: 'redo' }

/** A struck note: the `index`th of the cursor beat (from 0), or the note with that id. */
export type OverrideTarget = { index: number } | { id: string }

/** The parts of a key press the key map reads, as `KeyboardEvent` reports them. */
export interface KeyPress {
  key: string
  ctrlKey: boolean
  altKey: boolean
  metaKey: boolean
  shiftKey: boolean
  /** The physical key, so Alt+digit still reads as a digit where Alt types another character. */
  code?: string
}

export function newEditorState(exercise: Exercise): EditorState {
  return { exercise, cursor: { bar: 0, beat: 0 }, selection: null, clipboard: null, history: { undo: [], redo: [] } }
}

/**
 * Applies a command. Every change to the bars can be undone; moves and copying can't. The loop
 * range moves with its bars as bars are added and deleted, and is kept inside the bars left.
 */
export function applyEdit(state: EditorState, command: EditCommand): EditorState {
  const next = command.type === 'selectBars' ? selectBars(state, command.step) : record(state, command)
  const exercise = withLoopRangeInBars(next.exercise)
  return exercise === next.exercise ? next : { ...next, exercise }
}

function record(state: EditorState, command: Exclude<EditCommand, { type: 'selectBars' }>): EditorState {
  if (command.type === 'undo' || command.type === 'redo') return clearSelection(travel(state, command.type))
  // Copying keeps the selection; any other command ends it, once it has had the chance to act on it.
  const edited = edit(state, command)
  const next = command.type === 'copyBars' ? edited : clearSelection(edited)
  if (next.exercise.bars === state.exercise.bars && sameSettings(next.exercise, state.exercise)) return next
  const undo = [...state.history.undo, snapshot(state)].slice(-UNDO_LIMIT)
  return { ...next, history: { undo, redo: [] } }
}

function clearSelection(state: EditorState): EditorState {
  return state.selection ? { ...state, selection: null } : state
}

function snapshot(state: EditorState): Snapshot {
  const { exercise } = state
  const settings = Object.fromEntries(SETTING_KEYS.map((k) => [k, exercise[k]])) as ExerciseSettings
  return { bars: exercise.bars, settings, cursor: state.cursor, loopRange: exercise.practice.loopRange }
}

const sameSettings = (a: ExerciseSettings, b: ExerciseSettings) => SETTING_KEYS.every((k) => a[k] === b[k])

/** Goes back a change (undo) or forward again (redo), restoring the bars and the cursor. */
function travel(state: EditorState, direction: 'undo' | 'redo'): EditorState {
  const { undo, redo } = state.history
  const target = (direction === 'undo' ? undo : redo).at(-1)
  if (!target) return state
  const history =
    direction === 'undo'
      ? { undo: undo.slice(0, -1), redo: [...redo, snapshot(state)] }
      : { undo: [...undo, snapshot(state)], redo: redo.slice(0, -1) }
  const exercise = { ...state.exercise, bars: target.bars, ...target.settings }
  const resized = target.bars.length !== state.exercise.bars.length
  return { ...state, exercise: resized ? withLoopRange(exercise, target.loopRange) : exercise, cursor: target.cursor, history }
}

function edit(
  state: EditorState,
  command: Exclude<EditCommand, { type: 'selectBars' | 'undo' | 'redo' }>,
): EditorState {
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
      return { ...withBars(state, bars), cursor }
    }
    case 'toggleTie':
    case 'toggleCutShort': {
      const { bar, beat } = state.cursor
      const toggle = command.type === 'toggleTie' ? toggleTie : toggleCutShort
      const bars = toggle(state.exercise.bars, bar, beat)
      return bars === state.exercise.bars ? state : withBars(state, bars)
    }
    case 'rest': {
      const { bar, beat } = state.cursor
      const alreadyRest = !beatViews(state.exercise.bars)[bar][beat].hits.includes('x')
      const rested = alreadyRest ? state : withBars(state, setBeat(state.exercise.bars, bar, beat, REST_FIGURE.hits))
      return command.stepBack ? edit(rested, { type: 'move', by: 'beat', step: -1 }) : rested
    }
    case 'addBar': {
      const { bar } = state.cursor
      const { bars } = state.exercise
      const next = [...untieLast(bars.slice(0, bar + 1)), restBar(), ...bars.slice(bar + 1)]
      return { ...withBarsInserted(state, next, bar + 1), cursor: { bar: bar + 1, beat: 0 } }
    }
    case 'duplicateBar': {
      // The copy goes in front, so a tie into the bar and a tie out of it both stay where they were.
      const { bar, beat } = state.cursor
      const { bars } = state.exercise
      const next = [...bars.slice(0, bar), ...untieLast([bars[bar]]), ...bars.slice(bar)]
      return { ...withBarsInserted(state, next, bar), cursor: { bar: bar + 1, beat } }
    }
    case 'deleteBar': {
      if (command.bar !== undefined) return deleteBars(state, command.bar, command.bar)
      const { first, last } = selectedBars(state)
      return deleteBars(state, first, last)
    }
    case 'copyBars': {
      const { first, last } = selectedBars(state)
      return { ...state, clipboard: state.exercise.bars.slice(first, last + 1) }
    }
    case 'pasteBars': {
      if (!state.clipboard) return state
      const { bar } = state.cursor
      const { bars } = state.exercise
      const clip = state.clipboard
      const next = [...untieLast(bars.slice(0, bar)), ...untieLast(clip), ...bars.slice(bar + clip.length)]
      return { ...withBars(state, next), cursor: { bar, beat: 0 } }
    }
    case 'move': {
      const { bar, beat } = state.cursor
      if (command.by === 'bar') return moveTo(state, bar + command.step, beat)
      const total = state.exercise.bars.length * BEATS_PER_BAR
      const index = clamp(bar * BEATS_PER_BAR + beat + command.step, 0, total - 1)
      return moveTo(state, Math.floor(index / BEATS_PER_BAR), index % BEATS_PER_BAR)
    }
    case 'moveTo':
      return moveTo(state, command.bar, command.beat)
    case 'setExerciseSettings': {
      const exercise = { ...state.exercise, ...command.settings }
      return sameSettings(exercise, state.exercise) ? state : { ...state, exercise }
    }
    case 'flipOverride': {
      const target = overrideTarget(state, command.note)
      // Hidden sticking keeps its overrides as they are.
      if (!target || target.shown === null) return state
      const hand = target.override ? undefined : target.computed === 'R' ? 'L' : 'R'
      return withBars(state, withOverride(state.exercise.bars, target, hand))
    }
    case 'resetOverrides': {
      const { bars } = state.exercise
      if (overrideCount(state.exercise) === 0) return state
      const cleared = bars.map((bar) => ({
        items: bar.items.map((item) => (item.kind === 'note' && item.override ? withoutOverride(item) : item)),
      }))
      return withBars(state, cleared)
    }
    case 'jump':
      return command.to === 'start'
        ? moveTo(state, 0, 0)
        : moveTo(state, state.exercise.bars.length - 1, BEATS_PER_BAR - 1)
  }
}

function overrideTarget(state: EditorState, note: OverrideTarget): NoteSticking | undefined {
  const notes = sticking(state.exercise)
  if ('id' in note) return notes.find((n) => n.noteId === note.id)
  const { bar, beat } = state.cursor
  return notes.filter((n) => n.bar === bar && Math.floor(n.start / TICKS_PER_BEAT) === beat)[note.index]
}

/** The bars with the override on the note starting at `start` in `bar` set, or cleared. */
function withOverride(bars: Bar[], { bar, start }: Pick<NoteSticking, 'bar' | 'start'>, hand: Hand | undefined): Bar[] {
  let tick = 0
  const items = bars[bar].items.map((item) => {
    const at = tick
    tick += itemTicks(item)
    if (at !== start || item.kind !== 'note') return item
    return hand ? { ...item, override: hand } : withoutOverride(item)
  })
  return bars.map((b, i) => (i === bar ? { items } : b))
}

function withoutOverride<N extends { override?: Hand }>({ override: _, ...rest }: N): Omit<N, 'override'> {
  return rest
}

function selectBars(state: EditorState, step: number): EditorState {
  const { bar, beat } = state.cursor
  const { first, last } = selectedBars(state)
  const anchor = bar === first ? last : first
  const head = clamp(bar + step, 0, state.exercise.bars.length - 1)
  return { ...state, cursor: { bar: head, beat }, selection: { first: Math.min(anchor, head), last: Math.max(anchor, head) } }
}

/** The selection, or else just the cursor bar. */
function selectedBars(state: EditorState): BarSelection {
  return state.selection ?? { first: state.cursor.bar, last: state.cursor.bar }
}

function withBars(state: EditorState, bars: Bar[]): EditorState {
  return { ...state, exercise: { ...state.exercise, bars } }
}

/** New bars with one bar inserted before bar `at`, and the loop range moved to match. */
function withBarsInserted(state: EditorState, bars: Bar[], at: number): EditorState {
  const loopRange = loopRangeAfterInsert(state.exercise.practice.loopRange, at, 1)
  return { ...state, exercise: withLoopRange({ ...state.exercise, bars }, loopRange) }
}

/**
 * The bars with the last one's final note no longer tied over, for when whatever follows it
 * changes: a tie must not run on into a bar that was never tied into.
 */
function untieLast(bars: Bar[]): Bar[] {
  const last = bars.at(-1)
  const item = last?.items.at(-1)
  if (!last || item?.kind !== 'note' || !item.tiedToNext) return bars
  return [...bars.slice(0, -1), { items: [...last.items.slice(0, -1), { ...item, tiedToNext: false }] }]
}

/** Deletes bars `first` to `last`; deleting every bar leaves one bar of rests. */
function deleteBars(state: EditorState, first: number, last: number): EditorState {
  const { bars } = state.exercise
  // A lone bar of rests is already what deleting it would leave.
  if (bars.length === 1 && bars[0].items.every((item) => item.kind === 'rest')) return state
  const kept = [...untieLast(bars.slice(0, first)), ...bars.slice(last + 1)]
  const next = kept.length > 0 ? kept : [restBar()]
  const loopRange = loopRangeAfterDelete(state.exercise.practice.loopRange, first, last)
  const { bar, beat } = state.cursor
  const cursorBar = bar > last ? bar - (last - first + 1) : Math.min(bar, first)
  return moveTo({ ...state, exercise: withLoopRange({ ...state.exercise, bars: next }, loopRange) }, cursorBar, beat)
}

/** Puts the cursor on a beat, kept inside the exercise. */
function moveTo(state: EditorState, bar: number, beat: number): EditorState {
  const last = state.exercise.bars.length - 1
  return { ...state, cursor: { bar: clamp(bar, 0, last), beat: clamp(beat, 0, BEATS_PER_BAR - 1) } }
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

const PLAIN_KEYS: Record<string, EditCommand> = {
  ArrowLeft: { type: 'move', by: 'beat', step: -1 },
  ArrowRight: { type: 'move', by: 'beat', step: 1 },
  ArrowUp: { type: 'move', by: 'bar', step: -1 },
  ArrowDown: { type: 'move', by: 'bar', step: 1 },
  Home: { type: 'jump', to: 'start' },
  End: { type: 'jump', to: 'end' },
  Backspace: { type: 'rest', stepBack: true },
  Delete: { type: 'rest', stepBack: false },
}

const SHIFT_KEYS: Record<string, EditCommand> = {
  ArrowLeft: { type: 'selectBars', step: -1 },
  ArrowRight: { type: 'selectBars', step: 1 },
}

const CTRL_KEYS: Record<string, EditCommand> = {
  ArrowLeft: { type: 'move', by: 'bar', step: -1 },
  ArrowRight: { type: 'move', by: 'bar', step: 1 },
  Enter: { type: 'addBar' },
  d: { type: 'duplicateBar' },
  Backspace: { type: 'deleteBar' },
  c: { type: 'copyBars' },
  v: { type: 'pasteBars' },
  z: { type: 'undo' },
}

export function commandForKey(press: KeyPress): EditCommand | null {
  if (press.altKey && !press.ctrlKey && !press.metaKey) {
    // Alt+1–4 flips the sticking of the 1st–4th struck note of the cursor beat.
    const digit = /^Digit([1-4])$/.exec(press.code ?? '')?.[1] ?? /^[1-4]$/.exec(press.key)?.[0]
    return digit ? { type: 'flipOverride', note: { index: Number(digit) - 1 } } : null
  }
  if (press.altKey || press.metaKey) return null
  if (press.ctrlKey && press.shiftKey) return press.key.toLowerCase() === 'z' ? { type: 'redo' } : null
  if (press.ctrlKey) return CTRL_KEYS[press.key.length === 1 ? press.key.toLowerCase() : press.key] ?? null
  if (press.shiftKey && SHIFT_KEYS[press.key]) return SHIFT_KEYS[press.key]
  if (PLAIN_KEYS[press.key]) return PLAIN_KEYS[press.key]
  const key = press.key.toLowerCase()
  if (key === 't') return { type: 'toggleTie' }
  if (key === '.') return { type: 'toggleCutShort' }
  const figure = key === REST_FIGURE.key ? REST_FIGURE : FIGURES.find((f) => f.key === key)
  return figure ? { type: 'enterFigure', hits: figure.hits } : null
}
