// Layout A, "Workstation": library sidebar | header, notation view, editor panel | settings sidebar.

import { GridEditor } from '@/features/editor/GridEditor'
import { LibrarySidebar } from '@/features/library/LibrarySidebar'
import { NotationView } from '@/features/notation/NotationView'
import { TransportControls } from '@/features/playback/TransportControls'
import { SettingsSidebar } from '@/features/settings/SettingsSidebar'
import { useAppStore } from '@/app/store'

export function App() {
  const name = useAppStore((s) => s.editor.exercise.name)
  const saving = useAppStore((s) => s.saving)
  return (
    <div className="grid h-screen grid-cols-[230px_1fr_250px]">
      <LibrarySidebar />

      <main className="flex min-h-0 min-w-0 flex-col">
        <header className="flex items-center gap-3.5 border-b border-line bg-card px-4 py-2">
          <h1 className="m-0 text-base font-bold">Syncopate!</h1>
          <span className="text-mute">{name}</span>
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
