// App-wide state, and the only caller of the repository: the open exercise autosaves on every
// change, unless it is built in (an example or a rudiment), which is never stored (ADR 0008, 0018).

import { create } from 'zustand'
import type { BassDrum, CleanRun, DeviceSettings, EditCommand, Mark, MetronomeSettings, EditorState, Exercise, Folder, HihatFoot, ImportChoice, PatternGrid, PatternId, PatternSuggestion, PlayPosition, PracticeSettings } from '@/core'
import {
  DEFAULT_DEVICE_SETTINGS,
  addedOnTop,
  clampMetronomeBpm,
  applyEdit,
  deleteFolder,
  duplicateExercise,
  builtInAccepts,
  builtInExercises,
  exerciseFromPattern,
  exerciseToOpenAfterDelete,
  exerciseToOpenAtLaunch,
  fileIntoFolders,
  isBuiltIn,
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
  withCleanRun,
  withoutCleanRun,
  withBassDrum,
  withHihatFoot,
  withLoopRange,
  withPattern,
  withSwing,
} from '@/core'
import type { AppStorage } from './repository'
import { openStorage } from './repository'

/** What picking a pattern also changed, said under the picker with an Undo, until another exercise opens or the pattern changes. */
export interface PatternNote {
  exerciseId: string
  pattern: PatternId
  suggested: PatternSuggestion[]
  /** The suggested settings as they were, which Undo puts back. */
  before: Partial<Pick<PracticeSettings, PatternSuggestion>>
}

/** The tool palette's tools: Hit, which works the grid as it always has, or a mark to put on notes (ADR 0017). */
export type Tool = 'hit' | Mark

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
  /** Transport: whether the exercise is playing (or starting). */
  playing: boolean
  /** Whether the metronome is playing (or starting). At most one of it and `playing` is true. */
  metronomePlaying: boolean
  /** Where a paused playback resumes, in the exercise it was paused in. */
  paused: PausedAt | undefined
  /** How many edits an open built-in exercise has refused, so the read-only notice can flash at each. */
  refusedEdits: number
  /** The tool held in the palette, for the session: Hit until another is picked. */
  tool: Tool
  setTool: (tool: Tool) => void
  dispatch: (command: EditCommand) => void
  /** `dragging` marks a slider drag: its many small changes are saved once they settle. */
  setBpm: (bpm: number, options?: { dragging?: boolean }) => void
  /** The swing amount, 0.5 (straight) to 0.75; `dragging` as for `setBpm`. */
  setSwing: (swing: number, options?: { dragging?: boolean }) => void
  /** The pattern played and drawn with the exercise; what it also changed is kept in `patternNote`. */
  setPattern: (pattern: PatternId) => void
  /** What the last pattern picked also changed, or null. */
  patternNote: PatternNote | null
  /** Puts back the settings the pattern note says were changed, and closes it. */
  undoPatternNote: () => void
  dismissPatternNote: () => void
  /** The bass drum played and drawn in every bar, with any pattern or none. */
  setBassDrum: (bassDrum: BassDrum) => void
  /** The hi-hat foot played and drawn in every bar, with any pattern or none. */
  setHihatFoot: (hihatFoot: HihatFoot) => void
  setPlaying: (playing: boolean) => void
  setMetronomePlaying: (metronomePlaying: boolean) => void
  setPaused: (paused: PausedAt | undefined) => void
  /** Volumes, the exercise mute, the count-in and the sidebars, kept for this device; `dragging` as for `setBpm`. */
  setDeviceSettings: (settings: Partial<DeviceSettings>, options?: { dragging?: boolean }) => void
  /**
   * The metronome's settings, kept for this device and played at once, its BPM kept in range;
   * `dragging` as for `setBpm`.
   */
  setMetronome: (settings: Partial<MetronomeSettings>, options?: { dragging?: boolean }) => void
  /** Loops just that bar, or with `extend` grows the loop range to take it in. */
  loopBar: (bar: number, options?: { extend?: boolean }) => void
  /** Loops the whole exercise again. */
  loopAll: () => void
  /** Opens a stored exercise or a built-in one, switching the sidebar to the tab that lists it. */
  openExercise: (id: string) => void
  /** Opens a new Untitled exercise, on top of the list, in the open exercise's folder. */
  createExercise: () => void
  /**
   * Opens a new exercise of `bars` bars filled with a typed pattern (see `exerciseFromPattern`), on
   * top of the list, in the open exercise's folder.
   */
  createFromPattern: (choice: { pattern: string; grid: PatternGrid; bars: number }) => void
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
   * Opens a copy of the open exercise, on top of the list. For a built-in exercise this is Copy to Library:
   * an ordinary, editable exercise, and the sidebar switches to the Library tab.
   */
  duplicateOpenExercise: () => void
  /** Empty or blank names are ignored, as is a built-in exercise, whose name is fixed. */
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
  /** The built-in exercises' clean runs, by id; a stored exercise keeps its own. */
  builtInCleanRuns: Record<string, CleanRun[]>
  /** Logs a clean run of the open exercise at its tempo, now. */
  logCleanRun: () => void
  /** Drops the open exercise's clean run logged at `at`, logged by mistake. */
  removeCleanRun: (at: number) => void
}

