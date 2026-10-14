// Layout A, "Workstation": library sidebar | header, notation card, editor panel | settings sidebar.
// Either sidebar collapses to a rail; below 1000 px both are rails that open over the notation.
// Below 640 px, the phone layout: a column of header, notation, the editor sheet when it's open,
// and transport bar, with the sidebars opening over the whole screen.

import type { ReactNode } from 'react'
import { useEffect, useLayoutEffect, useState } from 'react'
import { GridEditor } from '@/features/editor/GridEditor'
import { ExampleNotice } from '@/features/library/ExampleNotice'
import { LibrarySidebar } from '@/features/library/LibrarySidebar'
import { NotationView } from '@/features/notation/NotationView'
import { StaffPlayButton } from '@/features/playback/StaffPlayButton'
import { TransportBar } from '@/features/playback/TransportBar'
import type { HeaderRoom } from '@/features/playback/TransportControls'
import { TransportControls } from '@/features/playback/TransportControls'
import { SettingsSidebar } from '@/features/settings/SettingsSidebar'
import { useAppStore } from '@/app/store'
import { useNarrowWindow, usePhoneWindow } from '@/app/useMediaQuery'
import { NameInput } from '@/components/NameInput'
import type { Side } from '@/components/Sidebar'
import { SidebarFullScreen, SidebarOverlay, SidebarRail } from '@/components/Sidebar'
import { Button } from '@/components/Button'
import { keepFocus } from '@/components/keepFocus'
import { SettingsIcon } from '@/components/icons'
import { isExample } from '@/core'

export function App() {
  const sidebars = useSidebars()
  const phone = usePhoneWindow()
  const [headerRef, room] = useHeaderRoom()
  if (phone) return <PhoneLayout sidebars={sidebars} />
  return (
    <div className="grid h-dvh grid-cols-[auto_1fr_auto]">
      <SidebarSlot name="Exercises" side="left" {...sidebars.library}>
        <LibrarySidebar onCollapse={sidebars.library.onCollapse} />
      </SidebarSlot>

      <main className="flex min-h-0 min-w-0 flex-col">
        <header ref={headerRef} className="flex items-center gap-3 border-b border-line bg-card px-4 py-2">
          <h1 className="m-0 shrink-0 text-base font-bold whitespace-nowrap">Syncopate!</h1>
          {/* The name takes the room the controls leave, and always shows about 12 characters. */}
          <div className="flex min-w-[12ch] flex-1">
            <ExerciseName />
          </div>
          <NotSaving />
          <TransportControls room={room} />
          <SettingsToggle {...sidebars.settings} />
        </header>
        <ExampleNotice />
        {/* The music on a card, which takes the height the editor leaves, all of it when that's collapsed. */}
        <div className="flex min-h-0 flex-1 flex-col p-3">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-card border-(length:--card-border) border-line bg-paper shadow-card">
            <NotationView corner={<StaffPlayButton />} />
          </div>
        </div>
        <GridEditor />
      </main>

      <SidebarSlot name="Settings" side="right" {...sidebars.settings}>
        <SettingsSidebar playbackGroup={room === 'compact'} onCollapse={sidebars.settings.onCollapse} />
      </SidebarSlot>
    </div>
  )
}

/**
 * The phone layout: a compact header (☰, the exercise name, ⚙), the notation filling the screen,
 * and the transport bar at the bottom. ☰ and ⚙ open their sidebar over the whole screen. Edit, in
 * the transport bar, opens the grid editor as a sheet under the notation, which Done closes. An
 * example, which can't be changed, has no read-only notice; Copy takes Edit's place instead, and
 * opens an editable copy.
 */
