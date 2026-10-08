import { describe, expect, it } from 'vitest'
import { deleteFolder, inKnownFolder, libraryView, moveToFolder, newExercise, newFolder, renameFolder } from './index'

const page38 = { id: 'f1', name: 'Syncopation p.38' }
const warmUps = { id: 'f2', name: 'Warm-ups' }
const line1 = { ...newExercise({ id: 'e1', now: 1 }), name: 'p.38 #1', folderId: 'f1' }
const line2 = { ...newExercise({ id: 'e2', now: 2 }), name: 'p.38 #2', folderId: 'f1' }
const singles = { ...newExercise({ id: 'e3', now: 3 }), name: 'Singles', folderId: 'f2' }
const loose = { ...newExercise({ id: 'e4', now: 4 }), name: 'Loose' }

describe('making a folder', () => {
  it('names it as typed, trimmed', () => {
    expect(newFolder({ id: 'f9', name: '  Syncopation p.38 ' })).toEqual({ id: 'f9', name: 'Syncopation p.38' })
  })

  it('names a blank one "New folder"', () => {
    expect(newFolder({ id: 'f9', name: '   ' })).toEqual({ id: 'f9', name: 'New folder' })
  })
})

describe('renaming a folder', () => {
  it('gives it the new name, trimmed', () => {
    expect(renameFolder([page38, warmUps], 'f2', ' Warm ups ')).toEqual([page38, { id: 'f2', name: 'Warm ups' }])
  })

  it('ignores a blank name', () => {
    const folders = [page38, warmUps]
    expect(renameFolder(folders, 'f2', '  ')).toBe(folders)
  })
})

describe('deleting a folder', () => {
  it('moves its exercises to no folder and keeps every one of them', () => {
    const { folders, library } = deleteFolder([page38, warmUps], [line1, singles, line2, loose], 'f1')
    expect(folders).toEqual([warmUps])
    expect(library).toEqual([{ ...line1, folderId: null }, singles, { ...line2, folderId: null }, loose])
  })

  it('names the exercises it moved, so they can be saved', () => {
    expect(deleteFolder([page38, warmUps], [line1, singles, line2, loose], 'f1').moved.map((e) => e.id)).toEqual(['e1', 'e2'])
  })
})

describe('moving exercises to a folder', () => {
  it('files them in the folder, in their places in the list', () => {
    const { library } = moveToFolder([line1, singles, loose, line2], ['e4', 'e3'], 'f1')
    expect(library).toEqual([line1, { ...singles, folderId: 'f1' }, { ...loose, folderId: 'f1' }, line2])
  })

  it('takes them out of their folder when moved to no folder', () => {
    const { library } = moveToFolder([line1, singles, loose], ['e1', 'e4'], null)
    expect(library).toEqual([{ ...line1, folderId: null }, singles, loose])
  })

  it('names only the exercises whose folder changed, so they can be saved', () => {
    expect(moveToFolder([line1, singles, loose], ['e1', 'e3', 'e4'], 'f1').moved.map((e) => e.id)).toEqual(['e3', 'e4'])
  })
})

describe('the library view', () => {
  const folders = [warmUps, page38, { id: 'f3', name: 'blues' }]
  const library = [line2, loose, singles, line1]
  const names = (exercises: { name: string }[]) => exercises.map((e) => e.name)

  it('lists the folders by name, ignoring case, each with its exercises in list order and a count, then the loose ones', () => {
    const view = libraryView({ library, folders, filter: '', collapsedIds: [] })
    expect(view.folders.map((f) => [f.folder.name, f.count, f.expanded, names(f.exercises)])).toEqual([
      ['blues', 0, true, []],
      ['Syncopation p.38', 2, true, ['p.38 #2', 'p.38 #1']],
      ['Warm-ups', 1, true, ['Singles']],
    ])
    expect(names(view.loose)).toEqual(['Loose'])
  })

  it('hides a collapsed folder’s exercises but keeps its count', () => {
    const [, page] = libraryView({ library, folders, filter: '', collapsedIds: ['f1'] }).folders
    expect([page.count, page.expanded, page.exercises]).toEqual([2, false, []])
  })

  it('with filter text, hides folders without a match and expands those with one, collapsed or not', () => {
    const view = libraryView({ library, folders, filter: '#1', collapsedIds: ['f1'] })
    expect(view.folders.map((f) => [f.folder.name, f.expanded, names(f.exercises)])).toEqual([
      ['Syncopation p.38', true, ['p.38 #1']],
    ])
    expect(view.loose).toEqual([])
  })

  it('lists an exercise whose folder is gone with the loose ones', () => {
    const stray = { ...loose, id: 'e5', name: 'Stray', folderId: 'gone' }
    expect(names(libraryView({ library: [stray, loose], folders, filter: '', collapsedIds: [] }).loose)).toEqual(['Stray', 'Loose'])
  })
})

describe('an exercise from elsewhere, such as an import', () => {
  it('stays in its folder when this library has it, and goes in no folder when it doesn’t', () => {
    expect(inKnownFolder(line1, [page38])).toBe(line1)
    expect(inKnownFolder(loose, [page38])).toBe(loose)
    expect(inKnownFolder(singles, [page38])).toEqual({ ...singles, folderId: null })
  })
})
