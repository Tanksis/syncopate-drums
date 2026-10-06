// Layout A, "Workstation": library sidebar | header, notation view, editor panel | settings sidebar.
// The columns are empty shells for now; later tickets fill them.

import { GridEditor } from '@/features/editor/GridEditor'
import { LibrarySidebar } from '@/features/library/LibrarySidebar'
import { NotationView } from '@/features/notation/NotationView'
import { SettingsSidebar } from '@/features/settings/SettingsSidebar'

export function App() {
  return (
    <div className="grid h-screen grid-cols-[230px_1fr_250px]">
      <LibrarySidebar />

      <main className="flex min-h-0 min-w-0 flex-col">
        <header className="flex items-center gap-3.5 border-b border-line bg-card px-4 py-2">
          <h1 className="m-0 text-base font-bold">Syncopate!</h1>
        </header>
        <NotationView />
        <GridEditor />
      </main>

      <SettingsSidebar />
    </div>
  )
}
