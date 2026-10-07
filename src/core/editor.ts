// The grid editor's commands: a pure reducer over the editor state, and the key map that
// turns a key press into a command, so the UI only dispatches.

import { FIGURES, REST_FIGURE } from './figures'
import type { Bar, Exercise, Hand, LoopRange } from './model'
import {
  BEATS_PER_BAR,
  TICKS_PER_BEAT,
  beatIndex,
  itemTicks,
  loopRangeAfterDelete,
  loopRangeAfterInsert,
  restBar,
  withLoopRange,
  withLoopRangeInBars,
} from './model'
import type { BeatView, GridPoint } from './speller'
import { beatViews, clearBeatToDownbeat, setBeat, setHold, toggleCutShort, toggleHit, toggleTie } from './speller'
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

/**
 * Insert mode types figures; Normal mode takes vim commands. A bar selection in Normal mode acts as
 * vim's Visual Line mode.
 */
export type EditorMode = 'insert' | 'normal'

export interface EditorState {
  exercise: Exercise
  cursor: Cursor
  selection: BarSelection | null
  /** Bars copied with Ctrl+C or yanked, kept for the session only. */
  clipboard: Bar[] | null
  history: History
  mode: EditorMode
  /** The keys typed so far of an unfinished Normal-mode command, such as `2d`. */
  pending: string
  /** The last keyboard command that changed the bars, for `.` to repeat. */
  lastChange: RepeatableCommand | null
  /**
   * The pending grid: beats (bar × 4 + beat) switched to the triplet grid whose notes read the same
   * on either grid (empty, or only a downbeat), so can't say so yet. Not saved; a beat leaves it
   * when a hit fixes its grid or its content changes by any other command.
   */
  pendingGrid: number[]
}

/** The exercise settings that are edited like its notes: every change to them can be undone. */
export type ExerciseSettings = Pick<Exercise, 'sticking' | 'leadHand' | 'voice'>

