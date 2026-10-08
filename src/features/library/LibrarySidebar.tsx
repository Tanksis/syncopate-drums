import { useState } from 'react'
import { useAppStore } from '@/app/store'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { NameInput } from '@/components/NameInput'
import { PanelHeading } from '@/components/PanelHeading'
import { keepFocus } from '@/components/keepFocus'
import type { Exercise, LibraryTab } from '@/core'
import { exampleExercises, filterByName, isExample, tabListing } from '@/core'
import { downloadExport } from './download'
import { exerciseCount } from './exerciseCount'
import { ImportButton } from './ImportButton'

/** The built-in examples, the same every time; never stored (ADR 0008). */
const EXAMPLES = exampleExercises()

const buttonClass =
  'flex-1 cursor-pointer rounded-md border border-line bg-card px-2 py-1 font-semibold hover:border-accent'

/** A sidebar button that's disabled for an example, or with no example open. */
const disablableButtonClass = `${buttonClass} disabled:cursor-default disabled:text-mute disabled:hover:border-line`

/** An exercise's button in a list, marked when it's the open one. */
const listButtonClass = (open: boolean) =>
  `min-w-0 flex-1 cursor-pointer truncate rounded-md border-0 px-2 py-1 text-left ${
    open ? 'bg-accent/10 font-semibold text-accent' : 'bg-transparent hover:bg-line'
  }`

const TABS: { id: LibraryTab; label: string }[] = [
  { id: 'library', label: 'Library' },
  { id: 'examples', label: 'Examples' },
]

/**
 * The sidebar's two tabs. Library: filter, New, Duplicate, Delete, Import and Export all, and the
 * list (click to open, double-click to rename, tick to select). The selection stays through
 * filtering and can be exported or deleted together. Examples: the built-in examples, to open, and
 * Copy to Library for the open one.
 */
export function LibrarySidebar() {
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
  const [filter, setFilter] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set())
  /** The exercises waiting on the delete confirm, if it's showing. */
  const [toDelete, setToDelete] = useState<Exercise[] | null>(null)
  /** How many exercises the last import stored, shown until the next library action. */
  const [imported, setImported] = useState<number | null>(null)
  const shown = filterByName(library, filter)
  // Exercises discarded or deleted since they were ticked drop out here.
  const selected = library.filter((e) => selectedIds.has(e.id))

  const toggleSelected = (id: string) =>
    setSelectedIds((ids) => {
      const next = new Set(ids)
      if (!next.delete(id)) next.add(id)
      return next
    })

  return (
    <aside
      aria-label="Exercise library"
      className="flex min-h-0 flex-col gap-2 border-r border-line bg-panel px-2.5 py-3"
    >
      <PanelHeading>Exercises</PanelHeading>
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
              onClick={() => downloadExport(library)}
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
          <input
            type="search"
            aria-label="Filter exercises"
            placeholder="Filter…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-md border border-line bg-card px-2 py-1 outline-none focus:border-accent"
          />
          {selected.length > 0 && (
            <div className="flex flex-col gap-1.5 text-xs whitespace-nowrap">
              <div className="flex items-center gap-1.5">
                <span className="flex-1 text-mute">{selected.length} selected</span>
                <button
                  type="button"
                  onMouseDown={keepFocus}
                  onClick={() => setSelectedIds(new Set())}
                  className="cursor-pointer rounded-md border border-line bg-card px-1.5 py-1 hover:border-accent"
                >
                  Clear
                </button>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  title="Download the selected exercises as one file"
                  onMouseDown={keepFocus}
                  onClick={() => downloadExport(selected)}
                  className="flex-1 cursor-pointer rounded-md border border-line bg-card px-1.5 py-1 font-semibold hover:border-accent"
                >
                  Export selected
                </button>
                <button
                  type="button"
                  onMouseDown={keepFocus}
                  onClick={() => setToDelete(selected)}
                  className="flex-1 cursor-pointer rounded-md border border-line bg-card px-1.5 py-1 font-semibold text-danger hover:border-danger"
                >
                  Delete selected
                </button>
              </div>
            </div>
          )}
          <ul className="m-0 flex min-h-0 list-none flex-col overflow-auto p-0">
            {shown.map((exercise) => (
              <li key={exercise.id} className="flex items-center gap-1 pl-1">
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
                    onMouseDown={keepFocus}
                    onClick={() => openExercise(exercise.id)}
                    onDoubleClick={() => setRenamingId(exercise.id)}
                    className={listButtonClass(exercise.id === openId)}
                  >
                    {exercise.name}
                  </button>
                )}
              </li>
            ))}
            {shown.length === 0 && (
              <li className="px-2 py-1 text-mute">{library.length === 0 ? 'No exercises yet.' : 'No exercises match.'}</li>
            )}
          </ul>
        </>
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
