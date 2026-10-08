// Layout A, "Workstation": library sidebar | header, notation view, editor panel | settings sidebar.
// Either sidebar collapses to a rail; below 1000 px both are rails that open over the notation.

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { GridEditor } from '@/features/editor/GridEditor'
import { ExampleNotice } from '@/features/library/ExampleNotice'
import { LibrarySidebar } from '@/features/library/LibrarySidebar'
import { NotationView } from '@/features/notation/NotationView'
import { TransportControls } from '@/features/playback/TransportControls'
import { SettingsSidebar } from '@/features/settings/SettingsSidebar'
import { useAppStore } from '@/app/store'
import { useNarrowWindow } from '@/app/useNarrowWindow'
import { NameInput } from '@/components/NameInput'
import type { Side } from '@/components/Sidebar'
import { SidebarOverlay, SidebarRail } from '@/components/Sidebar'
import { keepFocus } from '@/components/keepFocus'
import { isExample } from '@/core'

export function App() {
  const saving = useAppStore((s) => s.saving)
  const sidebars = useSidebars()
  return (
    <div className="grid h-screen grid-cols-[auto_1fr_auto]">
      <SidebarSlot name="Exercises" side="left" {...sidebars.library}>
        <LibrarySidebar onCollapse={sidebars.library.onCollapse} />
      </SidebarSlot>

      <main className="flex min-h-0 min-w-0 flex-col">
        <header className="flex items-center gap-3.5 border-b border-line bg-card px-4 py-2">
          <h1 className="m-0 text-base font-bold">Syncopate!</h1>
          <ExerciseName />
          {!saving && (
            <span className="font-semibold text-danger" title="This browser blocked storage, or it failed to open">
              Not saving: changes will be lost on reload
            </span>
          )}
          <TransportControls />
        </header>
        <ExampleNotice />
        <NotationView />
        <GridEditor />
      </main>

      <SidebarSlot name="Settings" side="right" {...sidebars.settings}>
        <SettingsSidebar onCollapse={sidebars.settings.onCollapse} />
      </SidebarSlot>
    </div>
  )
}

type SidebarId = 'library' | 'settings'

/** How a sidebar shows: in its column, as a rail, or as a rail with the sidebar over the notation. */
type SidebarState = 'open' | 'rail' | 'overlay'

interface SidebarControl {
  state: SidebarState
  onOpen: () => void
  onCollapse: () => void
}

const STORED_OPEN = { library: 'librarySidebarOpen', settings: 'settingsSidebarOpen' } as const

/**
 * Each sidebar's state and its open and collapse actions. In a wide window, whether each is open is
 * the stored device setting. In a narrow one both are rails, and at most one shows as an overlay,
 * which isn't stored, and which `Esc`, a click outside or opening an exercise closes.
 */
function useSidebars(): Record<SidebarId, SidebarControl> {
  const narrow = useNarrowWindow()
  const device = useAppStore((s) => s.device)
  const setDeviceSettings = useAppStore((s) => s.setDeviceSettings)
  const openId = useAppStore((s) => s.editor.exercise.id)
  const [overlay, setOverlay] = useState<SidebarId | null>(null)

  // An overlay closes when the window widens past it, and when an exercise is opened from it.
  useEffect(() => setOverlay(null), [narrow, openId])

  useEffect(() => {
    if (!overlay) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // A text field or a dialog in the sidebar has its own Escape.
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select, [contenteditable]')) return
      if (document.querySelector('dialog[open]')) return
      // Ahead of the editor's keys, which then don't see it.
      e.preventDefault()
      e.stopPropagation()
      setOverlay(null)
    }
    window.addEventListener('keydown', onKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true })
  }, [overlay])

  const control = (id: SidebarId): SidebarControl =>
    narrow
      ? {
          state: overlay === id ? 'overlay' : 'rail',
          onOpen: () => setOverlay(overlay === id ? null : id),
          onCollapse: () => setOverlay(null),
        }
      : {
          state: device[STORED_OPEN[id]] ? 'open' : 'rail',
          onOpen: () => setDeviceSettings({ [STORED_OPEN[id]]: true }),
          onCollapse: () => setDeviceSettings({ [STORED_OPEN[id]]: false }),
        }
  return { library: control('library'), settings: control('settings') }
}

/** A sidebar's grid column: the sidebar itself, or its rail, with the sidebar over the notation as an overlay. */
function SidebarSlot({ name, side, state, onOpen, onCollapse, children }: SidebarControl & { name: string; side: Side; children: ReactNode }) {
  if (state === 'open') return children
  return (
    <>
      <SidebarRail name={name} side={side} expanded={state === 'overlay'} onOpen={onOpen} />
      {state === 'overlay' && (
        <>
          {/* A click outside the overlay closes it; the rails stay uncovered, so the other one opens at once. */}
          <div
            aria-hidden
            className="fixed inset-y-0 right-8 left-8 z-20"
            onMouseDown={(e) => {
              e.preventDefault()
              onCollapse()
            }}
          />
          <SidebarOverlay side={side}>{children}</SidebarOverlay>
        </>
      )}
    </>
  )
}

/** The open exercise's name; click it to rename it in place. An example's name is fixed. */
function ExerciseName() {
  const { id, name } = useAppStore((s) => s.editor.exercise)
  const renameExercise = useAppStore((s) => s.renameExercise)
  const [renaming, setRenaming] = useState(false)
  if (isExample(id)) return <span className="truncate px-1 text-mute">{name}</span>
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
      onMouseDown={keepFocus}
      onClick={() => setRenaming(true)}
      className="cursor-text truncate rounded border border-transparent bg-transparent px-1 text-mute hover:border-line"
    >
      {name}
    </button>
  )
}