/** One empty list for every exercise without clean runs, so a selector of them stays the same. */
const NO_CLEAN_RUNS: CleanRun[] = []

/** An exercise's clean runs, wherever they're kept: on it, or for a built-in one, on the side. */
export function cleanRunsOf(state: Pick<AppState, 'builtInCleanRuns'>, exercise: Pick<Exercise, 'id' | 'cleanRuns'>): CleanRun[] {
  return (isBuiltIn(exercise.id) ? state.builtInCleanRuns[exercise.id] : exercise.cleanRuns) ?? NO_CLEAN_RUNS
}

/** How long a slider must rest before its value is saved. */
const DRAG_SAVE_DELAY_MS = 400

let storage: AppStorage | null = null
let unsaved: Exercise | null = null
let saveTimer: ReturnType<typeof setTimeout> | undefined

/**
 * Saves the exercise now, or once changes settle; either way it supersedes any pending save. A
 * built-in exercise (an example or a rudiment) is never saved: its practice-setting changes, and a
 * rudiment's Lead hand, last only until another exercise opens.
 */
function autosave(exercise: Exercise, { debounced = false } = {}) {
  if (isBuiltIn(exercise.id)) return
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
   * is the library once the open exercise is gone, when it was deleted rather than left. Choosing an
   * exercise is finding the way in, so the first visit's welcome closes for good.
   */
  function switchTo(next: Exercise, place: (library: Exercise[], next: Exercise) => Exercise[], remaining?: Exercise[]) {
    const { editor, library, device } = get()
    const opened = { ...next, lastOpened: Date.now() }
    const deviceNow = { ...device, lastOpenedId: opened.id, libraryTab: tabListing(opened.id), welcomeDismissed: true }
    set({
      editor: newEditorState(opened),
      library: place(remaining ?? leave(editor.exercise, library), opened),
      device: deviceNow,
      patternNote: null,
    })
    // A new exercise isn't stored until it is first changed.
    if (!isUnchangedNew(opened)) autosave(opened)
    saveDevice(deviceNow)
  }

  /** Sets the open exercise's clean runs, on it or, for a built-in one, on the side. */
  function setCleanRuns(runs: CleanRun[]) {
    const { editor, builtInCleanRuns } = get()
    const { id } = editor.exercise
    if (!isBuiltIn(id)) {
      // With none left it's as it was before the first, so a new exercise still counts as unchanged.
      const { cleanRuns: _, ...rest } = editor.exercise
      const exercise = runs.length ? { ...rest, cleanRuns: runs } : rest
      return change(exercise, { ...editor, exercise })
    }
    set({ builtInCleanRuns: { ...builtInCleanRuns, [id]: runs } })
    storage?.builtInCleanRuns.put(id, runs).catch((error) => console.error('Saving clean runs failed', error))
  }

  /** Opens a new exercise on top of the list. A collapsed folder it is filed in opens, so it shows there. */
  function openNew(created: Exercise) {
    if (created.folderId !== null) get().setFolderCollapsed(created.folderId, false)
    switchTo(created, addedOnTop)
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
    metronomePlaying: false,
    paused: undefined,
    refusedEdits: 0,
    tool: 'hit',
    setTool: (tool) => set({ tool }),
    dispatch: (command) => {
      const { editor } = get()
      const { id } = editor.exercise
      if (isBuiltIn(id) && !builtInAccepts(id, command)) return set({ refusedEdits: get().refusedEdits + 1 })
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
    setPattern: (pattern) => {
      const { editor } = get()
      const { exercise, suggested } = withPattern(editor.exercise, pattern)
      if (exercise === editor.exercise) return
      const before = Object.fromEntries(suggested.map((setting) => [setting, editor.exercise.practice[setting]]))
      const patternNote = suggested.length ? { exerciseId: exercise.id, pattern, suggested, before } : null
      set({ patternNote })
      change(exercise, { ...editor, exercise })
    },
    patternNote: null,
    undoPatternNote: () => {
      const { editor, patternNote } = get()
      if (!patternNote) return
      set({ patternNote: null })
      const exercise = { ...editor.exercise, practice: { ...editor.exercise.practice, ...patternNote.before } }
      change(exercise, { ...editor, exercise })
    },
    dismissPatternNote: () => set({ patternNote: null }),
    setBassDrum: (bassDrum) => {
      const { editor } = get()
      const exercise = withBassDrum(editor.exercise, bassDrum)
      if (exercise !== editor.exercise) change(exercise, { ...editor, exercise })
    },
    setHihatFoot: (hihatFoot) => {
      const { editor } = get()
      const exercise = withHihatFoot(editor.exercise, hihatFoot)
      if (exercise !== editor.exercise) change(exercise, { ...editor, exercise })
    },
    setPlaying: (playing) => set({ playing }),
    setMetronomePlaying: (metronomePlaying) => set({ metronomePlaying }),
    setPaused: (paused) => set({ paused }),
    setDeviceSettings: (settings, { dragging = false } = {}) => {
      const device = { ...get().device, ...settings }
      set({ device })
      saveDevice(device, { debounced: dragging })
    },
    setMetronome: (settings, options) => {
      const metronome = { ...get().device.metronome, ...settings }
      get().setDeviceSettings({ metronome: { ...metronome, bpm: clampMetronomeBpm(metronome.bpm) } }, options)
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
      const target = [...get().library, ...builtInExercises()].find((e) => e.id === id)
      if (target && id !== get().editor.exercise.id) switchTo(target, updatedInPlace)
    },
    createExercise: () => openNew(newExerciseBeside(get().editor.exercise, { id: crypto.randomUUID(), now: Date.now() })),
    createFromPattern: ({ pattern, grid, bars }) => {
      const { folderId } = get().editor.exercise
      openNew(exerciseFromPattern({ id: crypto.randomUUID(), now: Date.now(), folderId, pattern, grid, bars }))
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
        // A built-in exercise's id is the app's own; one in a file is never stored.
        incoming.filter((e) => !isBuiltIn(e.id)),
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
        ...(open && { editor: newEditorState(open), patternNote: null }),
      })
      return stored.length
    },
    builtInCleanRuns: {},
    logCleanRun: () => {
      const state = get()
      const { exercise } = state.editor
      setCleanRuns(withCleanRun(cleanRunsOf(state, exercise), exercise.practice.bpm, Date.now()))
    },
    removeCleanRun: (at) => {
      const state = get()
      setCleanRuns(withoutCleanRun(cleanRunsOf(state, state.editor.exercise), at))
    },
  }
})

