// App-wide state, and the only caller of the repository: the open exercise autosaves on every
// change, unless it is an example, which is never stored (ADR 0008).

import { create } from 'zustand'
import type { DeviceSettings, EditCommand, EditorState, Exercise, Folder, GroovePresetId, ImportChoice, PlayPosition } from '@/core'
import {
  DEFAULT_DEVICE_SETTINGS,
  addedOnTop,
  applyEdit,
  deleteFolder,
  duplicateExercise,
  exampleAccepts,
  exampleExercises,
  exerciseToOpenAfterDelete,
  exerciseToOpenAtLaunch,
  fileIntoFolders,
  isExample,
  isUnchangedNew,
  launchListOrder,
  leftoverExamples,
  loopAt,
  moveToFolder,
  newEditorState,
  newExercise,
  newExerciseBeside,
  newFolder,
  planImport,
  renameFolder,
  tabListing,
  updatedInPlace,
  withBpm,
  withGroove,
  withLoopRange,
  withSwing,
} from '@/core'
import type { AppStorage } from './repository'
import { openStorage } from './repository'

/** A paused playback: the exercise it was paused in and where it resumes. */
export interface PausedAt {
  exerciseId: string
  position: PlayPosition
}

interface AppState {
  editor: EditorState
  /** Every exercise, in the session's list order; the open one as it is now. */
  library: Exercise[]
  /** The Library's folders, in no particular order (the sidebar sorts them). */
  folders: Folder[]
  device: DeviceSettings
  /** False when storage couldn't be opened, so changes are not being saved. */
  saving: boolean
  /** Transport: whether playback is running (or starting). */
  playing: boolean
  /** Where a paused playback resumes, in the exercise it was paused in. */
  paused: PausedAt | undefined
  /** How many edits an open example has refused, so the read-only notice can flash at each. */
  refusedEdits: number
  dispatch: (command: EditCommand) => void
  /** `dragging` marks a slider drag: its many small changes are saved once they settle. */
  setBpm: (bpm: number, options?: { dragging?: boolean }) => void
  /** The swing amount, 0.5 (straight) to 0.75; `dragging` as for `setBpm`. */
  setSwing: (swing: number, options?: { dragging?: boolean }) => void
  /** The groove layer played and drawn with the exercise. */
  setGroove: (groove: GroovePresetId) => void
  setPlaying: (playing: boolean) => void
  setPaused: (paused: PausedAt | undefined) => void
  /** Volumes, the exercise mute, the count-in and the sidebars, kept for this device; `dragging` as for `setBpm`. */
  setDeviceSettings: (settings: Partial<DeviceSettings>, options?: { dragging?: boolean }) => void
  /** Loops just that bar, or with `extend` grows the loop range to take it in. */
  loopBar: (bar: number, options?: { extend?: boolean }) => void
  /** Loops the whole exercise again. */
  loopAll: () => void
  /** Opens a stored exercise or an example, switching the sidebar to the tab that lists it. */
  openExercise: (id: string) => void
  /** Opens a new Untitled exercise, on top of the list, in the open exercise's folder. */
  createExercise: () => void
  /** Makes an empty folder called "New folder" and returns its id. */
  createFolder: () => string
  /** Empty or blank names are ignored. */
  renameFolder: (id: string, name: string) => void
  /** Deletes a folder; its exercises move to no folder, and none is deleted. */
  deleteFolder: (id: string) => void
  /** Moves exercises into a folder, or into none with `null`, each in its place in the list. */
  moveToFolder: (ids: string[], folderId: string | null) => void
  /** Collapses or expands a folder, remembered on this device. */
  setFolderCollapsed: (id: string, collapsed: boolean) => void
  /**
   * Opens a copy of the open exercise, on top of the list. For an example this is Copy to Library:
   * an ordinary, editable exercise, and the sidebar switches to the Library tab.
   */
  duplicateOpenExercise: () => void
  /** Empty or blank names are ignored, as is an example, whose name is fixed. */
  renameExercise: (id: string, name: string) => void
  /**
   * Deletes exercises for good. If the open one goes, the most recently opened one left opens, or a
   * new Untitled one when none are left.
   */
  deleteExercises: (ids: string[]) => void
  /**
   * Stores exercises read from an import file, with `choice` for those the library already holds,
   * and returns how many were stored. New ones go on top of the list; replaced ones stay in place,
   * and a replaced open exercise reopens as imported. Nothing is deleted. One in a folder of the
   * file (`fileFolders`) goes in the library's folder of that name, made if it's missing. The
   * sidebar switches to the Library tab, to show them.
   */
  importExercises: (incoming: Exercise[], fileFolders: Folder[], choice: ImportChoice) => number
}

