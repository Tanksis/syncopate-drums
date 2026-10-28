import { useRef, useState } from 'react'
import { useAppStore } from '@/app/store'
import { Button, buttonClass } from '@/components/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { DuplicateIcon, HelpIcon, MoreIcon, PencilIcon, PlusIcon, TrashIcon } from '@/components/icons'
import { Menu } from '@/components/Menu'
import { NameInput } from '@/components/NameInput'
import { PatternDialog } from '@/components/PatternDialog'
import { SelectButtonFace, selectButtonClass } from '@/components/SelectMenu'
import { SidebarHeading } from '@/components/Sidebar'
import { keepFocus } from '@/components/keepFocus'
import type { Exercise, Folder, LibraryTab } from '@/core'
import { RUDIMENT_FAMILIES, exampleExercises, exampleTitle, foldersByName, isBuiltIn, libraryView, rudimentList, tabListing } from '@/core'
import { downloadExport } from './download'
import { exerciseCount } from './exerciseCount'
import { ImportFile } from './ImportFile'
import { useExerciseDrop } from './useExerciseDrop'

/** The built-in examples, the same every time; never stored (ADR 0008). */
const EXAMPLES = exampleExercises()

/** The 40 rudiments by family, the ones not built yet without an id; never stored (ADR 0018). */
const RUDIMENT_LIST = rudimentList()
const RUDIMENTS_BY_FAMILY = RUDIMENT_FAMILIES.map((family) => {
  const rudiments = RUDIMENT_LIST.filter((r) => r.family === family)
  return { family, rudiments, built: rudiments.filter((r) => r.id).length }
})

/** A toolbar icon button or menu button; `large` is big enough for a finger. */
const toolSize = (large: boolean) => (large ? 'lg' : 'md')
const toolClass = (large: boolean) => buttonClass({ size: toolSize(large), icon: true })

/** An exercise's button in a list, marked when it's the open one. */
const listButtonClass = (open: boolean) =>
  `min-w-0 flex-1 cursor-pointer truncate rounded-md border-0 px-2 py-1 text-left ${
    open ? 'bg-accent/10 font-semibold text-accent' : 'bg-transparent hover:bg-hover'
  }`

/** A drop target, outlined in the accent while an exercise is dragged over it; inset, as the list clips. */
const dropTargetClass = (over: boolean) => `rounded-md ${over ? 'outline-2 -outline-offset-2 outline-accent' : ''}`

/** The lists the heading's menu switches between: the sidebar's tabs. */
const TABS: { id: LibraryTab; label: string }[] = [
  { id: 'library', label: 'Library' },
  { id: 'examples', label: 'Examples' },
  { id: 'rudiments', label: 'Rudiments' },
]

/**
 * The sidebar's three tabs, switched by the menu its heading is, which names the one showing and dots
 * the one holding the open exercise. Library: a toolbar (a + menu of New, New from pattern… and New folder;
 * Duplicate and Delete; a ⋯ menu of Import… and Export all), the filter, and the list: the
 * folders (chevron to collapse, double-click to rename, × to delete), each with its exercises,
 * then the exercises in no folder (click to open, double-click to rename, tick to select, drag
 * onto a folder or "No folder" to move it there). The selection stays through filtering and can
 * be exported, deleted or moved to a folder together. Examples: the built-in examples, to open.
 * Rudiments: the 40 PAS rudiments in their families, folders that fold (remembered on the device)
 * and count the ones built; those open, the rest greyed, "coming soon". On both, a copy icon by the
 * heading makes a Library copy of the open one.
 * Given `onHelp` (the phone's, which has no header button for it), Help at its foot opens the Help page.
 */