const SETTING_KEYS: readonly (keyof ExerciseSettings)[] = ['sticking', 'leadHand', 'voice']

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
  | { type: 'enterFigure'; hits: string }
  /**
   * A click on a beat's grid position (from 0, on the beat's grid): turns a hit there on or off, and
   * moves the cursor to that beat without advancing. Never repeated by `.`.
   */
  | { type: 'toggleGridPosition'; bar: number; beat: number; position: number }
  /**
   * A drag on a note in the beat strip: sets where the hold of the note sounding at `from` ends (at
   * `to`, which is not held), and moves the cursor to `from`'s beat without advancing. Never
   * repeated by `.`.
   */
  | { type: 'setHold'; from: GridPoint; to: GridPoint }
  /**
   * The 3/16 toggle or a right-click on a beat box: puts the beat on the triplet or the sixteenth
   * grid, keeping a note on the downbeat and clearing the others, and moves the cursor to that beat
   * without advancing. Never repeated by `.`.
   */
  | { type: 'setBeatGrid'; bar: number; beat: number; triplet: boolean }
  | { type: 'toggleTie' }
  | { type: 'toggleCutShort' }
  /** Moves the cursor by beats or bars, stopping at the ends of the exercise. */
  | { type: 'move'; by: 'beat' | 'bar'; step: number }
  | { type: 'moveTo'; bar: number; beat: number }
  /** To the first or last beat of the exercise, or of the cursor bar. */
  | { type: 'jump'; to: 'start' | 'end' | 'barStart' | 'barEnd' }
  /** vim's `3G`: to the first beat of that bar, kept inside the exercise. */
  | { type: 'goToBar'; bar: number }
  /** vim's `w`/`b`: on to the start of the next bar (or the last beat), or back to the start of a bar. */
  | { type: 'moveWord'; step: number }
  /**
   * Turns the cursor beat into a rest, then steps back a beat (Backspace) or stays (Delete); with a
   * count, that many beats from the cursor on (vim's `3x`).
   */
  | { type: 'rest'; stepBack: boolean; count?: number }
  /** Adds a bar of rests after the cursor bar. */
  | { type: 'addBar' }
  /** vim's `o`/`O`: adds a bar of rests below or above the cursor bar, and goes to Insert mode on it. */
  | { type: 'openBar'; above: boolean }
  | { type: 'duplicateBar' }
  /**
   * Deletes the given bar, or else the selected bars, or else the cursor bar and (with a count) the
   * bars after it.
   */
  | { type: 'deleteBar'; bar?: number; count?: number }
  /** Extends the bar selection by a bar, moving the cursor to its moving end. */
  | { type: 'selectBars'; step: number }
  /** Copies the selected bars, or else the cursor bar and (with a count) the bars after it. */
  | { type: 'copyBars'; count?: number }
  /** Pastes the copied bars over the bars from the cursor bar on, growing the exercise if needed. */
  | { type: 'pasteBars' }
  /** vim's `p`/`P`: puts the copied bars, `count` times over, after or before the cursor bar. */
  | { type: 'putBars'; before: boolean; count?: number }
  /**
   * vim's `p` over a selection: replaces the selected bars, or else the cursor bar and (with a
   * count) the bars after it, with the copied ones.
   */
  | { type: 'replaceBars'; count?: number }
  /** vim's `.`: makes the last change again at the cursor, with another count if given. */
  | { type: 'repeatChange'; count?: number }
  /** vim's `r`: sets the cursor beat, and with a count the beats after it, to a figure, without moving on. */
  | { type: 'replaceBeats'; hits: string; count?: number }
  | { type: 'setExerciseSettings'; settings: Partial<ExerciseSettings> }
  /**
   * Sets the opposite hand as a sticking override on a struck note, or clears its override. Does
   * nothing while sticking is hidden.
   */
  | { type: 'flipOverride'; note: OverrideTarget }
  | { type: 'resetOverrides' }
  | { type: 'undo'; count?: number }
  | { type: 'redo'; count?: number }
  /** Esc: leaves Insert mode, stepping back onto the last beat typed, or ends a selection or pending keys. */
  | { type: 'normal' }
  /** Back to Insert mode, on the cursor beat or (`after`) the beat after it. */
  | { type: 'insert'; after?: boolean }
  /** Keys typed toward a Normal-mode command that isn't complete yet; empty to drop them. */
  | { type: 'pending'; keys: string }

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
  return {
    exercise,
    cursor: { bar: 0, beat: 0 },
    selection: null,
    clipboard: null,
    history: { undo: [], redo: [] },
    mode: 'insert',
    pending: '',
    lastChange: null,
    pendingGrid: [],
  }
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
  let next = apply(state, command)
  // Any finished command, or any other key, drops the keys pending.
  if (next.pending && command.type !== 'pending') next = { ...next, pending: '' }
  const exercise = withLoopRangeInBars(next.exercise)
  return exercise === next.exercise ? next : { ...next, exercise }
}

function apply(state: EditorState, command: EditCommand): EditorState {
  switch (command.type) {
    case 'selectBars':
      return selectBars(state, command.step)
    case 'pending':
      return { ...state, pending: command.keys }
    case 'normal': {
      const stopped = clearSelection(state)
      if (state.mode === 'normal') return stopped
      return { ...edit(stopped, { type: 'move', by: 'beat', step: -1 }), mode: 'normal' }
    }
    case 'insert': {
      const moved = command.after ? edit(state, { type: 'move', by: 'beat', step: 1 }) : state
      return { ...clearSelection(moved), mode: 'insert' }
    }
    case 'move':
    case 'moveWord':
    case 'jump':
    case 'goToBar':
      // In Normal mode a selection is vim's Visual Line mode: moving takes the selection along.
      if (state.mode === 'normal' && state.selection) return selectTo(state, edit(state, command).cursor)
      return record(state, command)
    case 'repeatChange': {
      const last = state.lastChange
      if (!last) return state
      const repeated = command.count && COUNTED.has(last.type) ? ({ ...last, count: command.count } as RepeatableCommand) : last
      // Repeating a change never changes the mode, as a repeated `o` would.
      return { ...record(state, repeated), mode: state.mode }
    }
    default:
      return record(state, command)
  }
}

