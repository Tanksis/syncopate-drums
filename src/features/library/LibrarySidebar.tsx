import type { MouseEvent } from 'react'
import { useState } from 'react'
import { useAppStore } from '@/app/store'
import { NameInput } from '@/components/NameInput'
import { PanelHeading } from '@/components/PanelHeading'
import { filterByName } from '@/core'

// Buttons keep focus off themselves, so Space still enters a rest rather than clicking them again.
const keepFocus = (e: MouseEvent) => e.preventDefault()

const buttonClass =
  'flex-1 cursor-pointer rounded-md border border-line bg-card px-2 py-1 font-semibold hover:border-accent'

/** The exercise library: filter, New and Duplicate, and the list (click to open, double-click to rename). */
export function LibrarySidebar() {
  const library = useAppStore((s) => s.library)
  const openId = useAppStore((s) => s.editor.exercise.id)
  const { openExercise, createExercise, duplicateOpenExercise, renameExercise } = useAppStore.getState()
  const [filter, setFilter] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const shown = filterByName(library, filter)

  return (
    <aside
      aria-label="Exercise library"
      className="flex min-h-0 flex-col gap-2 border-r border-line bg-panel px-2.5 py-3"
    >
      <PanelHeading>Exercises</PanelHeading>
      <div className="flex gap-1.5">
        <button type="button" onMouseDown={keepFocus} onClick={createExercise} className={buttonClass}>
          New
        </button>
        <button
          type="button"
          title="Copy the open exercise"
          onMouseDown={keepFocus}
          onClick={duplicateOpenExercise}
          className={buttonClass}
        >
          Duplicate
        </button>
      </div>
      <input
        type="search"
        aria-label="Filter exercises"
        placeholder="Filter…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="rounded-md border border-line bg-card px-2 py-1 outline-none focus:border-accent"
      />
      <ul className="m-0 flex min-h-0 list-none flex-col overflow-auto p-0">
        {shown.map((exercise) => (
          <li key={exercise.id}>
            {renamingId === exercise.id ? (
              <NameInput
                name={exercise.name}
                onDone={(name) => {
                  if (name !== null) renameExercise(exercise.id, name)
                  setRenamingId(null)
                }}
                className="w-full py-1"
              />
            ) : (
              <button
                type="button"
                title="Click to open, double-click to rename"
                aria-current={exercise.id === openId}
                onMouseDown={keepFocus}
                onClick={() => openExercise(exercise.id)}
                onDoubleClick={() => setRenamingId(exercise.id)}
                className={`w-full cursor-pointer truncate rounded-md border-0 px-2 py-1 text-left ${
                  exercise.id === openId ? 'bg-accent/10 font-semibold text-accent' : 'bg-transparent hover:bg-line'
                }`}
              >
                {exercise.name}
              </button>
            )}
          </li>
        ))}
        {shown.length === 0 && <li className="px-2 py-1 text-mute">No exercises match.</li>}
      </ul>
    </aside>
  )
}