/**
 * Opens storage and the exercise to work on: the one last open, a built-in one among them, or the
 * first example on a fresh device, or a new Untitled one when the library was emptied. Examples an
 * earlier version stored, unchanged, are deleted first. A new exercise isn't stored until it is
 * first changed, and a built-in one never is. If storage can't be opened, the app runs on an unsaved
 * new exercise and says that it isn't saving.
 */
export async function launchApp() {
  navigator.storage?.persist?.().catch(() => {})
  try {
    const opened = await openStorage()
    const device = await opened.device.load()
    const folders = await opened.folders.list()
    const builtInCleanRuns = await opened.builtInCleanRuns.all()
    const now = Date.now()
    const listed = await opened.exercises.list()
    const leftovers = leftoverExamples(listed)
    if (leftovers.length > 0) await opened.exercises.deleteMany(leftovers)
    const stored = listed.filter((e) => !leftovers.includes(e.id))
    // A deleted leftover that was open counts as nothing open, so its device starts as a fresh one.
    const lastOpenedId = device.lastOpenedId !== null && leftovers.includes(device.lastOpenedId) ? null : device.lastOpenedId
    const found = exerciseToOpenAtLaunch(stored, lastOpenedId)
    const exercise = found ? { ...found, lastOpened: now } : untitledExercise()
    const builtIn = isBuiltIn(exercise.id)
    if (found && !builtIn) await opened.exercises.put(exercise)
    // The order is taken before the open exercise's new last-opened time, and then kept all session.
    const order = launchListOrder(stored)
    // A built-in exercise isn't listed; a new Untitled exercise goes on top.
    const library = builtIn ? order : found ? updatedInPlace(order, exercise) : addedOnTop(order, exercise)
    const deviceNow = { ...device, lastOpenedId: exercise.id, libraryTab: tabListing(exercise.id) }
    await opened.device.save(deviceNow)

    // Only now does autosave start, so it never stores a placeholder from a launch that failed halfway.
    storage = opened
    useAppStore.setState({ editor: newEditorState(exercise), library, folders, device: deviceNow, builtInCleanRuns, saving: true })
  } catch (error) {
    console.error('Could not open saved exercises', error)
  }
}
