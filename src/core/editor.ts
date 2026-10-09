// The grid editor's commands: a pure reducer over the editor state, and the key map that
// turns a key press into a command, so the UI only dispatches.

import { REST_FIGURE } from './figures'
import type { Bar, Exercise, Hand, Item, LoopRange, Row } from './model'
import {
  BEATS_PER_BAR,
  ROWS,
  TICKS_PER_BEAT,
  beatIndex,
  itemTicks,
  loopRangeAfterDelete,
  loopRangeAfterInsert,
  restBar,
  withLoopRange,
  withLoopRangeInBars,
} from './model'
import type { BeatView, GridPoint, RowView } from './speller'
import { beatViews, clearBeatToDownbeat, setBeat, setHold, toggleHit, toggleTie } from './speller'
import type { NoteSticking } from './sticking'
import { overrideCount, sticking } from './sticking'

export interface Cursor {
  bar: number
  beat: number
  /** The row the keyboard's edits act on. */
  row: Row
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
  /**
   * The pending grid: beats (bar × 4 + beat) switched to the triplet grid whose notes read the same
   * on either grid (empty, or only a downbeat), so can't say so yet. Not saved; a beat leaves it
   * when a hit fixes its grid or its content changes by any other command.
   */
  pendingGrid: number[]
}

/** The exercise settings that are edited like its notes: every change to them can be undone. */
export type ExerciseSettings = Pick<Exercise, 'sticking' | 'leadHand'>

const SETTING_KEYS: readonly (keyof ExerciseSettings)[] = ['sticking', 'leadHand']