/** The commands that go through the undo history, the ones `.` can repeat among them. */
export type RecordedCommand = Exclude<EditCommand, { type: 'selectBars' | 'pending' | 'normal' | 'insert' | 'repeatChange' }>

/** The mouse's edits on the beat strip, which `.` never repeats. */
type MouseCommand = Extract<RecordedCommand, { type: 'toggleGridPosition' | 'setBeatGrid' | 'setHold' }>

const MOUSE_COMMANDS = new Set<EditCommand['type']>(['toggleGridPosition', 'setBeatGrid', 'setHold'])

/** The changes `.` can repeat: the keyboard's. */
export type RepeatableCommand = Exclude<RecordedCommand, MouseCommand>

const isMouseCommand = (command: RecordedCommand): command is MouseCommand => MOUSE_COMMANDS.has(command.type)

/** The changes that take a count, which a count given to `.` replaces. */
const COUNTED = new Set<EditCommand['type']>(['rest', 'deleteBar', 'putBars', 'replaceBars', 'replaceBeats'])

function record(state: EditorState, command: RecordedCommand): EditorState {
  if (command.type === 'undo' || command.type === 'redo') {
    let next = state
    for (let i = 0; i < (command.count ?? 1); i++) next = travel(next, command.type)
    return clearSelection(next)
  }
  // Copying keeps the selection in Insert mode; any other command ends it, once it has had the
  // chance to act on it, as copying does in Normal mode (vim's Visual mode ends with a yank).
  const edited = withPendingGridChecked(state, edit(state, command), command)
  const next = command.type === 'copyBars' && state.mode === 'insert' ? edited : clearSelection(edited)
  const sameGrid = next.pendingGrid === state.pendingGrid
  if (next.exercise.bars === state.exercise.bars && sameSettings(next.exercise, state.exercise) && sameGrid) return next
  const undo = [...state.history.undo, snapshot(state)].slice(-UNDO_LIMIT)
  const unrepeated = next.exercise.bars === state.exercise.bars || isMouseCommand(command)
  const lastChange = unrepeated ? state.lastChange : repeatable(state, command)
  return { ...next, history: { undo, redo: [] }, lastChange }
}

/**
 * A change as `.` repeats it: one that acted on a selection or a clicked bar acts on as many bars
 * from the cursor, and a typed figure is stamped in place, as `r` does.
 */
function repeatable(state: EditorState, command: RepeatableCommand): RepeatableCommand {
  if (command.type === 'enterFigure') return { type: 'replaceBeats', hits: command.hits }
  if (command.type === 'deleteBar' && command.bar !== undefined) return { type: 'deleteBar' }
  if (command.type !== 'deleteBar' && command.type !== 'replaceBars') return command
  const { first, last } = selectedBars(state, command.count)
  return { type: command.type, count: last - first + 1 }
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
  if (isMouseCommand(command) || pendingGrid.length === 0 || after.exercise.bars === before.exercise.bars) return after
  if (after.exercise.bars.length !== before.exercise.bars.length) return { ...after, pendingGrid: [] }
  const was = beatViews(before.exercise.bars).flat()
  const now = beatViews(after.exercise.bars).flat()
  const kept = pendingGrid.filter((i) => sameBeatView(was[i], now[i]))
  return kept.length === pendingGrid.length ? after : { ...after, pendingGrid: kept }
}