/** How long a slider must rest before its value is saved. */
const DRAG_SAVE_DELAY_MS = 400

let storage: AppStorage | null = null
let unsaved: Exercise | null = null
let saveTimer: ReturnType<typeof setTimeout> | undefined

/**
 * Saves the exercise now, or once changes settle; either way it supersedes any pending save. An
 * example is never saved: its practice-setting changes last only until another exercise opens.
 */
function autosave(exercise: Exercise, { debounced = false } = {}) {
  if (isExample(exercise.id)) return
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

/** Forgets a pending save of any of these exercises, which would otherwise overwrite what replaces them. */
function dropPendingSave(ids: string[]) {
  if (unsaved && ids.includes(unsaved.id)) {
    clearTimeout(saveTimer)
    unsaved = null
  }
}

/** Drops exercises from storage, with any save of theirs still pending, and returns the library without them. */
function remove(ids: string[], library: Exercise[]): Exercise[] {
  dropPendingSave(ids)
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
    const deviceNow = { ...device, lastOpenedId: opened.id, libraryTab: tabListing(opened.id) }
    set({
      editor: newEditorState(opened),
      library: place(remaining ?? leave(editor.exercise, library), opened),
      device: deviceNow,
    })
    // A new exercise isn't stored until it is first changed.
    if (!isUnchangedNew(opened)) autosave(opened)
    saveDevice(deviceNow)
  }

  /**
   * Sets the library (and folders, if they changed) once exercises moved folder, and saves the
   * `moved` ones. The open exercise moves too (its list entry is kept in step with it), so its next
   * autosave doesn't file it back.
   */
  function saveRefiled(
    changes: Pick<AppState, 'library'> & Partial<Pick<AppState, 'folders'>>,
    moved: Exercise[],
  ): Promise<void> {
    const { editor } = get()
    const open = moved.find((e) => e.id === editor.exercise.id)
    set({ ...changes, ...(open && { editor: { ...editor, exercise: open } }) })
    dropPendingSave(moved.map((e) => e.id))
    // An unchanged new exercise isn't stored, and moving it doesn't change that.
    return storage?.exercises.putMany(moved.filter((e) => !isUnchangedNew(e))) ?? Promise.resolve()
  }

  return {
    // Replaced by launchApp before the first render.
    editor: newEditorState(initialExercise),
    library: [initialExercise],
    folders: [],
    device: DEFAULT_DEVICE_SETTINGS,
    saving: false,
    playing: false,
    paused: undefined,
    refusedEdits: 0,
    dispatch: (command) => {
      const { editor } = get()
      if (isExample(editor.exercise.id) && !exampleAccepts(command)) return set({ refusedEdits: get().refusedEdits + 1 })
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
    setPaused: (paused) => set({ paused }),
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
      const target = [...get().library, ...exampleExercises()].find((e) => e.id === id)
      if (target && id !== get().editor.exercise.id) switchTo(target, updatedInPlace)
    },
    createExercise: () => {
      const created = newExerciseBeside(get().editor.exercise, { id: crypto.randomUUID(), now: Date.now() })
      // A collapsed folder opens, so the new exercise shows in it.
      if (created.folderId !== null) get().setFolderCollapsed(created.folderId, false)
      switchTo(created, addedOnTop)
    },
    createFolder: () => {
      const folder = newFolder({ id: crypto.randomUUID(), name: '' })
      set({ folders: [...get().folders, folder] })
      storage?.folders.put(folder).catch((error) => console.error('Saving the folder failed', error))
      return folder.id
    },
    renameFolder: (id, name) => {
      const folders = renameFolder(get().folders, id, name)
      const renamed = folders.find((f) => f.id === id)
      if (folders === get().folders || !renamed) return
      set({ folders })
      storage?.folders.put(renamed).catch((error) => console.error('Saving the folder name failed', error))
    },
    deleteFolder: (id) => {
      get().setFolderCollapsed(id, false)
      const { folders, library, moved } = deleteFolder(get().folders, get().library, id)
      saveRefiled({ folders, library }, moved)
        .then(() => storage?.folders.delete(id))
        .catch((error) => console.error('Deleting the folder failed', error))
    },
    moveToFolder: (ids, folderId) => {
      const { library, moved } = moveToFolder(get().library, ids, folderId)
      if (moved.length === 0) return
      saveRefiled({ library }, moved).catch((error) => console.error('Moving to the folder failed', error))
    },
    setFolderCollapsed: (id, collapsed) => {
      const { collapsedFolderIds } = get().device
      if (collapsedFolderIds.includes(id) === collapsed) return
      const others = collapsedFolderIds.filter((f) => f !== id)
      get().setDeviceSettings({ collapsedFolderIds: collapsed ? [...others, id] : others })
    },
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
    importExercises: (incoming, fileFolders, choice) => {
      const { editor, library, folders } = get()
      const newId = () => crypto.randomUUID()
      const planned = planImport(
        // An example's id is the app's own; one in a file is never stored.
        incoming.filter((e) => !isExample(e.id)),
        library.map((e) => e.id),
        choice,
        { newId },
      )
      if (planned.length === 0) return 0
      const { exercises: stored, created } = fileIntoFolders(planned, fileFolders, folders, { newId })
      dropPendingSave(stored.map((e) => e.id))
      for (const folder of created) {
        storage?.folders.put(folder).catch((error) => console.error('Saving the folder failed', error))
      }
      storage?.exercises.putMany(stored).catch((error) => console.error('Import failed', error))
      const device: DeviceSettings = { ...get().device, libraryTab: 'library' }
      saveDevice(device)
      const replaced = new Map(stored.map((e) => [e.id, e]))
      const added = stored.filter((e) => !library.some((existing) => existing.id === e.id))
      const open = replaced.get(editor.exercise.id)
      set({
        library: [...added, ...library.map((e) => replaced.get(e.id) ?? e)],
        folders: [...folders, ...created],
        device,
        ...(open && { editor: newEditorState(open) }),
      })
      return stored.length
    },
  }
})