/** The bars, settings and cursor as they were before a change, to go back to. */
interface Snapshot {
  bars: Bar[]
  settings: ExerciseSettings
  cursor: Cursor
  pendingGrid: number[]
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
  /**
   * A click on a beat's grid position in a row (from 0, on the beat's grid): turns a hit there on
   * or off, and moves the cursor to that beat and row without advancing.
   */
  | ({ type: 'toggleGridPosition' } & GridPoint)
  /**
   * A drag on a note in the beat strip: sets where the hold of the note sounding at `from` ends (at
   * `to` in the same row, which is not held), and moves the cursor to `from`'s beat and row
   * without advancing.
   */
  | { type: 'setHold'; from: GridPoint; to: GridPoint }
  /**
   * A beat card's 16ths | trip switch or its menu: puts the beat on the triplet or the
   * sixteenth grid, keeping each row's note on the downbeat and clearing the others, and moves the
   * cursor to that beat without advancing.
   */
  | { type: 'setBeatGrid'; bar: number; beat: number; triplet: boolean }
  /** Moves the cursor by beats or bars, stopping at the ends of the exercise. */
  | { type: 'move'; by: 'beat' | 'bar'; step: number }
  | { type: 'moveTo'; bar: number; beat: number }
  /** Tab: moves the cursor to the other row. */
  | { type: 'moveRow' }
  /** To the first or last beat of the exercise. */
  | { type: 'jump'; to: 'start' | 'end' }
  /**
   * Turns the cursor beat into a rest in the cursor row, then steps back a beat (Backspace) or
   * stays (Delete).
   */
  | { type: 'rest'; stepBack: boolean }
  /** A beat card's menu: turns a beat into a rest in both rows, and moves the cursor to it. */
  | { type: 'restBeat'; bar: number; beat: number }
  /**
   * A beat card's menu: ties a bar's first beat in a row into the last note of the bar before, or
   * unties it, and moves the cursor to that beat and row. Refused, leaving all as it was, where
   * `canTieOverBarline` says no. A beat on the pending grid stays there: it still reads the same.
   */
  | { type: 'tieOverBarline'; bar: number; row: Row }
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

/** A struck note, by its id. */
export type OverrideTarget = { id: string }

/** The parts of a key press the key map reads, as `KeyboardEvent` reports them. */
export interface KeyPress {
  key: string
  ctrlKey: boolean
  altKey: boolean
  metaKey: boolean
  shiftKey: boolean
}

export function newEditorState(exercise: Exercise): EditorState {
  return {
    exercise,
    cursor: { bar: 0, beat: 0, row: 'snare' },
    selection: null,
    clipboard: null,
    history: { undo: [], redo: [] },
    pendingGrid: [],
  }
}

/**
 * Whether a bar's first beat in a row offers "Tie over the barline": it is tied over already, or
 * it could be, as its downbeat is a hit and the bar before ends in a note in that row. Never on the
 * exercise's first beat.
 */
export function canTieOverBarline(state: EditorState, bar: number, row: Row): boolean {
  return tiedOverBarline(state.exercise.bars, bar, row) !== null
}

/**
 * The id of the snare note struck at a grid position, as the editor shows its grid, for a
 * long-press to flip its sticking; null where there is no hand to flip: a rest, a hold, the kick
 * row, or sticking off.
 */
export function stickingNoteAt(state: EditorState, { row, bar, beat, position }: GridPoint): string | null {
  const view = editorBeatViews(state)[bar]?.[beat]
  if (row !== 'snare' || !view || view.snare.positions[position] !== 'hit') return null
  const start = beat * TICKS_PER_BEAT + (position * TICKS_PER_BEAT) / view.snare.positions.length
  const note = sticking(state.exercise).find((n) => n.bar === bar && n.start === start)
  return note?.shown ? note.noteId : null
}

/** The bars with a bar's first beat in a row tied over the barline or untied, or null if it can't be. */
function tiedOverBarline(bars: Bar[], bar: number, row: Row): Bar[] | null {
  if (bar < 1 || bar >= bars.length) return null
  const toggled = toggleTie(bars, row, bar, 0)
  return toggled === bars ? null : toggled
}

/** Each bar's four beats as the editor shows them: beats on the pending grid read as triplets. */
export function editorBeatViews(state: EditorState): BeatView[][] {
  return beatViews(state.exercise.bars, state.pendingGrid)
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

/** The commands that go through the undo history. */
type RecordedCommand = Exclude<EditCommand, { type: 'selectBars' }>

/**
 * The beat strip's own edits, which look after the pending grid themselves. A tie over the barline
 * leaves it as it was: a beat on it holds only its downbeat, tied or struck.
 */
const GRID_COMMANDS = new Set<EditCommand['type']>(['toggleGridPosition', 'setBeatGrid', 'setHold', 'tieOverBarline'])

function record(state: EditorState, command: RecordedCommand): EditorState {
  if (command.type === 'undo' || command.type === 'redo') return clearSelection(travel(state, command.type))
  // Copying keeps the selection, so it can then be deleted; any other command ends it.
  const edited = withPendingGridChecked(state, edit(state, command), command)
  const next = command.type === 'copyBars' ? edited : clearSelection(edited)
  const sameGrid = next.pendingGrid === state.pendingGrid
  if (next.exercise.bars === state.exercise.bars && sameSettings(next.exercise, state.exercise) && sameGrid) return next
  const undo = [...state.history.undo, snapshot(state)].slice(-UNDO_LIMIT)
  return { ...next, history: { undo, redo: [] } }
}

/** The pending grid with a beat in it or out of it. */
function withPending(pendingGrid: number[], index: number, pending: boolean): number[] {
  const others = pendingGrid.filter((i) => i !== index)
  return pending ? [...others, index] : others
}

/**
 * After any command but the grid's own, the pending grid keeps only the beats whose content it
 * left as it was; a change to the number of bars clears it.
 */
function withPendingGridChecked(before: EditorState, after: EditorState, command: RecordedCommand): EditorState {
  const { pendingGrid } = after
  if (GRID_COMMANDS.has(command.type) || pendingGrid.length === 0 || after.exercise.bars === before.exercise.bars) return after
  if (after.exercise.bars.length !== before.exercise.bars.length) return { ...after, pendingGrid: [] }
  const was = beatViews(before.exercise.bars).flat()
  const now = beatViews(after.exercise.bars).flat()
  const kept = pendingGrid.filter((i) => sameBeatView(was[i], now[i]))
  return kept.length === pendingGrid.length ? after : { ...after, pendingGrid: kept }
}

/** Two views of a beat that read the same. Figures are compared as `FIGURES`' own objects. */
function sameBeatView(a: BeatView, b: BeatView): boolean {
  return a.triplet === b.triplet && ROWS.every((row) => sameRowView(a[row], b[row]))
}

/** Two views of one row of a beat that read the same. */
function sameRowView(a: RowView, b: RowView): boolean {
  return (
    a.figure === b.figure &&
    a.hits === b.hits &&
    a.tiedInto === b.tiedInto &&
    a.cutShort === b.cutShort &&
    a.positions.length === b.positions.length &&
    a.positions.every((position, i) => position === b.positions[i])
  )
}

/**
 * The pending grid once a click or a drag has written `bars`. Of the beats from `first` to `last`,
 * one the editor showed on the triplet grid stays there while the new bars don't write it as a
 * triplet group (it reads the same on either grid); beats outside them keep their place in it.
 */
function pendingGridAfter(state: EditorState, bars: Bar[], first = 0, last = Infinity): number[] {
  const before = editorBeatViews(state).flat()
  const after = beatViews(bars).flat()
  const outside = state.pendingGrid.filter((i) => i < first || i > last)
  const inside = before.flatMap((view, i) => (i >= first && i <= last && view.triplet && !after[i].triplet ? [i] : []))
  return [...outside, ...inside]
}

function clearSelection(state: EditorState): EditorState {
  return state.selection ? { ...state, selection: null } : state
}

function snapshot(state: EditorState): Snapshot {
  const { exercise } = state
  const settings = Object.fromEntries(SETTING_KEYS.map((k) => [k, exercise[k]])) as ExerciseSettings
  const { cursor, pendingGrid } = state
  return { bars: exercise.bars, settings, cursor, pendingGrid, loopRange: exercise.practice.loopRange }
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
  const { cursor, pendingGrid } = target
  return { ...state, exercise: resized ? withLoopRange(exercise, target.loopRange) : exercise, cursor, pendingGrid, history }
}

function edit(state: EditorState, command: Exclude<RecordedCommand, { type: 'undo' | 'redo' }>): EditorState {
  switch (command.type) {
    case 'toggleGridPosition': {
      const moved = moveTo(state, command.bar, command.beat, command.row)
      const { bar, beat } = moved.cursor
      const index = beatIndex(bar, beat)
      const pending = state.pendingGrid.includes(index)
      const bars = toggleHit(state.exercise.bars, command.row, bar, beat, command.position, pending || undefined)
      if (bars === state.exercise.bars) return moved
      // A beat on the triplet grid stays there while it reads the same on either grid.
      return { ...withBars(moved, bars), pendingGrid: pendingGridAfter(state, bars, index, index) }
    }
    case 'setBeatGrid': {
      const moved = moveTo(state, command.bar, command.beat)
      const { bar, beat } = moved.cursor
      if (editorBeatViews(state)[bar][beat].triplet === command.triplet) return moved
      const bars = clearBeatToDownbeat(state.exercise.bars, bar, beat)
      const pendingGrid = withPending(state.pendingGrid, beatIndex(bar, beat), command.triplet)
      return { ...withBars(moved, bars), pendingGrid }
    }
    case 'setHold': {
      const moved = moveTo(state, command.from.bar, command.from.beat, command.from.row)
      const bars = setHold(state.exercise.bars, command.from, command.to, state.pendingGrid)
      if (bars === state.exercise.bars) return moved
      // As with a click: a beat on the triplet grid stays there while it reads the same on either.
      return { ...withBars(moved, bars), pendingGrid: pendingGridAfter(state, bars) }
    }
    case 'rest': {
      const { bar, beat, row } = state.cursor
      const rested = restBeat(state, bar, beat, [row])
      return command.stepBack ? edit(rested, { type: 'move', by: 'beat', step: -1 }) : rested
    }
    case 'restBeat': {
      const moved = moveTo(state, command.bar, command.beat)
      return restBeat(moved, moved.cursor.bar, moved.cursor.beat, ROWS)
    }
    case 'tieOverBarline': {
      const bars = tiedOverBarline(state.exercise.bars, command.bar, command.row)
      return bars ? withBars(moveTo(state, command.bar, 0, command.row), bars) : state
    }
    case 'addBar': {
      const at = state.cursor.bar + 1
      return moveTo(insertBars(state, at, [restBar()]), at, 0)
    }
    case 'duplicateBar': {
      // The copy goes in front, so a tie into the bar and a tie out of it both stay where they were.
      const { bar } = state.cursor
      const { bars } = state.exercise
      const next = [...bars.slice(0, bar), ...untieLast([bars[bar]]), ...bars.slice(bar)]
      return { ...withBarsInserted(state, next, bar, 1), cursor: { ...state.cursor, bar: bar + 1 } }
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
      return moveTo(withBars(state, next), bar, 0)
    }
    case 'move': {
      const { bar, beat } = state.cursor
      if (command.by === 'bar') return moveTo(state, bar + command.step, beat)
      const total = state.exercise.bars.length * BEATS_PER_BAR
      const index = clamp(beatIndex(bar, beat) + command.step, 0, total - 1)
      return moveTo(state, Math.floor(index / BEATS_PER_BAR), index % BEATS_PER_BAR)
    }
    case 'moveTo':
      return moveTo(state, command.bar, command.beat)
    case 'moveRow': {
      const { bar, beat, row } = state.cursor
      return moveTo(state, bar, beat, row === 'snare' ? 'kick' : 'snare')
    }
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
        ...bar,
        snare: bar.snare.map((item) => (item.kind === 'note' && item.override ? withoutOverride(item) : item)),
      }))
      return withBars(state, cleared)
    }
    case 'jump': {
      const last = state.exercise.bars.length - 1
      return command.to === 'start' ? moveTo(state, 0, 0) : moveTo(state, last, BEATS_PER_BAR - 1)
    }
  }
}