export function LibrarySidebar({ onCollapse, fullScreen = false, onHelp }: { onCollapse: () => void; fullScreen?: boolean; onHelp?: () => void }) {
  const library = useAppStore((s) => s.library)
  const openId = useAppStore((s) => s.editor.exercise.id)
  const tab = useAppStore((s) => s.device.libraryTab)
  const setDeviceSettings = useAppStore((s) => s.setDeviceSettings)
  const openFamilies = useAppStore((s) => s.device.openRudimentFamilies)
  const tabLabel = TABS.find(({ id }) => id === tab)!.label
  const builtInOpen = isBuiltIn(openId)
  const openInStore = useAppStore((s) => s.openExercise)
  // An exercise opened from the Metronome screen shows on Practice, where it can be seen.
  const openExercise = (id: string) => {
    openInStore(id)
    setDeviceSettings({ screen: 'practice' })
  }
  const createExercise = useAppStore((s) => s.createExercise)
  const createFromPattern = useAppStore((s) => s.createFromPattern)
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
  /** Whether New from pattern's dialog is showing. */
  const [newFromPatternOpen, setNewFromPatternOpen] = useState(false)
  /** The folder waiting on the delete confirm, if it's showing. */
  const [folderToDelete, setFolderToDelete] = useState<{ folder: Folder; count: number } | null>(null)
  /** How many exercises the last import stored, shown until the next library action. */
  const [imported, setImported] = useState<number | null>(null)
  const view = libraryView({ library, folders, filter, collapsedIds })
  // Exercises discarded or deleted since they were ticked drop out here.
  const selected = library.filter((e) => selectedIds.has(e.id))
  const moveMenu = useRef<HTMLDivElement>(null)
  const moveSelected = (folderId: string | null) => {
    moveToFolder(
      selected.map((x) => x.id),
      folderId,
    )
    // Chosen from the keyboard, the menu gives the focus back to its button; Space and Enter belong to the editor.
    const focused = document.activeElement
    if (focused instanceof HTMLElement && moveMenu.current?.contains(focused)) focused.blur()
  }

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
      className={`group flex items-center gap-1 ${inFolder ? 'pl-5' : 'pl-1'}`}
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
        <>
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
          <RenamePencil name={exercise.name} onClick={() => setRenamingId(exercise.id)} />
        </>
      )}
    </li>
  )

  return (
    <aside
      aria-label="Exercise library"
      className={`flex min-h-0 flex-col gap-2 bg-panel px-2.5 py-3 ${fullScreen ? 'w-full' : 'w-[230px] border-r border-line'}`}
    >
      <SidebarHeading
        name="Exercises"
        side="left"
        fullScreen={fullScreen}
        onCollapse={onCollapse}
        title={
          <Menu
            label={`Exercise list: ${tabLabel}`}
            large={fullScreen}
            align="left"
            icon={
              <>
                {tabLabel}
                <span aria-hidden className="text-[0.8em]">
                  ▾
                </span>
              </>
            }
            // The heading's own face, as a button.
            buttonClassName="-mx-1 -my-0.5 flex cursor-pointer items-center gap-1 rounded border-0 bg-transparent px-1 py-0.5 [font:inherit] [letter-spacing:inherit] [font-variant-caps:inherit] [text-transform:inherit] text-inherit hover:bg-hover hover:text-ink aria-expanded:bg-hover aria-expanded:text-ink"
            items={TABS.map(({ id, label }) => ({
              label,
              checked: tab === id,
              aside: id === tabListing(openId) && <span title="The open exercise is here" className="block size-1.5 rounded-full bg-accent" />,
              onSelect: () => setDeviceSettings({ libraryTab: id }),
            }))}
          />
        }
        actions={
          tab !== 'library' && (
            <Button
              variant="ghost"
              size={fullScreen ? 'lg' : 'sm'}
              icon
              aria-label="Copy to Library"
              title={tabListing(openId) === tab ? 'Make an editable copy of the open one in the Library' : `Open one of the ${tabLabel.toLowerCase()} to copy it`}
              disabled={tabListing(openId) !== tab}
              onClick={duplicateOpenExercise}
              className={fullScreen ? '' : '-mt-1'}
            >
              <DuplicateIcon />
            </Button>
          )
        }
      />
      {tab === 'examples' && (
        <>
          <ul aria-label="Examples" className="m-0 flex min-h-0 list-none flex-col overflow-auto p-0">
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
                  {exampleTitle(example)}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {tab === 'rudiments' && (
        <>
          <div aria-label="Rudiments" className="flex min-h-0 flex-col overflow-auto">
            {RUDIMENTS_BY_FAMILY.map(({ family, rudiments, built }) => {
              const open = openFamilies.includes(family)
              return (
                <section key={family} aria-label={family} className="flex flex-col">
                  <button
                    type="button"
                    aria-expanded={open}
                    onMouseDown={keepFocus}
                    onClick={() => setDeviceSettings({ openRudimentFamilies: open ? openFamilies.filter((f) => f !== family) : [...openFamilies, family] })}
                    className={`flex cursor-pointer items-center rounded-md border-0 bg-transparent pr-2 pl-0 text-left font-semibold hover:bg-hover ${fullScreen ? 'py-2.5' : 'py-1'}`}
                  >
                    <span aria-hidden className="w-5 shrink-0 text-mute">
                      {open ? '▾' : '▸'}
                    </span>
                    <span className="flex-1">{family}</span>
                    <span title={`${built} of its ${rudiments.length} built so far`} className="text-xs font-normal text-mute tabular-nums">
                      {built} / {rudiments.length}
                    </span>
                  </button>
                  {open && (
                  <ul className="m-0 flex list-none flex-col p-0 pl-5">
                    {rudiments.map(({ number, name, id }) => {
                      const label = (
                        <>
                          <span className="tabular-nums">{number}</span> · {name}
                        </>
                      )
                      return (
                        <li key={number} className="flex">
                          {id ? (
                            <button
                              type="button"
                              title="Click to open"
                              aria-current={id === openId}
                              onMouseDown={keepFocus}
                              onClick={() => openExercise(id)}
                              className={listButtonClass(id === openId)}
                            >
                              {label}
                            </button>
                          ) : (
                            <span
                              aria-disabled
                              title="Coming soon"
                              className="flex min-w-0 flex-1 items-baseline gap-1.5 px-2 py-1 text-mute opacity-60 select-none"
                            >
                              <span className="truncate">{label}</span>
                              <span className="ml-auto shrink-0 text-[10px] italic">coming soon</span>
                            </span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                  )}
                </section>
              )
            })}
          </div>
        </>
      )}
      {tab === 'library' && (
        <>
          <div role="group" aria-label="Library actions" className="flex gap-1.5">
            <Menu
              label="New"
              large={fullScreen}
              icon={<PlusIcon />}
              align="left"
              buttonClassName={toolClass(fullScreen)}
              items={[
                { label: 'New', onSelect: createExercise },
                { label: 'New from pattern…', onSelect: () => setNewFromPatternOpen(true) },
                {
                  label: 'New folder',
                  onSelect: () => {
                    // The filter would hide the new, empty folder.
                    setFilter('')
                    setRenamingId(createFolder())
                  },
                },
              ]}
            />
            <Button
              size={toolSize(fullScreen)}
              icon
              aria-label="Duplicate"
              title={builtInOpen ? 'Copy the open exercise to the Library' : 'Duplicate the open exercise'}
              onClick={duplicateOpenExercise}
            >
              <DuplicateIcon />
            </Button>
            <Button
              size={toolSize(fullScreen)}
              icon
              aria-label="Delete"
              title={builtInOpen ? 'A built-in exercise can’t be deleted' : 'Delete the open exercise'}
              disabled={builtInOpen}
              onClick={() => setToDelete(library.filter((e) => e.id === openId))}
            >
              <TrashIcon />
            </Button>
            {/* Pushes ⋯ to the right edge. */}
            <span className="flex-1" />
            <ImportFile onImported={setImported}>
              {(pick) => (
                <Menu
                  label="More library actions"
                  large={fullScreen}
                  icon={<MoreIcon />}
                  buttonClassName={toolClass(fullScreen)}
                  items={[
                    { label: 'Import…', onSelect: pick },
                    { label: 'Export all', onSelect: () => downloadExport(library, folders) },
                  ]}
                />
              )}
            </ImportFile>
          </div>
          {imported !== null && (
            <p role="status" className="m-0 flex items-center gap-1.5 text-xs text-mute">
              <span className="flex-1">{imported === 0 ? 'Nothing new imported.' : `Imported ${exerciseCount(imported)}.`}</span>
              <Button variant="ghost" icon aria-label="Dismiss" onClick={() => setImported(null)}>
                ×
              </Button>
            </p>
          )}
          <input
            type="search"
            aria-label="Filter exercises"
            placeholder="Filter…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            // 16 px on the phone, where iOS zooms into a smaller field it focuses.
            className={`rounded-md border border-edge bg-card px-2 outline-none focus:border-accent ${fullScreen ? 'py-2 text-base' : 'py-1'}`}
          />
          {selected.length > 0 && (
            <div className="flex flex-col gap-1.5 text-xs whitespace-nowrap">
              <div className="flex items-center gap-1.5">
                <span className="flex-1 text-mute">{selected.length} selected</span>
                <Button onClick={() => setSelectedIds(new Set())}>
                  Clear
                </Button>
              </div>
              <div ref={moveMenu} className="contents">
                <Menu
                  label="Move the selected exercises to a folder"
                  large={fullScreen}
                  align="left"
                  icon={<SelectButtonFace text="Move to…" />}
                  buttonClassName={selectButtonClass()}
                  items={[
                    { label: 'No folder', onSelect: () => moveSelected(null) },
                    ...foldersByName(folders).map((folder) => ({ label: folder.name, onSelect: () => moveSelected(folder.id) })),
                  ]}
                />
              </div>
              <div className="flex gap-1.5">
                <Button title="Download the selected exercises as one file" onClick={() => downloadExport(selected, folders)} className="flex-1">
                  Export
                </Button>
                <Button onClick={() => setToDelete(selected)} className="flex-1 text-danger! enabled:hover:border-danger!">
                  Delete
                </Button>
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
                    <>
                      <span
                        title="Double-click to rename"
                        onDoubleClick={() => setRenamingId(folder.id)}
                        className="min-w-0 flex-1 cursor-default truncate py-1 font-semibold select-none"
                      >
                        {folder.name}
                      </span>
                      <RenamePencil name={folder.name} onClick={() => setRenamingId(folder.id)} />
                    </>
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
            {view.folders.length === 0 && view.loose.length === 0 &&
              (library.length === 0 && folders.length === 0 ? (
                // An empty Library offers the two ways to fill it.
                <li className="flex flex-col gap-2 px-2 py-1">
                  <span className="text-mute">No exercises yet.</span>
                  <Button variant="primary" size={toolSize(fullScreen)} onClick={createExercise}>
                    New exercise
                  </Button>
                  <span className="text-xs text-mute">
                    Or copy one from{' '}
                    <button
                      type="button"
                      onMouseDown={keepFocus}
                      onClick={() => setDeviceSettings({ libraryTab: 'examples' })}
                      className="cursor-pointer border-0 bg-transparent p-0 text-accent underline"
                    >
                      Examples
                    </button>
                    .
                  </span>
                </li>
              ) : (
                <li className="px-2 py-1 text-mute">No exercises match.</li>
              ))}
          </ul>
        </>
      )}
      {onHelp && (
        <Button variant="ghost" size={toolSize(fullScreen)} onClick={onHelp} className="mt-auto gap-2 self-start">
          <HelpIcon />
          Help
        </Button>
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
      {newFromPatternOpen && (
        <PatternDialog
          title="New from pattern"
          submitLabel="Create"
          askBars
          onCancel={() => setNewFromPatternOpen(false)}
          onSubmit={({ text, grid, bars }) => {
            setNewFromPatternOpen(false)
            createFromPattern({ pattern: text, grid, bars })
          }}
        />
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

/**
 * A row's pencil, shown on hover or focus, that starts the same rename as a double-click. Its
 * keepFocus means a drag can't start from it, which a rename button can do without.
 */
function RenamePencil({ name, onClick }: { name: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={`Rename ${name}`}
      title="Rename"
      onMouseDown={keepFocus}
      onClick={onClick}
      className="flex shrink-0 cursor-pointer border-0 bg-transparent p-0.5 text-mute opacity-0 group-hover:opacity-100 hover:text-accent focus:opacity-100"
    >
      <PencilIcon />
    </button>
  )
}
