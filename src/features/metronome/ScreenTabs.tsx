import type { KeyboardEvent, ReactNode } from 'react'
import { useRef } from 'react'
import { useAppStore } from '@/app/store'
import { MetronomeIcon, PracticeIcon } from '@/components/icons'
import type { Screen } from '@/core'
import { SCREENS } from '@/core'
import { stopExercise } from '@/features/playback/transport'

/** Each screen's tab: its name and icon. */
const SCREEN_TABS: Record<Screen, { name: string; icon: ReactNode }> = {
  practice: { name: 'Practice', icon: <PracticeIcon /> },
  metronome: { name: 'Metronome', icon: <MetronomeIcon /> },
}

/**
 * The phone's tab bar at the foot of the screen, switching between Practice and the Metronome,
 * remembered on this device. Leaving Practice stops the exercise. The arrow keys, Home and End move between them, as in any tab list.
 */
export function ScreenTabs() {
  const screen = useAppStore((s) => s.device.screen)
  const setDeviceSettings = useAppStore((s) => s.setDeviceSettings)
  const list = useRef<HTMLDivElement>(null)
  const choose = (next: Screen) => {
    if (next === screen) return
    if (screen === 'practice') stopExercise()
    setDeviceSettings({ screen: next })
  }
  const onKeyDown = (e: KeyboardEvent) => {
    const i = SCREENS.indexOf(screen)
    const n = SCREENS.length
    const keys: Record<string, number> = { ArrowLeft: (i - 1 + n) % n, ArrowRight: (i + 1) % n, Home: 0, End: n - 1 }
    const next = keys[e.key]
    if (next === undefined) return
    e.preventDefault()
    choose(SCREENS[next])
    list.current?.querySelectorAll<HTMLElement>('[role=tab]')[next]?.focus()
  }
  return (
    <div
      ref={list}
      role="tablist"
      aria-label="Screen"
      onKeyDown={onKeyDown}
      className="grid shrink-0 grid-cols-2 border-t border-line bg-panel pb-[env(safe-area-inset-bottom)]"
    >
      {SCREENS.map((s) => (
        <button
          key={s}
          type="button"
          role="tab"
          aria-selected={s === screen}
          tabIndex={s === screen ? 0 : -1}
          onClick={() => choose(s)}
          className="flex h-15 cursor-pointer touch-manipulation flex-col items-center justify-center gap-0.5 border-0 bg-transparent text-xs text-mute aria-selected:font-bold aria-selected:text-accent"
        >
          <span aria-hidden className="flex [&>svg]:size-5.5">
            {SCREEN_TABS[s].icon}
          </span>
          {SCREEN_TABS[s].name}
        </button>
      ))}
    </div>
  )
}