function overrideTarget(state: EditorState, note: OverrideTarget): NoteSticking | undefined {
  return sticking(state.exercise).find((n) => n.noteId === note.id)
}

/** The bars with the override on the snare note starting at `start` in `bar` set, or cleared. */
function withOverride(bars: Bar[], { bar, start }: Pick<NoteSticking, 'bar' | 'start'>, hand: Hand | undefined): Bar[] {
  let tick = 0
  const snare = bars[bar].snare.map((item) => {
    const at = tick
    tick += itemTicks(item)
    if (at !== start || item.kind !== 'note') return item
    return hand ? { ...item, override: hand } : withoutOverride(item)
  })
  return bars.map((b, i) => (i === bar ? { ...b, snare } : b))
}

function withoutOverride<N extends { override?: Hand }>({ override: _, ...rest }: N): Omit<N, 'override'> {
  return rest
}

function selectBars(state: EditorState, step: number): EditorState {
  const { bar } = state.cursor
  return selectTo(state, { ...state.cursor, bar: clamp(bar + step, 0, state.exercise.bars.length - 1) })
}

/** Moves the cursor, taking the moving end of the bar selection (or a new one) along with it. */
function selectTo(state: EditorState, cursor: Cursor): EditorState {
  const { first, last } = selectedBars(state)
  const anchor = state.cursor.bar === first ? last : first
  const head = cursor.bar
  return { ...state, cursor, selection: { first: Math.min(anchor, head), last: Math.max(anchor, head) } }
}

