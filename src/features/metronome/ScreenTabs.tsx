import type { KeyboardEvent, ReactNode } from 'react'
import { useRef } from 'react'
import { useAppStore } from '@/app/store'
import { MetronomeIcon, PracticeIcon } from '@/components/icons'
import { keepFocus } from '@/components/keepFocus'
import type { Screen } from '@/core'
import { SCREENS } from '@/core'
import { stopExercise } from '@/features/playback/transport'

/** Each screen's tab: its name and icon. */
const SCREEN_TABS: Record<Screen, { name: string; icon: ReactNode }> = {
  practice: { name: 'Practice', icon: <PracticeIcon /> },
  metronome: { name: 'Metronome', icon: <MetronomeIcon /> },
}

/**
 * Where the tabs sit: the phone's tab bar at the foot of the screen, the rail down its side when
 * it's turned sideways, or the desktop header.
 */
type ScreenTabsPlace = 'foot' | 'rail' | 'header'

/**
 * The tabs switching between Practice and the Metronome, remembered on this device. Leaving
 * Practice stops the exercise. The arrow keys, Home and End move between them, as in any tab list.
 * At the phone's foot they're a bar of icons over names. On the `rail`, with the phone turned
 * sideways, they're icons only, one over the other; the current one is lit in the accent on a
 * tinted square. In the desktop `header` they're a switch of two names, the current one filled.
 */
export function ScreenTabs({ place = 'foot' }: { place?: ScreenTabsPlace }) {
  const rail = place === 'rail'
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
    const back = (i - 1 + n) % n
    const on = (i + 1) % n
    const keys: Record<string, number> = rail
      ? { ArrowUp: back, ArrowDown: on, Home: 0, End: n - 1 }
      : { ArrowLeft: back, ArrowRight: on, Home: 0, End: n - 1 }
    const next = keys[e.key]
    if (next === undefined) return
    e.preventDefault()
    choose(SCREENS[next])
    list.current?.querySelectorAll<HTMLElement>('[role=tab]')[next]?.focus()
  }
  if (place === 'header')
    return (
      <div
        ref={list}
        role="tablist"
        aria-label="Screen"
        onKeyDown={onKeyDown}
        className="grid shrink-0 grid-cols-2 rounded-chip border border-edge bg-bg p-0.5"
      >
        {SCREENS.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={s === screen}
            tabIndex={s === screen ? 0 : -1}
            onMouseDown={keepFocus}
            onClick={() => choose(s)}
            className="flex h-7 cursor-pointer items-center justify-center rounded-[calc(var(--radius-chip)-2px)] border-0 bg-transparent text-sm whitespace-nowrap text-mute not-aria-selected:hover:bg-card not-aria-selected:hover:text-ink aria-selected:bg-accent aria-selected:font-semibold aria-selected:text-on-accent px-3.5"
          >
            {/* Each as wide as its name in bold, so the switch keeps its size and place whichever is chosen. */}
            <span className="grid">
              <span aria-hidden className="invisible col-start-1 row-start-1 font-semibold">
                {SCREEN_TABS[s].name}
              </span>
              <span className="col-start-1 row-start-1">{SCREEN_TABS[s].name}</span>
            </span>
          </button>
        ))}
      </div>
    )
  if (rail)
    return (
      <div ref={list} role="tablist" aria-label="Screen" aria-orientation="vertical" onKeyDown={onKeyDown} className="flex flex-col gap-1">
        {SCREENS.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-label={SCREEN_TABS[s].name}
            title={SCREEN_TABS[s].name}
            aria-selected={s === screen}
            tabIndex={s === screen ? 0 : -1}
            onClick={() => choose(s)}
            className="flex size-10 cursor-pointer touch-manipulation items-center justify-center rounded-[10px] border-0 bg-transparent text-mute active:bg-hover aria-selected:bg-accent-tint aria-selected:text-accent"
          >
            <span aria-hidden className="flex [&>svg]:size-5">
              {SCREEN_TABS[s].icon}
            </span>
          </button>
        ))}
      </div>
    )
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
