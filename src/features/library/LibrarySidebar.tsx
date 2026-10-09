import { useState } from 'react'
import { useAppStore } from '@/app/store'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { NameInput } from '@/components/NameInput'
import { SidebarHeading } from '@/components/Sidebar'
import { keepFocus } from '@/components/keepFocus'
import type { Exercise, Folder, LibraryTab } from '@/core'
import { exampleExercises, foldersByName, isExample, libraryView, tabListing } from '@/core'
import { downloadExport } from './download'
import { exerciseCount } from './exerciseCount'
import { ImportButton } from './ImportButton'
import { useExerciseDrop } from './useExerciseDrop'

/** The built-in examples, the same every time; never stored (ADR 0008). */
const EXAMPLES = exampleExercises()

const buttonClass =
  'flex-1 cursor-pointer rounded-md border border-edge bg-card px-2 py-1 font-semibold hover:border-accent'

/** A sidebar button that's disabled for an example, or with no example open. */
const disablableButtonClass = `${buttonClass} disabled:cursor-default disabled:text-mute disabled:hover:border-edge`

/** An exercise's button in a list, marked when it's the open one. */
const listButtonClass = (open: boolean) =>
  `min-w-0 flex-1 cursor-pointer truncate rounded-md border-0 px-2 py-1 text-left ${
    open ? 'bg-accent/10 font-semibold text-accent' : 'bg-transparent hover:bg-line'
  }`

/** The Move to… menu's value for no folder, beside the folder ids (which are UUIDs). */
const NO_FOLDER = 'no-folder'

/** A drop target, outlined in the accent while an exercise is dragged over it; inset, as the list clips. */
const dropTargetClass = (over: boolean) => `rounded-md ${over ? 'outline-2 -outline-offset-2 outline-accent' : ''}`

const TABS: { id: LibraryTab; label: string }[] = [
  { id: 'library', label: 'Library' },
  { id: 'examples', label: 'Examples' },
]

/**
 * The sidebar's two tabs. Library: New, Duplicate, Delete, Import, Export all, the filter and New
 * folder, and the list: the folders (chevron to collapse, double-click to rename, × to delete),
 * each with its exercises, then the exercises in no folder (click to open, double-click to rename,
 * tick to select, drag onto a folder or "No folder" to move it there). The selection stays through
 * filtering and can be exported, deleted or moved to a folder together.
 * Examples: the built-in examples, to open, and Copy to Library for the open one.
 */