/** The selection, or else the cursor bar. */
function selectedBars(state: EditorState): BarSelection {
  const { bar } = state.cursor
  return state.selection ?? { first: bar, last: bar }
}

/**
 * Turns a beat into a rest in the given rows, which also takes the beat off the pending grid. A
 * rest over a rest is no change.
 */
function restBeat(state: EditorState, bar: number, beat: number, rows: readonly Row[]): EditorState {
  const pendingGrid = withPending(state.pendingGrid, beatIndex(bar, beat), false)
  const regridded = pendingGrid.length === state.pendingGrid.length ? state : { ...state, pendingGrid }
  const view = editorBeatViews(state)[bar][beat]
  const bars = rows
    .filter((row) => view[row].hits.includes('x'))
    .reduce((bars, row) => setBeat(bars, row, bar, beat, REST_FIGURE.hits), state.exercise.bars)
  return bars === state.exercise.bars ? regridded : withBars(regridded, bars)
}

function withBars(state: EditorState, bars: Bar[]): EditorState {
  return { ...state, exercise: { ...state.exercise, bars } }
}

/** New bars with `count` bars inserted before bar `at`, and the loop range moved to match. */
function withBarsInserted(state: EditorState, bars: Bar[], at: number, count: number): EditorState {
  const loopRange = loopRangeAfterInsert(state.exercise.practice.loopRange, at, count)
  return { ...state, exercise: withLoopRange({ ...state.exercise, bars }, loopRange) }
}