function PhoneLayout({ sidebars }: { sidebars: Record<SidebarId, SidebarControl> }) {
  const { library, settings } = sidebars
  const example = useAppStore((s) => isExample(s.editor.exercise.id))
  const copyToLibrary = useAppStore((s) => s.duplicateOpenExercise)
  const [editOpen, setEditOpen] = useState(false)
  // Opening an example closes the sheet, so it doesn't come back with the next exercise.
  useEffect(() => {
    if (example) setEditOpen(false)
  }, [example])
  const editing = editOpen && !example
  return (
    <div className="flex h-dvh flex-col">
      <header className="flex shrink-0 items-center gap-1 border-b border-line bg-card px-1 pt-[env(safe-area-inset-top)]">
        <PhoneHeaderButton label="Open exercises" expanded={library.state === 'overlay'} onClick={library.onOpen}>
          ☰
        </PhoneHeaderButton>
        <div className="flex min-w-0 flex-1 justify-center text-base">
          <ExerciseName className="w-full text-center" />
        </div>
        <PhoneHeaderButton label="Open settings" expanded={settings.state === 'overlay'} onClick={settings.onOpen}>
          ⚙
        </PhoneHeaderButton>
      </header>
      <NotSaving className="border-b border-line bg-card px-3 py-1 text-xs" />
      <NotationView />
      {editing && <GridEditor onDone={() => setEditOpen(false)} />}
      <TransportBar
        onEdit={example || editing ? undefined : () => setEditOpen(true)}
        onCopy={example ? copyToLibrary : undefined}
      />

      {library.state === 'overlay' && (
        <SidebarFullScreen>
          <LibrarySidebar fullScreen onCollapse={library.onCollapse} />
        </SidebarFullScreen>
      )}
      {settings.state === 'overlay' && (
        <SidebarFullScreen>
          <SettingsSidebar fullScreen playbackGroup onCollapse={settings.onCollapse} />
        </SidebarFullScreen>
      )}
    </div>
  )
}

/** A header button on a phone: ☰ or ⚙, big enough for a finger. */
function PhoneHeaderButton({
  label,
  expanded,
  onClick,
  children,
}: {
  label: string
  expanded: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Button variant="ghost" size="lg" icon aria-label={label} aria-expanded={expanded} onClick={onClick} className="active:bg-line">
      <span aria-hidden>{children}</span>
    </Button>
  )
}

/** The header's button that shows the Settings sidebar or hides it, lit while it shows. */
function SettingsToggle({ state, onOpen, onCollapse }: SidebarControl) {
  const shown = state !== 'rail'
  return (
    <Button
      size="md"
      icon
      aria-label="Settings"
      aria-expanded={shown}
      title={shown ? 'Hide settings' : 'Show settings'}
      onClick={state === 'open' ? onCollapse : onOpen}
    >
      <SettingsIcon />
    </Button>
  )
}

/**
 * The header widths, in px, below which its controls don't all fit while leaving the exercise name
 * its 12 characters or so: under `full` the BPM slider goes, and under `withoutSlider` the count-in
 * and loop chip move to the Settings sidebar too.
 */
const HEADER_WIDTH = { full: 920, withoutSlider: 795 }

/**
 * A ref for the desktop header, and how much of the transport fits in it. That depends on the
 * header's own width, which the window and the open sidebars both take from.
 */
function useHeaderRoom(): [(header: HTMLElement | null) => void, HeaderRoom] {
  const [header, setHeader] = useState<HTMLElement | null>(null)
  const [room, setRoom] = useState<HeaderRoom>('compact')
  useLayoutEffect(() => {
    if (!header) return
    // Kept as the step, not the width, so a resize re-renders only when the step changes.
    const observer = new ResizeObserver(() => {
      const width = header.getBoundingClientRect().width
      if (width >= HEADER_WIDTH.full) setRoom('full')
      else if (width >= HEADER_WIDTH.withoutSlider) setRoom('withoutSlider')
      else setRoom('compact')
    })
    observer.observe(header)
    return () => observer.disconnect()
  }, [header])
  return [setHeader, room]
}

/** The warning shown when storage failed, so changes won't survive a reload. */
function NotSaving({ className = '' }: { className?: string }) {
  const saving = useAppStore((s) => s.saving)
  if (saving) return null
  return (
    <span className={`font-semibold text-danger ${className}`} title="This browser blocked storage, or it failed to open">
      Not saving: changes will be lost on reload
    </span>
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
      // A text field, a dialog or an open menu in the sidebar has its own Escape.
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select, [contenteditable]')) return
      if (document.querySelector('dialog[open], [role=menu]')) return
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
function ExerciseName({ className = '' }: { className?: string }) {
  const { id, name } = useAppStore((s) => s.editor.exercise)
  const renameExercise = useAppStore((s) => s.renameExercise)
  const [renaming, setRenaming] = useState(false)
  if (isExample(id)) return <span className={`truncate px-1 text-mute ${className}`}>{name}</span>
  if (renaming)
    return (
      <NameInput
        name={name}
        onDone={(newName) => {
          if (newName !== null) renameExercise(id, newName)
          setRenaming(false)
        }}
        className={className || 'w-56 max-w-full'}
      />
    )
  return (
    <button
      type="button"
      title="Rename"
      onMouseDown={keepFocus}
      onClick={() => setRenaming(true)}
      className={`cursor-text truncate rounded border border-transparent bg-transparent px-1 text-mute hover:border-edge ${className}`}
    >
      {name}
    </button>
  )
}
