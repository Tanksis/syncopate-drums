// Layout A, "Workstation": one header across the window, and under it library sidebar | the
// exercise's bar, notation card, editor panel | settings sidebar. Either sidebar collapses to a rail;
// below 1000 px both are rails that open over the notation. The header's switch shows the Metronome
// page between the sidebars instead, and swaps the top of the settings sidebar for its own settings.
// Below 640 px, the phone layout: a column of header, notation, transport bar and tab bar, with the
// editor sheet sliding up over the foot of it, and the sidebars sliding in over the whole screen.
// Turned sideways, the header and tab bar give way to a rail of icons down the left.

import type { ReactNode, RefObject } from 'react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { EDITOR_SHEET_HEIGHT, GridEditor } from '@/features/editor/GridEditor'
import { ExampleNotice } from '@/features/library/ExampleNotice'
import { LibrarySidebar } from '@/features/library/LibrarySidebar'
import { WelcomeCard } from '@/features/library/WelcomeCard'
import { MetronomePage } from '@/features/metronome/MetronomePage'
import { MetronomeScreen } from '@/features/metronome/MetronomeScreen'
import { ScreenTabs } from '@/features/metronome/ScreenTabs'
import { NotationView } from '@/features/notation/NotationView'
import { StaffPlayButton } from '@/features/playback/StaffPlayButton'
import { TransportBar } from '@/features/playback/TransportBar'
import type { TransportRoom } from '@/features/playback/TransportControls'
import { TransportControls } from '@/features/playback/TransportControls'
import { PhoneSettings } from '@/features/settings/SettingsSidebar'
import { SettingsSidebar } from '@/app/SettingsSidebar'
import { useAppStore } from '@/app/store'
import { useNarrowWindow, usePhoneOrientation, usePhoneWindow } from '@/app/useMediaQuery'
import { NameInput } from '@/components/NameInput'
import type { Side } from '@/components/Sidebar'
import { SidebarFullScreen, SidebarOverlay, SidebarRail } from '@/components/Sidebar'
import { Button } from '@/components/Button'
import { keepFocus } from '@/components/keepFocus'
import { useSlide } from '@/components/useSlide'
import { useSwipe } from '@/components/useSwipe'
import { MenuIcon, PencilIcon, SettingsIcon } from '@/components/icons'
import { isExample } from '@/core'

export function App() {
  const sidebars = useSidebars()
  const phone = usePhoneWindow()
  const [barRef, room] = useExerciseBarRoom()
  const onMetronome = useAppStore((s) => s.device.screen === 'metronome')
  if (phone) return <PhoneLayout sidebars={sidebars} />
  return (
    <div className="flex h-dvh flex-col">
      {/* The same header on both screens, the switch in its middle, so nothing in it moves when the screen does. */}
      <header className={`${headerClass} grid grid-cols-[1fr_auto_1fr]`}>
        <Wordmark />
        <ScreenTabs place="header" />
        <div className="flex items-center justify-end gap-3">
          <NotSaving />
          <SettingsToggle {...sidebars.settings} />
        </div>
      </header>

      {/* The sidebars stay put under it on both screens; an overlay opens over this, below the header. */}
      <div className="relative grid min-h-0 flex-1 grid-cols-[auto_1fr_auto] grid-rows-[minmax(0,1fr)]">
        <SidebarSlot name="Exercises" side="left" {...sidebars.library}>
          <LibrarySidebar onCollapse={sidebars.library.onCollapse} />
        </SidebarSlot>

        {onMetronome ? (
          <MetronomePage />
        ) : (
          <main className="flex min-h-0 min-w-0 flex-col">
            {/* The exercise's bar: its name, which takes the room the transport leaves and always shows about 12 letters. */}
            <div ref={barRef} className="flex items-center gap-3 border-b border-line px-4 py-2">
              <div className="flex min-w-[10ch] flex-1">
                <ExerciseName />
              </div>
              <TransportControls room={room} />
            </div>
            <ExampleNotice />
            {/* The music on a card, which takes the height the editor leaves, all of it when that's collapsed. */}
            <div className="flex min-h-0 flex-1 flex-col p-3">
              <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-card border-(length:--border-card) border-line bg-paper shadow-card">
                <NotationView corner={<StaffPlayButton />} />
                <WelcomeCard onBrowse={sidebarShower(sidebars.library)} />
              </div>
            </div>
            <GridEditor />
          </main>
        )}

        <SidebarSlot name="Settings" side="right" {...sidebars.settings}>
          <SettingsSidebar playbackGroup={room === 'compact'} onCollapse={sidebars.settings.onCollapse} />
        </SidebarSlot>
      </div>
    </div>
  )
}

/** The desktop header's look, on either screen; the look's ornament under it draws in the room its margin keeps. */
const headerClass = 'mb-(--header-ornament-height) items-center gap-3 border-b border-line bg-card px-4 py-2 shadow-(--header-ornament)'

