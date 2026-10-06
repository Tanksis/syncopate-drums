// App-wide state, and the only caller of the repository: the open exercise autosaves on every change.

import { create } from 'zustand'
import type { DeviceSettings, EditCommand, EditorState, Exercise } from '@/core'
import {
  DEFAULT_DEVICE_SETTINGS,
  addedOnTop,
  applyEdit,
  duplicateExercise,
  exerciseToOpenAtLaunch,
  isUnchangedNew,
  launchListOrder,
  newEditorState,
  newExercise,
  updatedInPlace,
  withBpm,
} from '@/core'
import type { AppStorage } from './repository'
import { openStorage } from './repository'

interface AppState {
  editor: EditorState
  /** Every exercise, in the session's list order; the open one as it is now. */
  library: Exercise[]
  device: DeviceSettings
  /** False when storage couldn't be opened, so changes are not being saved. */
  saving: boolean
  /** Transport: whether playback is running (or starting). */
  playing: boolean
  dispatch: (command: EditCommand) => void
  /** `dragging` marks a slider drag: its many small changes are saved once they settle. */
  setBpm: (bpm: number, options?: { dragging?: boolean }) => void
  setPlaying: (playing: boolean) => void
  openExercise: (id: string) => void
  /** Opens a new Untitled exercise, on top of the list. */
  createExercise: () => void
  /** Opens a copy of the open exercise, on top of the list. */
  duplicateOpenExercise: () => void
  /** Empty or blank names are ignored. */
  renameExercise: (id: string, name: string) => void
}

/** How long a slider must rest before its value is saved. */
const DRAG_SAVE_DELAY_MS = 400

let storage: AppStorage | null = null
let unsaved: Exercise | null = null
let saveTimer: ReturnType<typeof setTimeout> | undefined

/** Saves the exercise now, or once changes settle; either way it supersedes any pending save. */
function autosave(exercise: Exercise, { debounced = false } = {}) {
  unsaved = exercise
  clearTimeout(saveTimer)
  if (debounced) saveTimer = setTimeout(flushSave, DRAG_SAVE_DELAY_MS)
  else flushSave()
}

function flushSave() {
  clearTimeout(saveTimer)
  if (!storage || !unsaved) return
  storage.exercises.put(unsaved).catch((error) => console.error('Autosave failed', error))
  unsaved = null
}

/** Leaving an unchanged new exercise discards it; otherwise any pending save goes out now. */
function leave(exercise: Exercise, library: Exercise[]): Exercise[] {
  if (!isUnchangedNew(exercise)) {
    flushSave()
    return library
  }
  if (unsaved?.id === exercise.id) {
    clearTimeout(saveTimer)
    unsaved = null
  }
  // It is stored only if it was changed and then changed back.
  storage?.exercises.deleteMany([exercise.id]).catch((error) => console.error('Discard failed', error))
  return library.filter((e) => e.id !== exercise.id)
}

const createInitialExercise = () => newExercise({ id: crypto.randomUUID(), now: Date.now() })
const initialExercise = createInitialExercise()

export const useAppStore = create<AppState>()((set, get) => {
  /** Saves a change to the open exercise and keeps its list entry in step, in place. */
  function change(exercise: Exercise, editor: EditorState, options?: { debounced?: boolean }) {
    set({ editor, library: updatedInPlace(get().library, exercise) })
    autosave(exercise, options)
  }

  /** Leaves the open exercise and opens another, now, remembering it as the last one open. */
  function switchTo(next: Exercise, place: (library: Exercise[], next: Exercise) => Exercise[]) {
    const { editor, library, device } = get()
    const opened = { ...next, lastOpened: Date.now() }
    const deviceNow = { ...device, lastOpenedId: opened.id }
    set({
      editor: newEditorState(opened),
      library: place(leave(editor.exercise, library), opened),
      device: deviceNow,
    })
    // A new exercise isn't stored until it is first changed.
    if (!isUnchangedNew(opened)) autosave(opened)
    storage?.device.save(deviceNow).catch((error) => console.error('Saving device settings failed', error))
  }

  return {
    // Replaced by launchApp before the first render.
    editor: newEditorState(initialExercise),
    library: [initialExercise],
    device: DEFAULT_DEVICE_SETTINGS,
    saving: false,
    playing: false,
    dispatch: (command) => {
      const { editor } = get()
      const next = applyEdit(editor, command)
      if (next.exercise !== editor.exercise) change(next.exercise, next)
      else set({ editor: next })
    },
    setBpm: (bpm, { dragging = false } = {}) => {
      const { editor } = get()
      const exercise = withBpm(editor.exercise, bpm)
      change(exercise, { ...editor, exercise }, { debounced: dragging })
    },
    setPlaying: (playing) => set({ playing }),
    openExercise: (id) => {
      const target = get().library.find((e) => e.id === id)
      if (target && id !== get().editor.exercise.id) switchTo(target, updatedInPlace)
    },
    createExercise: () => switchTo(createInitialExercise(), addedOnTop),
    duplicateOpenExercise: () =>
      switchTo(duplicateExercise(get().editor.exercise, { id: crypto.randomUUID(), now: Date.now() }), addedOnTop),
    renameExercise: (id, name) => {
      const trimmed = name.trim()
      const { editor, library } = get()
      const target = library.find((e) => e.id === id)
      if (!trimmed || !target || trimmed === target.name) return
      if (id === editor.exercise.id) {
        const exercise = { ...editor.exercise, name: trimmed }
        change(exercise, { ...editor, exercise })
      } else {
        const renamed = { ...target, name: trimmed }
        set({ library: updatedInPlace(library, renamed) })
        storage?.exercises.put(renamed).catch((error) => console.error('Saving the name failed', error))
      }
    },
  }
})

/**
 * Opens storage and the exercise to work on: the one last open, or a new Untitled one when the
 * library is empty. A new exercise isn't stored until it is first changed. If storage can't be
 * opened, the app runs on an unsaved new exercise and says that it isn't saving.
 */
export async function launchApp() {
  navigator.storage?.persist?.().catch(() => {})
  try {
    const opened = await openStorage()
    const device = await opened.device.load()
    const stored = await opened.exercises.list()
    const found = exerciseToOpenAtLaunch(stored, device.lastOpenedId)
    const now = Date.now()
    const exercise = found ? { ...found, lastOpened: now } : newExercise({ id: crypto.randomUUID(), now })
    if (found) await opened.exercises.put(exercise)
    // The order is taken before the open exercise's new last-opened time, and then kept all session.
    const order = launchListOrder(stored)
    const library = found ? updatedInPlace(order, exercise) : addedOnTop(order, exercise)
    const deviceNow = { ...device, lastOpenedId: exercise.id }
    await opened.device.save(deviceNow)

    // Only now does autosave start, so it never stores a placeholder from a launch that failed halfway.
    storage = opened
    useAppStore.setState({ editor: newEditorState(exercise), library, device: deviceNow, saving: true })
  } catch (error) {
    console.error('Could not open saved exercises', error)
  }
}