/** Two views of a beat that read the same. Figures are compared as the palette's own objects. */
function sameBeatView(a: BeatView, b: BeatView): boolean {
  return (
    a.figure === b.figure &&
    a.hits === b.hits &&
    a.tiedInto === b.tiedInto &&
    a.cutShort === b.cutShort &&
    a.triplet === b.triplet &&
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
      // A typed figure sets the beat's grid itself.
      const pendingGrid = withPending(state.pendingGrid, beatIndex(bar, beat), false)
      return { ...withBars(state, bars), cursor, pendingGrid }
    }
    case 'toggleGridPosition': {
      const moved = moveTo(state, command.bar, command.beat)
      const { bar, beat } = moved.cursor
      const index = beatIndex(bar, beat)
      const pending = state.pendingGrid.includes(index)
      const bars = toggleHit(state.exercise.bars, bar, beat, command.position, pending || undefined)
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
      const moved = moveTo(state, command.from.bar, command.from.beat)
      const bars = setHold(state.exercise.bars, command.from, command.to, state.pendingGrid)
      if (bars === state.exercise.bars) return moved
      // As with a click: a beat on the triplet grid stays there while it reads the same on either.
      return { ...withBars(moved, bars), pendingGrid: pendingGridAfter(state, bars) }
    }
    case 'toggleTie':
    case 'toggleCutShort': {
      const { bar, beat } = state.cursor
      const toggle = command.type === 'toggleTie' ? toggleTie : toggleCutShort
      const bars = toggle(state.exercise.bars, bar, beat)
      return bars === state.exercise.bars ? state : withBars(state, bars)
    }
    case 'rest': {
      const rested = setBeats(state, REST_FIGURE.hits, command.count ?? 1)
      return command.stepBack ? edit(rested, { type: 'move', by: 'beat', step: -1 }) : rested
    }
    case 'replaceBeats': {
      const count = command.count ?? 1
      return edit(setBeats(state, command.hits, count), { type: 'move', by: 'beat', step: count - 1 })
    }
    case 'addBar':
    case 'openBar': {
      const at = command.type === 'openBar' && command.above ? state.cursor.bar : state.cursor.bar + 1
      const added = { ...insertBars(state, at, [restBar()]), cursor: { bar: at, beat: 0 } }
      return command.type === 'openBar' ? { ...added, mode: 'insert' } : added
    }
    case 'duplicateBar': {
      // The copy goes in front, so a tie into the bar and a tie out of it both stay where they were.
      const { bar, beat } = state.cursor
      const { bars } = state.exercise
      const next = [...bars.slice(0, bar), ...untieLast([bars[bar]]), ...bars.slice(bar)]
      return { ...withBarsInserted(state, next, bar, 1), cursor: { bar: bar + 1, beat } }
    }
    case 'deleteBar': {
      if (command.bar !== undefined) return deleteBars(state, command.bar, command.bar)
      const { first, last } = selectedBars(state, command.count)
      return deleteBars(state, first, last)
    }
    case 'copyBars': {
      const { first, last } = selectedBars(state, command.count)
      return { ...state, clipboard: state.exercise.bars.slice(first, last + 1) }
    }
    case 'putBars': {
      const clip = state.clipboard
      if (!clip) return state
      const at = command.before ? state.cursor.bar : state.cursor.bar + 1
      const copies = Array.from({ length: command.count ?? 1 }, () => untieLast(clip)).flat()
      return { ...insertBars(state, at, copies), cursor: { bar: at, beat: 0 } }
    }
    case 'replaceBars': {
      const clip = state.clipboard
      if (!clip) return state
      const { first, last } = selectedBars(state, command.count)
      const { bars, practice } = state.exercise
      const next = [...untieLast(bars.slice(0, first)), ...untieLast(clip), ...bars.slice(last + 1)]
      const loopRange = loopRangeAfterInsert(loopRangeAfterDelete(practice.loopRange, first, last), first, clip.length)
      return { ...state, exercise: withLoopRange({ ...state.exercise, bars: next }, loopRange), cursor: { bar: first, beat: 0 } }
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
      const index = clamp(beatIndex(bar, beat) + command.step, 0, total - 1)
      return moveTo(state, Math.floor(index / BEATS_PER_BAR), index % BEATS_PER_BAR)
    }
    case 'moveTo':
      return moveTo(state, command.bar, command.beat)
    case 'goToBar':
      return moveTo(state, command.bar, 0)
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
    case 'jump': {
      const { bar } = state.cursor
      const last = state.exercise.bars.length - 1
      const [toBar, toBeat] = {
        start: [0, 0],
        end: [last, BEATS_PER_BAR - 1],
        barStart: [bar, 0],
        barEnd: [bar, BEATS_PER_BAR - 1],
      }[command.to]
      return moveTo(state, toBar, toBeat)
    }
    case 'moveWord': {
      let { bar, beat } = state.cursor
      const last = state.exercise.bars.length - 1
      for (let i = 0; i < Math.abs(command.step); i++) {
        if (command.step > 0) [bar, beat] = bar < last ? [bar + 1, 0] : [bar, BEATS_PER_BAR - 1]
        else [bar, beat] = beat > 0 ? [bar, 0] : [Math.max(0, bar - 1), 0]
      }
      return moveTo(state, bar, beat)
    }
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
  return selectTo(state, { bar: clamp(bar + step, 0, state.exercise.bars.length - 1), beat })
}

