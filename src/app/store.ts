// App-wide state, and the only caller of the repository: the open exercise autosaves on every change.

import { create } from 'zustand'
import type { DeviceSettings, EditCommand, EditorState, Exercise } from '@/core'
import {
  DEFAULT_DEVICE_SETTINGS,
  applyEdit,
  exerciseToOpenAtLaunch,
  newEditorState,
  newExercise,
  withBpm,
} from '@/core'
import type { AppStorage } from './repository'
import { openStorage } from './repository'

interface AppState {
  editor: EditorState
  device: DeviceSettings
  /** False when storage couldn't be opened, so changes are not being saved. */
  saving: boolean
  /** Transport: whether playback is running (or starting). */
  playing: boolean
  dispatch: (command: EditCommand) => void
  /** `dragging` marks a slider drag: its many small changes are saved once they settle. */
  setBpm: (bpm: number, options?: { dragging?: boolean }) => void
  setPlaying: (playing: boolean) => void
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

export const useAppStore = create<AppState>()((set, get) => ({
  // Replaced by launchApp before the first render.
  editor: newEditorState(newExercise({ id: crypto.randomUUID(), now: Date.now() })),
  device: DEFAULT_DEVICE_SETTINGS,
  saving: false,
  playing: false,
  dispatch: (command) => {
    const { editor } = get()
    const next = applyEdit(editor, command)
    set({ editor: next })
    if (next.exercise !== editor.exercise) autosave(next.exercise)
  },
  setBpm: (bpm, { dragging = false } = {}) => {
    const { editor } = get()
    const exercise = withBpm(editor.exercise, bpm)
    set({ editor: { ...editor, exercise } })
    autosave(exercise, { debounced: dragging })
  },
  setPlaying: (playing) => set({ playing }),
}))

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
    const found = exerciseToOpenAtLaunch(await opened.exercises.list(), device.lastOpenedId)
    const now = Date.now()
    const exercise = found ? { ...found, lastOpened: now } : newExercise({ id: crypto.randomUUID(), now })
    if (found) await opened.exercises.put(exercise)
    const deviceNow = { ...device, lastOpenedId: exercise.id }
    await opened.device.save(deviceNow)

    // Only now does autosave start, so it never stores a placeholder from a launch that failed halfway.
    storage = opened
    useAppStore.setState({ editor: newEditorState(exercise), device: deviceNow, saving: true })
  } catch (error) {
    console.error('Could not open saved exercises', error)
  }
}
