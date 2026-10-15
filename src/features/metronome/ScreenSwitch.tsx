import type { KeyboardEvent } from 'react'
import { useRef } from 'react'
import { useAppStore } from '@/app/store'
import type { Screen } from '@/core'
import { SCREENS } from '@/core'

const SCREEN_NAMES: Record<Screen, string> = { practice: 'Practice', metronome: 'Metronome' }

/**
 * The header's switch between the Practice and Metronome screens, remembered on this device. The
 * arrow keys, Home and End move between them, as in any tab list.
 */
export function ScreenSwitch({ className = '' }: { className?: string }) {
  const screen = useAppStore((s) => s.device.screen)
  const setDeviceSettings = useAppStore((s) => s.setDeviceSettings)
  const list = useRef<HTMLDivElement>(null)
  const choose = (next: Screen) => {
    if (next !== screen) setDeviceSettings({ screen: next })
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
      className={`grid shrink-0 grid-cols-2 rounded-full border border-edge p-0.5 ${className}`}
    >
      {SCREENS.map((s) => (
        <button
          key={s}
          type="button"
          role="tab"
          aria-selected={s === screen}
          tabIndex={s === screen ? 0 : -1}
          onClick={() => choose(s)}
          className="h-9 cursor-pointer touch-manipulation rounded-full border-0 bg-transparent px-2 text-[13px] text-mute aria-selected:bg-accent aria-selected:font-semibold aria-selected:text-on-accent"
        >
          {SCREEN_NAMES[s]}
        </button>
      ))}
    </div>
  )
}