/**
 * Opens storage and the exercise to work on: the one last open, an example among them, or the
 * first example on a fresh device, or a new Untitled one when the library was emptied. Examples an
 * earlier version stored, unchanged, are deleted first. A new exercise isn't stored until it is
 * first changed, and an example never is. If storage can't be opened, the app runs on an unsaved
 * new exercise and says that it isn't saving.
 */
export async function launchApp() {
  navigator.storage?.persist?.().catch(() => {})
  try {
    const opened = await openStorage()
    const device = await opened.device.load()
    const folders = await opened.folders.list()
    const now = Date.now()
    const listed = await opened.exercises.list()
    const leftovers = leftoverExamples(listed)
    if (leftovers.length > 0) await opened.exercises.deleteMany(leftovers)
    const stored = listed.filter((e) => !leftovers.includes(e.id))
    // A deleted leftover that was open counts as nothing open, so its device starts as a fresh one.
    const lastOpenedId = device.lastOpenedId !== null && leftovers.includes(device.lastOpenedId) ? null : device.lastOpenedId
    const found = exerciseToOpenAtLaunch(stored, lastOpenedId)
    const exercise = found ? { ...found, lastOpened: now } : untitledExercise()
    const example = isExample(exercise.id)
    if (found && !example) await opened.exercises.put(exercise)
    // The order is taken before the open exercise's new last-opened time, and then kept all session.
    const order = launchListOrder(stored)
    // An example isn't listed; a new Untitled exercise goes on top.
    const library = example ? order : found ? updatedInPlace(order, exercise) : addedOnTop(order, exercise)
    const deviceNow = { ...device, lastOpenedId: exercise.id, libraryTab: tabListing(exercise.id) }
    await opened.device.save(deviceNow)

    // Only now does autosave start, so it never stores a placeholder from a launch that failed halfway.
    storage = opened
    useAppStore.setState({ editor: newEditorState(exercise), library, folders, device: deviceNow, saving: true })
  } catch (error) {
    console.error('Could not open saved exercises', error)
  }
}
