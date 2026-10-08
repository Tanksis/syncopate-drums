// Library folders: one level deep, an exercise filed in one by its `folderId` (or in none).

import { filterByName } from './library'
import type { Exercise, Folder } from './model'

/** What a folder made without a name is called. */
const UNNAMED_FOLDER = 'New folder'

/** A new folder, its name trimmed; a blank name gives "New folder". */
export function newFolder({ id, name }: { id: string; name: string }): Folder {
  return { id, name: name.trim() || UNNAMED_FOLDER }
}

/** The folders with one renamed, its name trimmed; a blank name is ignored and they stay as they were. */
export function renameFolder(folders: Folder[], id: string, name: string): Folder[] {
  const trimmed = name.trim()
  if (!trimmed) return folders
  return folders.map((f) => (f.id === id ? { ...f, name: trimmed } : f))
}

/**
 * Moves exercises into a folder, or into none with `null`, each in its place in the list. `moved`
 * is the ones whose folder changed, as they are now, to be saved.
 */
export function moveToFolder<E extends Pick<Exercise, 'id' | 'folderId'>>(
  library: E[],
  ids: readonly string[],
  folderId: string | null,
): { library: E[]; moved: E[] } {
  const moved: E[] = []
  const next = library.map((e) => {
    if (!ids.includes(e.id) || e.folderId === folderId) return e
    const filed = { ...e, folderId }
    moved.push(filed)
    return filed
  })
  return { library: next, moved }
}

/**
 * Deletes a folder. Its exercises move to no folder, in their places in the list, and none is
 * deleted; `moved` is them as they are now, to be saved.
 */
export function deleteFolder<E extends Pick<Exercise, 'id' | 'folderId'>>(
  folders: Folder[],
  library: E[],
  id: string,
): { folders: Folder[]; library: E[]; moved: E[] } {
  const inFolder = library.filter((e) => e.folderId === id).map((e) => e.id)
  return { folders: folders.filter((f) => f.id !== id), ...moveToFolder(library, inFolder, null) }
}

/** Whether an exercise is filed in one of these folders, rather than in none or in one that's gone. */
const isFiled = (exercise: Pick<Exercise, 'folderId'>, folderIds: ReadonlySet<string>) =>
  exercise.folderId !== null && folderIds.has(exercise.folderId)

/** The exercise as it is when these folders hold its folder, otherwise in no folder (an import's, say). */
export function inKnownFolder<E extends Pick<Exercise, 'folderId'>>(exercise: E, folders: Folder[]): E {
  if (exercise.folderId === null || isFiled(exercise, new Set(folders.map((f) => f.id)))) return exercise
  return { ...exercise, folderId: null }
}

/** Folder names in order, ignoring case (and accents): equal when they're the same name. */
const compareNames = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' })

/** The folders by name, ignoring case, as the Library tab lists them. */
export function foldersByName(folders: readonly Folder[]): Folder[] {
  return [...folders].sort((a, b) => compareNames(a.name, b.name))
}

/**
 * Files imported exercises into this library's folders: each one in a folder of the file goes in
 * the library's folder of the same name, ignoring case, or in a new one made with that name.
 * `created` is the folders made, one per name, to be stored.
 */
export function fileIntoFolders<E extends Pick<Exercise, 'folderId'>>(
  exercises: E[],
  fileFolders: readonly Folder[],
  libraryFolders: readonly Folder[],
  { newId }: { newId: () => string },
): { exercises: E[]; created: Folder[] } {
  const known = [...libraryFolders]
  const created: Folder[] = []
  const filed = exercises.map((exercise) => {
    const from = fileFolders.find((f) => f.id === exercise.folderId)
    if (!from) return exercise
    // Named as a folder made here would be, so a blank name finds "New folder".
    const { name } = newFolder({ id: '', name: from.name })
    let folder = known.find((f) => compareNames(f.name, name) === 0)
    if (!folder) {
      folder = newFolder({ id: newId(), name })
      known.push(folder)
      created.push(folder)
    }
    return { ...exercise, folderId: folder.id }
  })
  return { exercises: filed, created }
}

/** A folder as the Library tab shows it. */
export interface FolderRow<E> {
  folder: Folder
  /** How many exercises it holds, shown even while it's collapsed. */
  count: number
  expanded: boolean
  /** The exercises listed under it: none while it's collapsed, only the matches with filter text. */
  exercises: E[]
}

/** The Library tab's rows: the folders, then the exercises in no folder. */
export interface LibraryView<E> {
  folders: FolderRow<E>[]
  loose: E[]
}

/**
 * The Library tab as the sidebar shows it: the folders by name (ignoring case), each with its
 * exercises in list order and a count, then the exercises in no folder (or in one that's gone).
 * A collapsed folder hides its exercises. With filter text only the matches are listed, a folder
 * without one is hidden, and a folder with one shows expanded, collapsed or not.
 */
export function libraryView<E extends Pick<Exercise, 'name' | 'folderId'>>({
  library,
  folders,
  filter,
  collapsedIds,
}: {
  library: E[]
  folders: Folder[]
  filter: string
  collapsedIds: readonly string[]
}): LibraryView<E> {
  const folderIds = new Set(folders.map((f) => f.id))
  const rows = foldersByName(folders).map((folder): FolderRow<E> => {
      const inFolder = library.filter((e) => e.folderId === folder.id)
      const expanded = filter !== '' || !collapsedIds.includes(folder.id)
      return { folder, count: inFolder.length, expanded, exercises: expanded ? filterByName(inFolder, filter) : [] }
    })
  return {
    folders: filter === '' ? rows : rows.filter((row) => row.exercises.length > 0),
    loose: filterByName(
      library.filter((e) => !isFiled(e, folderIds)),
      filter,
    ),
  }
}