/** The app's name, at the start of the desktop header. */
function Wordmark() {
  return (
    <h1 className="m-0 shrink-0 font-(family-name:--wordmark-font) text-base font-bold whitespace-nowrap text-(--wordmark-color) [font-style:var(--wordmark-style)] [text-shadow:var(--wordmark-shadow)] [text-transform:var(--wordmark-case)]">
      Syncopate<span className="text-(--wordmark-bang)">!</span>
    </h1>
  )
}

/**
 * The phone layout: a compact header (menu, the exercise name or the screen's, settings), the screen
 * chosen, and the tab bar at the foot that switches between Practice and the Metronome. Practice is
 * the notation filling the screen over the transport bar. Menu and settings open their sidebar over
 * the whole screen, sliding in; so does a swipe right and left on the screen, which pulls it in
 * under the finger, and a swipe back the other way closes it. Edit, in the transport bar, slides the
 * grid editor up as a sheet over the transport and tab bars, which its tick or a drag down closes;
 * while it's up, a play button floats over the notation above it. An example, which can't be
 * changed, has no read-only notice; Copy takes Edit's place instead, and opens an editable copy.
 *
 * Turned sideways, the screen is short, so the header and tab bar go: a rail down the left holds
 * the exercises button, the screen tabs and settings, the exercise's name sits over the notation,
 * and the transport bar is drawn slimmer. Turning the phone keeps the screen, the open sheet and the
 * cursor bar, since it is this same layout either way.
 */
function PhoneLayout({ sidebars }: { sidebars: Record<SidebarId, SidebarControl> }) {
  const { library, settings } = sidebars
  const example = useAppStore((s) => isExample(s.editor.exercise.id))
  const copyToLibrary = useAppStore((s) => s.duplicateOpenExercise)
  const onMetronome = useAppStore((s) => s.device.screen === 'metronome')
  const orientation = usePhoneOrientation()
  const landscape = orientation === 'landscape'
  const [editOpen, setEditOpen] = useState(false)
  // Opening an example closes the sheet, so it doesn't come back with the next exercise.
  useEffect(() => {
    if (example) setEditOpen(false)
  }, [example])
  const editing = editOpen && !example && !onMetronome
  const openEditor = useCallback(() => setEditOpen(true), [])
  const closeEditor = useCallback(() => setEditOpen(false), [])
  // A swipe up on the transport or tab bar pulls the sheet up, as Edit opens it.
  const footerSwipe = useSwipe({ up: example || onMetronome ? undefined : openEditor })
  const pull = Math.min(0, footerSwipe.offset.y)
  const sheet = useSlide(editing, pull !== 0)
  const [footer, footerHeight] = useHeight()
  const screenSwipe = useSwipe({ left: settings.onOpen, right: library.onOpen })
  // The sheet floats over the screen and moves nothing under it; the notation only gains room at its
  // end, so its last lines can still scroll up clear of the sheet.
  const underSheet = `max(0px, calc(${EDITOR_SHEET_HEIGHT[orientation]} - ${footerHeight}px))`
  return (
    <div className="relative flex h-dvh overflow-hidden">
      {landscape && (
        <nav aria-label="Screens" className="flex w-[calc(3rem+env(safe-area-inset-left))] shrink-0 flex-col items-center gap-1 border-r border-line bg-panel pt-1 pb-1.5 pl-[env(safe-area-inset-left)]">
          <PhoneHeaderButton label="Open exercises" expanded={library.state === 'overlay'} onClick={library.onOpen} rail>
            <MenuIcon />
          </PhoneHeaderButton>
          <span aria-hidden className="my-0.5 h-px w-6 bg-line" />
          <ScreenTabs place="rail" />
          <PhoneHeaderButton label="Open settings" expanded={settings.state === 'overlay'} onClick={settings.onOpen} rail className="mt-auto">
            <SettingsIcon />
          </PhoneHeaderButton>
        </nav>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        {!landscape && (
          <header className="mb-(--header-ornament-height) flex shrink-0 items-center gap-1 border-b border-line bg-card px-1 pt-[env(safe-area-inset-top)] shadow-(--header-ornament)">
            <PhoneHeaderButton label="Open exercises" expanded={library.state === 'overlay'} onClick={library.onOpen}>
              <MenuIcon />
            </PhoneHeaderButton>
            <div className="flex min-w-0 flex-1 justify-center text-base">
              {onMetronome ? (
                <h1 className="m-0 font-display text-lg font-semibold">Metronome</h1>
              ) : (
                <ExerciseName className="w-full text-center" />
              )}
            </div>
            <PhoneHeaderButton label="Open settings" expanded={settings.state === 'overlay'} onClick={settings.onOpen}>
              <SettingsIcon />
            </PhoneHeaderButton>
          </header>
        )}
        <NotSaving className="border-b border-line bg-card px-3 py-1 text-xs" />
        {/* Sideways there's no header: the name sits over the notation, and the rail's lit icon names the Metronome. */}
        {landscape && !onMetronome && (
          <div className="flex shrink-0 bg-paper pt-1.5 pr-[max(1rem,env(safe-area-inset-right))] pl-3 text-sm">
            <ExerciseName className="max-w-full" />
          </div>
        )}
        {/* A swipe left on the screen opens the settings, and right the exercises, as their buttons do. */}
        <div {...screenSwipe.props} className="relative flex min-h-0 flex-1 touch-pan-y flex-col">
          {onMetronome ? (
            <MetronomeScreen landscape={landscape} />
          ) : (
            <>
              <NotationView coveredBottom={editing ? underSheet : undefined} />
              <WelcomeCard onBrowse={sidebarShower(library)} />
            </>
          )}
        </div>
        {/* Under the sheet while it is up, so out of reach. */}
        <div ref={footer} {...footerSwipe.props} inert={editing} className="flex shrink-0 touch-pan-x flex-col">
          {!onMetronome && (
            <TransportBar slim={landscape} onEdit={example ? undefined : openEditor} onCopy={example ? copyToLibrary : undefined} />
          )}
          {!landscape && <ScreenTabs />}
        </div>
      </div>
      {sheet.present && <GridEditor orientation={orientation} open={sheet.atOpen} pull={pull} onDone={closeEditor} />}

      {/* A swipe on the screen pulls in the exercises from the left, or the settings from the right. */}
      <SidebarFullScreen side="left" open={library.state === 'overlay'} pull={Math.max(0, screenSwipe.offset.x)} onClose={library.onCollapse}>
        <LibrarySidebar fullScreen onCollapse={library.onCollapse} />
      </SidebarFullScreen>
      <SidebarFullScreen side="right" open={settings.state === 'overlay'} pull={Math.min(0, screenSwipe.offset.x)} onClose={settings.onCollapse}>
        <PhoneSettings onDone={settings.onCollapse} />
      </SidebarFullScreen>
    </div>
  )
}

/** A ref for an element, and its height in px, kept up to date as it changes. */
function useHeight(): [RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(() => setHeight(el.offsetHeight))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, height]
}

/** A header button on a phone, for the exercises or settings: its icon drawn larger, big enough for a finger. */
function PhoneHeaderButton({
  label,
  expanded,
  onClick,
  rail = false,
  className = '',
  children,
}: {
  label: string
  expanded: boolean
  onClick: () => void
  /** On the rail down the side of a phone turned sideways, where it's as small as the screen tabs beside it. */
  rail?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <Button
      variant="ghost"
      size="lg"
      icon
      aria-label={label}
      aria-expanded={expanded}
      onClick={onClick}
      className={`active:bg-hover ${rail ? 'size-10! text-mute' : ''} ${className}`}
    >
      <span aria-hidden className="flex [&>svg]:size-5">
        {children}
      </span>
    </Button>
  )
}

/** The header's button that shows the settings sidebar or hides it, on either screen, lit while it shows. */
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
 * The exercise bar's widths, in px, below which its controls don't all fit while leaving the
 * exercise name its 12 letters or so, measured in each look's fonts with the click off (Warm's need
 * the most): under `full` the Click and Count-in chips and the loop chip move to the settings sidebar.
 */
