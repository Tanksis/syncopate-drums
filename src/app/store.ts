// App-wide state, and the only caller of the repository: the open exercise autosaves on every change.

import { create } from 'zustand'
import type { DeviceSettings, EditCommand, EditorState, Exercise, GroovePresetId } from '@/core'
import {
  DEFAULT_DEVICE_SETTINGS,
  addedOnTop,
  applyEdit,
  duplicateExercise,
  exerciseToOpenAfterDelete,
  exerciseToOpenAtLaunch,
  isUnchangedNew,
  launchListOrder,
  loopAt,
  newEditorState,
  newExercise,
  updatedInPlace,
  withBpm,
  withGroove,
  withLoopRange,
  withSwing,
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
  /** The swing amount, 0.5 (straight) to 0.75; `dragging` as for `setBpm`. */
  setSwing: (swing: number, options?: { dragging?: boolean }) => void
  /** The groove layer played and drawn with the exercise. */
  setGroove: (groove: GroovePresetId) => void
  setPlaying: (playing: boolean) => void
  /** Volumes, the exercise mute and the count-in, kept for this device; `dragging` as for `setBpm`. */
  setDeviceSettings: (settings: Partial<DeviceSettings>, options?: { dragging?: boolean }) => void
  /** Loops just that bar, or with `extend` grows the loop range to take it in. */
  loopBar: (bar: number, options?: { extend?: boolean }) => void
  /** Loops the whole exercise again. */
  loopAll: () => void
  openExercise: (id: string) => void
  /** Opens a new Untitled exercise, on top of the list. */
  createExercise: () => void
  /** Opens a copy of the open exercise, on top of the list. */
  duplicateOpenExercise: () => void
  /** Empty or blank names are ignored. */
  renameExercise: (id: string, name: string) => void
  /**
   * Deletes exercises for good. If the open one goes, the most recently opened one left opens, or a
   * new Untitled one when none are left.
   */
  deleteExercises: (ids: string[]) => void
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

let deviceSaveTimer: ReturnType<typeof setTimeout> | undefined

/** Saves the device settings now, or once a slider drag settles; either way it supersedes any pending save. */
function saveDevice(device: DeviceSettings, { debounced = false } = {}) {
  clearTimeout(deviceSaveTimer)
  const save = () =>
    storage?.device.save(device).catch((error) => console.error('Saving device settings failed', error))
  if (debounced) deviceSaveTimer = setTimeout(save, DRAG_SAVE_DELAY_MS)
  else save()
}

/** Drops exercises from storage, with any save of theirs still pending, and returns the library without them. */
function remove(ids: string[], library: Exercise[]): Exercise[] {
  if (unsaved && ids.includes(unsaved.id)) {
    clearTimeout(saveTimer)
    unsaved = null
  }
  storage?.exercises.deleteMany(ids).catch((error) => console.error('Delete failed', error))
  return library.filter((e) => !ids.includes(e.id))
}

/** Leaving an unchanged new exercise discards it; otherwise any pending save goes out now. */
function leave(exercise: Exercise, library: Exercise[]): Exercise[] {
  if (!isUnchangedNew(exercise)) {
    flushSave()
    return library
  }
  // It is stored only if it was changed and then changed back.
  return remove([exercise.id], library)
}

/** A new Untitled exercise, made now. */
const untitledExercise = () => newExercise({ id: crypto.randomUUID(), now: Date.now() })
const initialExercise = untitledExercise()

export const useAppStore = create<AppState>()((set, get) => {
  /** Saves a change to the open exercise and keeps its list entry in step, in place. */
  function change(exercise: Exercise, editor: EditorState, options?: { debounced?: boolean }) {
    set({ editor, library: updatedInPlace(get().library, exercise) })
    autosave(exercise, options)
  }

  /**
   * Leaves the open exercise and opens another, now, remembering it as the last one open. `remaining`
   * is the library once the open exercise is gone, when it was deleted rather than left.
   */
  function switchTo(next: Exercise, place: (library: Exercise[], next: Exercise) => Exercise[], remaining?: Exercise[]) {
    const { editor, library, device } = get()
    const opened = { ...next, lastOpened: Date.now() }
    const deviceNow = { ...device, lastOpenedId: opened.id }
    set({
      editor: newEditorState(opened),
      library: place(remaining ?? leave(editor.exercise, library), opened),
      device: deviceNow,
    })
    // A new exercise isn't stored until it is first changed.
    if (!isUnchangedNew(opened)) autosave(opened)
    saveDevice(deviceNow)
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
    setSwing: (swing, { dragging = false } = {}) => {
      const { editor } = get()
      const exercise = withSwing(editor.exercise, swing)
      change(exercise, { ...editor, exercise }, { debounced: dragging })
    },
    setGroove: (groove) => {
      const { editor } = get()
      const exercise = withGroove(editor.exercise, groove)
      if (exercise !== editor.exercise) change(exercise, { ...editor, exercise })
    },
    setPlaying: (playing) => set({ playing }),
    setDeviceSettings: (settings, { dragging = false } = {}) => {
      const device = { ...get().device, ...settings }
      set({ device })
      saveDevice(device, { debounced: dragging })
    },
    loopBar: (bar, options) => {
      const { editor } = get()
      const exercise = loopAt(editor.exercise, bar, options)
      change(exercise, { ...editor, exercise })
    },
    loopAll: () => {
      const { editor } = get()
      if (editor.exercise.practice.loopRange === null) return
      const exercise = withLoopRange(editor.exercise, null)
      change(exercise, { ...editor, exercise })
    },
    openExercise: (id) => {
      const target = get().library.find((e) => e.id === id)
      if (target && id !== get().editor.exercise.id) switchTo(target, updatedInPlace)
    },
    createExercise: () => switchTo(untitledExercise(), addedOnTop),
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
    deleteExercises: (ids) => {
      const { editor, library } = get()
      const openId = editor.exercise.id
      const remaining = remove(ids, library)
      if (!ids.includes(openId)) return set({ library: remaining })
      const next = exerciseToOpenAfterDelete(library, openId, ids)
      if (next) switchTo(next, updatedInPlace, remaining)
      else switchTo(untitledExercise(), addedOnTop, remaining)
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
    const exercise = found ? { ...found, lastOpened: now } : untitledExercise()
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