/** Moves the cursor, taking the moving end of the bar selection (or a new one) along with it. */
function selectTo(state: EditorState, cursor: Cursor): EditorState {
  const { first, last } = selectedBars(state)
  const anchor = state.cursor.bar === first ? last : first
  const head = cursor.bar
  return { ...state, cursor, selection: { first: Math.min(anchor, head), last: Math.max(anchor, head) } }
}

/** The selection, or else the cursor bar and `count - 1` bars after it, as many as there are. */
function selectedBars(state: EditorState, count = 1): BarSelection {
  const { bar } = state.cursor
  return state.selection ?? { first: bar, last: Math.min(bar + count - 1, state.exercise.bars.length - 1) }
}

/**
 * Sets `count` beats from the cursor on, as many as there are, to a figure, which also takes them
 * off the pending grid. A rest over a rest, or a figure over the same figure (not cut short, holds
 * at their defaults), is no change.
 */
function setBeats(state: EditorState, hits: string, count: number): EditorState {
  const views = editorBeatViews(state)
  const from = beatIndex(state.cursor.bar, state.cursor.beat)
  const to = Math.min(from + count, views.length * BEATS_PER_BAR)
  let { bars } = state.exercise
  for (let i = from; i < to; i++) {
    const bar = Math.floor(i / BEATS_PER_BAR)
    const beat = i % BEATS_PER_BAR
    const view = views[bar][beat]
    const alreadyRest = hits === REST_FIGURE.hits && !view.hits.includes('x')
    const alreadySet = view.figure?.hits === hits && !view.cutShort
    if (!alreadyRest && !alreadySet) bars = setBeat(bars, bar, beat, hits)
  }
  const pendingGrid = state.pendingGrid.filter((i) => i < from || i >= to)
  const regridded = pendingGrid.length === state.pendingGrid.length ? state : { ...state, pendingGrid }
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

/** What the key map needs to know besides the key: the editor's mode and pending keys, and the vim-keys setting. */
export interface KeyContext {
  mode: EditorMode
  pending: string
  selection: BarSelection | null
  /** Off: there's no Normal mode, and Esc does nothing. */
  vimKeys: boolean
}

const INSERT_CONTEXT: KeyContext = { mode: 'insert', pending: '', selection: null, vimKeys: true }

/**
 * The command a key press gives, or null if it gives none. The arrows, Home/End, Backspace,
 * Delete, Shift+←/→, Ctrl shortcuts and Alt+1–4 work in both modes.
 */
export function commandForKey(press: KeyPress, context: KeyContext = INSERT_CONTEXT): EditCommand | null {
  if (press.altKey && !press.ctrlKey && !press.metaKey) {
    // Alt+1–4 flips the sticking of the 1st–4th struck note of the cursor beat.
    const digit = /^Digit([1-4])$/.exec(press.code ?? '')?.[1] ?? /^[1-4]$/.exec(press.key)?.[0]
    return digit ? { type: 'flipOverride', note: { index: Number(digit) - 1 } } : null
  }
  if (press.altKey || press.metaKey) return null
  const normal = context.vimKeys && context.mode === 'normal'
  if (press.ctrlKey && press.shiftKey) return press.key.toLowerCase() === 'z' ? { type: 'redo' } : null
  if (press.ctrlKey) {
    const key = press.key.length === 1 ? press.key.toLowerCase() : press.key
    if (normal && key === 'r') return { type: 'redo', count: parseCount(context.pending).count }
    return CTRL_KEYS[key] ?? null
  }
  if (press.shiftKey && SHIFT_KEYS[press.key]) return SHIFT_KEYS[press.key]
  if (PLAIN_KEYS[press.key]) return PLAIN_KEYS[press.key]
  if (press.key === 'Escape') return context.vimKeys ? { type: 'normal' } : null
  // Shift with a letter is its capital, even where `key` reports the letter unshifted.
  if (normal) return normalCommand(press.shiftKey && /^[a-z]$/.test(press.key) ? press.key.toUpperCase() : press.key, context)
  const key = press.key.toLowerCase()
  if (key === 't') return { type: 'toggleTie' }
  if (key === '.') return { type: 'toggleCutShort' }
  const figure = figureForKey(key)
  return figure ? { type: 'enterFigure', hits: figure.hits } : null
}

const figureForKey = (key: string) => (key === REST_FIGURE.key ? REST_FIGURE : FIGURES.find((f) => f.key === key))

/** A Normal-mode key, read after the keys pending before it: an optional count, then a command. */
function normalCommand(key: string, { pending, selection }: KeyContext): EditCommand | null {
  if (key.length !== 1) return null
  const keys = pending + key
  const { count, counted, rest } = parseCount(keys)
  if (selection) {
    // vim's Visual Line mode: V again ends it, and an edit acts on the selected bars at once.
    if (rest === 'V') return { type: 'normal' }
    if (rest === 'd' || rest === 'x') return { type: 'deleteBar' }
    if (rest === 'y') return { type: 'copyBars' }
    if (rest === 'p' || rest === 'P') return { type: 'replaceBars' }
  }
  if (['', 'g', 'd', 'y', 'r'].includes(rest)) return { type: 'pending', keys }
  if (rest.length === 2 && rest[0] === 'r') {
    const figure = figureForKey(rest[1].toLowerCase())
    return figure ? { type: 'replaceBeats', hits: figure.hits, count } : { type: 'pending', keys: '' }
  }
  switch (rest) {
    case 'x':
      return { type: 'rest', stepBack: false, count }
    case 'dd':
      return { type: 'deleteBar', count }
    case 'yy':
      return { type: 'copyBars', count }
    case 'p':
      return { type: 'putBars', before: false, count }
    case 'P':
      return { type: 'putBars', before: true, count }
    case 'o':
      return { type: 'openBar', above: false }
    case 'O':
      return { type: 'openBar', above: true }
    case 'u':
      return { type: 'undo', count }
    case '.':
      return { type: 'repeatChange', count: counted ? count : undefined }
    case 'V':
      return { type: 'selectBars', step: 0 }
    case 'h':
      return { type: 'move', by: 'beat', step: -count }
    case 'l':
      return { type: 'move', by: 'beat', step: count }
    case 'w':
      return { type: 'moveWord', step: count }
    case 'b':
      return { type: 'moveWord', step: -count }
    case '0':
      return { type: 'jump', to: 'barStart' }
    case '$':
      return { type: 'jump', to: 'barEnd' }
    case 'gg':
    case 'G':
      if (counted) return { type: 'goToBar', bar: count - 1 }
      return { type: 'jump', to: rest === 'gg' ? 'start' : 'end' }
    case 'i':
      return { type: 'insert' }
    case 'a':
      return { type: 'insert', after: true }
  }
  return pending ? { type: 'pending', keys: '' } : null
}

/** Splits typed keys into the count before them, if any, and the rest. */
function parseCount(keys: string) {
  const [, digits = '', rest] = /^([1-9]\d*)?(.*)$/.exec(keys)!
  const counted = digits !== ''
  // A count is capped, so a slip such as 9999p can't build a huge exercise.
  return { count: counted ? Math.min(Number(digits), MAX_COUNT) : 1, counted, rest }
}

const MAX_COUNT = 100
