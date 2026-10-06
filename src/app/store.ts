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
import type { Storage } from './repository'
import { openStorage } from './repository'

interface AppState {
  editor: EditorState
  device: DeviceSettings
  /** Transport: whether playback is running (or starting). */
  playing: boolean
  dispatch: (command: EditCommand) => void
  /** `dragging` marks a slider drag: its many small changes are saved once they settle. */
  setBpm: (bpm: number, options?: { dragging?: boolean }) => void
  setPlaying: (playing: boolean) => void
}

/** How long a slider must rest before its value is saved. */
const DRAG_SAVE_DELAY_MS = 400

let storage: Storage | null = null
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
 * library is empty. A new exercise isn't stored until it is first changed.
 */
export async function launchApp() {
  void navigator.storage?.persist?.()
  storage = await openStorage()

  const device = await storage.device.load()
  const library = await storage.exercises.list()
  const id = exerciseToOpenAtLaunch(library, device.lastOpenedId)
  const now = Date.now()
  const found = library.find((e) => e.id === id)
  const exercise = found ? { ...found, lastOpened: now } : newExercise({ id: crypto.randomUUID(), now })
  if (found) await storage.exercises.put(exercise)

  const opened = { ...device, lastOpenedId: exercise.id }
  await storage.device.save(opened)
  useAppStore.setState({ editor: newEditorState(exercise), device: opened })
}