export function LibrarySidebar({ onCollapse, fullScreen = false }: { onCollapse: () => void; fullScreen?: boolean }) {
  const library = useAppStore((s) => s.library)
  const openId = useAppStore((s) => s.editor.exercise.id)
  const tab = useAppStore((s) => s.device.libraryTab)
  const setDeviceSettings = useAppStore((s) => s.setDeviceSettings)
  const exampleOpen = isExample(openId)
  const openExercise = useAppStore((s) => s.openExercise)
  const createExercise = useAppStore((s) => s.createExercise)
  const duplicateOpenExercise = useAppStore((s) => s.duplicateOpenExercise)
  const renameExercise = useAppStore((s) => s.renameExercise)
  const deleteExercises = useAppStore((s) => s.deleteExercises)
  const folders = useAppStore((s) => s.folders)
  const collapsedIds = useAppStore((s) => s.device.collapsedFolderIds)
  const createFolder = useAppStore((s) => s.createFolder)
  const renameFolder = useAppStore((s) => s.renameFolder)
  const deleteFolder = useAppStore((s) => s.deleteFolder)
  const setFolderCollapsed = useAppStore((s) => s.setFolderCollapsed)
  const moveToFolder = useAppStore((s) => s.moveToFolder)
  const [filter, setFilter] = useState('')
  /** The exercise or folder whose name is being edited in place. */
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set())
  /** The exercises waiting on the delete confirm, if it's showing. */
  const [toDelete, setToDelete] = useState<Exercise[] | null>(null)
  /** The folder waiting on the delete confirm, if it's showing. */
  const [folderToDelete, setFolderToDelete] = useState<{ folder: Folder; count: number } | null>(null)
  /** How many exercises the last import stored, shown until the next library action. */
  const [imported, setImported] = useState<number | null>(null)
  const view = libraryView({ library, folders, filter, collapsedIds })
  // Exercises discarded or deleted since they were ticked drop out here.
  const selected = library.filter((e) => selectedIds.has(e.id))

  const toggleSelected = (id: string) =>
    setSelectedIds((ids) => {
      const next = new Set(ids)
      if (!next.delete(id)) next.add(id)
      return next
    })

  /** Moves exercises to a folder, or none; a ticked one brings the other ticked ones with it. */
  const { dropTarget, dragProps, dropProps } = useExerciseDrop((id, folderId) =>
    moveToFolder(selectedIds.has(id) ? selected.map((e) => e.id) : [id], folderId),
  )

  const exerciseRow = (exercise: Exercise, inFolder: boolean) => (
    <li
      key={exercise.id}
      // Not while renaming, so the name's text can be selected with the mouse.
      draggable={renamingId !== exercise.id}
      {...dragProps(exercise.id)}
      className={`flex items-center gap-1 ${inFolder ? 'pl-5' : 'pl-1'}`}
    >
      <input
        type="checkbox"
        aria-label={`Select ${exercise.name}`}
        checked={selectedIds.has(exercise.id)}
        onMouseDown={keepFocus}
        onChange={() => toggleSelected(exercise.id)}
        className="shrink-0 cursor-pointer accent-accent"
      />
      {renamingId === exercise.id ? (
        <NameInput
          name={exercise.name}
          onDone={(name) => {
            if (name !== null) renameExercise(exercise.id, name)
            setRenamingId(null)
          }}
          className="w-full flex-1 py-1"
        />
      ) : (
        <button
          type="button"
          title="Click to open, double-click to rename"
          aria-current={exercise.id === openId}
          // Not keepFocus, whose mousedown preventDefault would stop the row being dragged: a mouse
          // click lets the focus go afterwards instead (a keyboard one, detail 0, keeps it).
          onClick={(e) => {
            if (e.detail > 0) e.currentTarget.blur()
            openExercise(exercise.id)
          }}
          onDoubleClick={() => setRenamingId(exercise.id)}
          className={listButtonClass(exercise.id === openId)}
        >
          {exercise.name}
        </button>
      )}
    </li>
  )

  return (
    <aside
      aria-label="Exercise library"
      className={`flex min-h-0 flex-col gap-2 bg-panel px-2.5 py-3 ${fullScreen ? 'w-full' : 'w-[230px] border-r border-line'}`}
    >
      <SidebarHeading name="Exercises" side="left" fullScreen={fullScreen} onCollapse={onCollapse} />
      <div role="tablist" aria-label="Exercise lists" className="flex border-b border-line">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onMouseDown={keepFocus}
            onClick={() => setDeviceSettings({ libraryTab: id })}
            className="-mb-px flex flex-1 cursor-pointer items-center justify-center gap-1.5 border-0 border-b-2 border-transparent bg-transparent px-2 py-1 font-semibold text-mute hover:text-ink aria-selected:border-accent aria-selected:text-accent"
          >
            {label}
            {id === tabListing(openId) && (
              <span title="The open exercise is here" className="size-1.5 rounded-full bg-accent" />
            )}
          </button>
        ))}
      </div>
      {tab === 'examples' && (
        <>
          <button
            type="button"
            title={exampleOpen ? 'Make an editable copy of the open example' : 'Open an example to copy it'}
            disabled={!exampleOpen}
            onMouseDown={keepFocus}
            onClick={duplicateOpenExercise}
            className={`${disablableButtonClass} flex-none`}
          >
            Copy to Library
          </button>
          <ul role="tabpanel" aria-label="Examples" className="m-0 flex min-h-0 list-none flex-col overflow-auto p-0">
            {EXAMPLES.map((example) => (
              <li key={example.id} className="flex">
                <button
                  type="button"
                  title="Click to open"
                  aria-current={example.id === openId}
                  onMouseDown={keepFocus}
                  onClick={() => openExercise(example.id)}
                  className={listButtonClass(example.id === openId)}
                >
                  {example.name}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {tab === 'library' && (
        <>
          <div className="flex gap-1.5">
            <button type="button" onMouseDown={keepFocus} onClick={createExercise} className={buttonClass}>
              New
            </button>
            <button
              type="button"
              title={exampleOpen ? 'Copy the open example to the Library' : 'Copy the open exercise'}
              onMouseDown={keepFocus}
              onClick={duplicateOpenExercise}
              className={buttonClass}
            >
              Duplicate
            </button>
            <button
              type="button"
              title={exampleOpen ? 'An example can’t be deleted' : 'Delete the open exercise'}
              disabled={exampleOpen}
              onMouseDown={keepFocus}
              onClick={() => setToDelete(library.filter((e) => e.id === openId))}
              className={disablableButtonClass}
            >
              Delete
            </button>
          </div>
          <div className="flex gap-1.5">
            <ImportButton className={buttonClass} onImported={setImported} />
            <button
              type="button"
              title="Download every exercise as one file"
              onMouseDown={keepFocus}
              onClick={() => downloadExport(library, folders)}
              className={buttonClass}
            >
              Export all
            </button>
          </div>
          {imported !== null && (
            <p role="status" className="m-0 flex items-center gap-1.5 text-xs text-mute">
              <span className="flex-1">{imported === 0 ? 'Nothing new imported.' : `Imported ${exerciseCount(imported)}.`}</span>
              <button
                type="button"
                aria-label="Dismiss"
                onMouseDown={keepFocus}
                onClick={() => setImported(null)}
                className="cursor-pointer border-0 bg-transparent px-1 text-mute hover:text-accent"
              >
                ×
              </button>
            </p>
          )}
          <div className="flex gap-1.5">
            <input
              type="search"
              aria-label="Filter exercises"
              placeholder="Filter…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="min-w-0 flex-1 rounded-md border border-edge bg-card px-2 py-1 outline-none focus:border-accent"
            />
            <button
              type="button"
              title="Make a folder in the Library"
              onMouseDown={keepFocus}
              onClick={() => {
                // The filter would hide the new, empty folder.
                setFilter('')
                setRenamingId(createFolder())
              }}
              className={`${buttonClass} flex-none`}
            >
              New folder
            </button>
          </div>
          {selected.length > 0 && (
            <div className="flex flex-col gap-1.5 text-xs whitespace-nowrap">
              <div className="flex items-center gap-1.5">
                <span className="flex-1 text-mute">{selected.length} selected</span>
                <button
                  type="button"
                  onMouseDown={keepFocus}
                  onClick={() => setSelectedIds(new Set())}
                  className="cursor-pointer rounded-md border border-edge bg-card px-1.5 py-1 hover:border-accent"
                >
                  Clear
                </button>
              </div>
              <select
                aria-label="Move the selected exercises to a folder"
                value=""
                onChange={(e) => {
                  moveToFolder(
                    selected.map((x) => x.id),
                    e.target.value === NO_FOLDER ? null : e.target.value,
                  )
                  // Space and Enter belong to the editor.
                  e.target.blur()
                }}
                className="cursor-pointer rounded-md border border-edge bg-card px-1.5 py-1 font-semibold hover:border-accent"
              >
                <option value="" disabled hidden>
                  Move to…
                </option>
                <option value={NO_FOLDER}>No folder</option>
                {foldersByName(folders).map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  title="Download the selected exercises as one file"
                  onMouseDown={keepFocus}
                  onClick={() => downloadExport(selected, folders)}
                  className="flex-1 cursor-pointer rounded-md border border-edge bg-card px-1.5 py-1 font-semibold hover:border-accent"
                >
                  Export selected
                </button>
                <button
                  type="button"
                  onMouseDown={keepFocus}
                  onClick={() => setToDelete(selected)}
                  className="flex-1 cursor-pointer rounded-md border border-edge bg-card px-1.5 py-1 font-semibold text-danger hover:border-danger"
                >
                  Delete selected
                </button>
              </div>
            </div>
          )}
          <ul className="m-0 flex min-h-0 list-none flex-col overflow-auto p-0">
            {view.folders.map(({ folder, count, expanded, exercises }) => (
              <li key={folder.id} {...dropProps(folder.id)} className={`flex flex-col ${dropTargetClass(dropTarget === folder.id)}`}>
                <div className="group flex items-center gap-0.5">
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-label={`${expanded ? 'Collapse' : 'Expand'} ${folder.name}`}
                    // The filter keeps folders with a match open.
                    disabled={filter !== ''}
                    onMouseDown={keepFocus}
                    onClick={() => setFolderCollapsed(folder.id, expanded)}
                    className="w-5 shrink-0 cursor-pointer border-0 bg-transparent p-0 text-mute hover:text-accent disabled:cursor-default disabled:hover:text-mute"
                  >
                    {expanded ? '▾' : '▸'}
                  </button>
                  {renamingId === folder.id ? (
                    <NameInput
                      name={folder.name}
                      label="Folder name"
                      onDone={(name) => {
                        if (name !== null) renameFolder(folder.id, name)
                        setRenamingId(null)
                      }}
                      className="w-full flex-1 py-1 font-semibold"
                    />
                  ) : (
                    <span
                      title="Double-click to rename"
                      onDoubleClick={() => setRenamingId(folder.id)}
                      className="min-w-0 flex-1 cursor-default truncate py-1 font-semibold select-none"
                    >
                      {folder.name}
                    </span>
                  )}
                  <span title={exerciseCount(count)} className="shrink-0 px-1 text-xs text-mute">
                    {count}
                  </span>
                  <button
                    type="button"
                    aria-label={`Delete folder ${folder.name}`}
                    title="Delete the folder; its exercises are kept"
                    onMouseDown={keepFocus}
                    onClick={() => setFolderToDelete({ folder, count })}
                    className="shrink-0 cursor-pointer border-0 bg-transparent px-1 text-mute opacity-0 group-hover:opacity-100 hover:text-danger focus:opacity-100"
                  >
                    ×
                  </button>
                </div>
                {exercises.length > 0 && (
                  <ul className="m-0 flex list-none flex-col p-0">{exercises.map((e) => exerciseRow(e, true))}</ul>
                )}
              </li>
            ))}
            {folders.length > 0 ? (
              // Shown even with no exercise listed in it, to drag one out of its folder.
              <li {...dropProps(null)} className={`flex flex-col ${dropTargetClass(dropTarget === null)}`}>
                <span
                  title="Drag an exercise here to take it out of its folder"
                  className="py-1 pl-5 text-xs text-mute select-none"
                >
                  No folder
                </span>
                <ul className="m-0 flex list-none flex-col p-0">{view.loose.map((e) => exerciseRow(e, false))}</ul>
              </li>
            ) : (
              view.loose.map((e) => exerciseRow(e, false))
            )}
            {view.folders.length === 0 && view.loose.length === 0 && (
              <li className="px-2 py-1 text-mute">
                {library.length === 0 && folders.length === 0 ? 'No exercises yet.' : 'No exercises match.'}
              </li>
            )}
          </ul>
        </>
      )}
      {folderToDelete && (
        <ConfirmDialog
          title={`Delete the folder “${folderToDelete.folder.name}”?`}
          confirmLabel="Delete folder"
          onConfirm={() => {
            deleteFolder(folderToDelete.folder.id)
            setFolderToDelete(null)
          }}
          onCancel={() => setFolderToDelete(null)}
        >
          {folderToDelete.count === 0
            ? 'It’s empty.'
            : `Its ${exerciseCount(folderToDelete.count)} ${folderToDelete.count === 1 ? 'is' : 'are'} kept, moved out of the folder.`}
        </ConfirmDialog>
      )}
      {toDelete && (
        <ConfirmDialog
          title={toDelete.length === 1 ? `Delete “${toDelete[0].name}”?` : `Delete ${exerciseCount(toDelete.length)}?`}
          confirmLabel={`Delete ${exerciseCount(toDelete.length)}`}
          onConfirm={() => {
            const ids = toDelete.map((e) => e.id)
            deleteExercises(ids)
            setSelectedIds((selected) => new Set([...selected].filter((id) => !ids.includes(id))))
            setToDelete(null)
          }}
          onCancel={() => setToDelete(null)}
        >
          This can't be undone.
        </ConfirmDialog>
      )}
    </aside>
  )
}