const EXERCISE_BAR_WIDTH = { full: 778 }

/**
 * A ref for the exercise's bar over the notation, and how much of the transport fits in it. That
 * depends on the bar's own width, which the window and the open sidebars both take from. While the
 * Metronome shows there's no bar, and the room stays as it was.
 */
function useExerciseBarRoom(): [(bar: HTMLElement | null) => void, TransportRoom] {
  const [bar, setBar] = useState<HTMLElement | null>(null)
  const [room, setRoom] = useState<TransportRoom>('compact')
  useLayoutEffect(() => {
    if (!bar) return
    // Kept as the step, not the width, so a resize re-renders only when the step changes.
    const observer = new ResizeObserver(() => {
      const width = bar.getBoundingClientRect().width
      setRoom(width >= EXERCISE_BAR_WIDTH.full ? 'full' : 'compact')
    })
    observer.observe(bar)
    return () => observer.disconnect()
  }, [bar])
  return [setBar, room]
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
      // A text field or a dialog in the sidebar, or an open menu anywhere, has its own Escape.
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

/** A handler that shows a sidebar, open or over the screen, leaving it be if it already shows (its open toggles an overlay). */
function sidebarShower({ state, onOpen }: SidebarControl): () => void {
  return () => {
    if (state === 'rail') onOpen()
  }
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
            className="absolute inset-y-0 right-8 left-8 z-20"
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

/** The open exercise's name and a pencil; click either to rename it in place. An example's name is fixed, with no pencil. */
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
      className={`group inline-flex min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded border border-transparent bg-transparent px-1 text-mute hover:border-edge hover:text-ink ${className}`}
    >
      <span className="truncate">{name}</span>
      <span className="flex shrink-0 group-hover:text-accent">
        <PencilIcon />
      </span>
    </button>
  )
}