/** Inserts bars before bar `at`; a tie into bar `at` no longer has that bar to run into. */
function insertBars(state: EditorState, at: number, inserted: Bar[]): EditorState {
  const { bars } = state.exercise
  const next = [...untieLast(bars.slice(0, at)), ...inserted, ...bars.slice(at)]
  return withBarsInserted(state, next, at, inserted.length)
}

/**
 * The bars with the last one's final note in each row no longer tied over, for when whatever
 * follows it changes: a tie must not run on into a bar that was never tied into.
 */
function untieLast(bars: Bar[]): Bar[] {
  const last = bars.at(-1)
  if (!last) return bars
  const untied = { snare: untie(last.snare), kick: untie(last.kick) }
  return untied.snare === last.snare && untied.kick === last.kick ? bars : [...bars.slice(0, -1), untied]
}

/** A row's items with the last one no longer tied over, as they were if it isn't. */
function untie(items: Item[]): Item[] {
  const item = items.at(-1)
  return item?.kind === 'note' && item.tiedToNext ? [...items.slice(0, -1), { ...item, tiedToNext: false }] : items
}

/** Deletes bars `first` to `last`; deleting every bar leaves one bar of rests. */
function deleteBars(state: EditorState, first: number, last: number): EditorState {
  const { bars } = state.exercise
  // A lone bar of rests is already what deleting it would leave.
  if (bars.length === 1 && ROWS.every((row) => bars[0][row].every((item) => item.kind === 'rest'))) return state
  const kept = [...untieLast(bars.slice(0, first)), ...bars.slice(last + 1)]
  const next = kept.length > 0 ? kept : [restBar()]
  const loopRange = loopRangeAfterDelete(state.exercise.practice.loopRange, first, last)
  const { bar, beat } = state.cursor
  const cursorBar = bar > last ? bar - (last - first + 1) : Math.min(bar, first)
  return moveTo({ ...state, exercise: withLoopRange({ ...state.exercise, bars: next }, loopRange) }, cursorBar, beat)
}

/** Puts the cursor on a beat, kept inside the exercise, in `row` or else the row it was in. */
function moveTo(state: EditorState, bar: number, beat: number, row = state.cursor.row): EditorState {
  const last = state.exercise.bars.length - 1
  return { ...state, cursor: { bar: clamp(bar, 0, last), beat: clamp(beat, 0, BEATS_PER_BAR - 1), row } }
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
  Tab: { type: 'moveRow' },
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

/**
 * The command a key press gives, or null if it gives none: the arrows, Home/End, Tab, Backspace,
 * Delete, Shift+←/→ and the Ctrl shortcuts. Notes are entered on the grid only (ADR 0009).
 */
export function commandForKey(press: KeyPress): EditCommand | null {
  if (press.altKey || press.metaKey) return null
  if (press.ctrlKey && press.shiftKey) return press.key.toLowerCase() === 'z' ? { type: 'redo' } : null
  if (press.ctrlKey) return CTRL_KEYS[press.key.length === 1 ? press.key.toLowerCase() : press.key] ?? null
  if (press.shiftKey && SHIFT_KEYS[press.key]) return SHIFT_KEYS[press.key]
  return PLAIN_KEYS[press.key] ?? null
}
