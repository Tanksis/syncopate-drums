// Layout A, "Workstation": library sidebar | header, notation view, editor panel | settings sidebar.

import { useState } from 'react'
import { GridEditor } from '@/features/editor/GridEditor'
import { LibrarySidebar } from '@/features/library/LibrarySidebar'
import { NotationView } from '@/features/notation/NotationView'
import { TransportControls } from '@/features/playback/TransportControls'
import { SettingsSidebar } from '@/features/settings/SettingsSidebar'
import { useAppStore } from '@/app/store'
import { NameInput } from '@/components/NameInput'

export function App() {
  const saving = useAppStore((s) => s.saving)
  return (
    <div className="grid h-screen grid-cols-[230px_1fr_250px]">
      <LibrarySidebar />

      <main className="flex min-h-0 min-w-0 flex-col">
        <header className="flex items-center gap-3.5 border-b border-line bg-card px-4 py-2">
          <h1 className="m-0 text-base font-bold">Syncopate!</h1>
          <ExerciseName />
          {!saving && (
            <span className="font-semibold text-red-700" title="This browser blocked storage, or it failed to open">
              Not saving: changes will be lost on reload
            </span>
          )}
          <TransportControls />
        </header>
        <NotationView />
        <GridEditor />
      </main>

      <SettingsSidebar />
    </div>
  )
}

/** The open exercise's name; click it to rename it in place. */
function ExerciseName() {
  const { id, name } = useAppStore((s) => s.editor.exercise)
  const renameExercise = useAppStore((s) => s.renameExercise)
  const [renaming, setRenaming] = useState(false)
  if (renaming)
    return (
      <NameInput
        name={name}
        onDone={(newName) => {
          if (newName !== null) renameExercise(id, newName)
          setRenaming(false)
        }}
        className="w-56"
      />
    )
  return (
    <button
      type="button"
      title="Rename"
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => setRenaming(true)}
      className="cursor-text truncate rounded border border-transparent bg-transparent px-1 text-mute hover:border-line"
    >
      {name}
    </button>
  )
}
