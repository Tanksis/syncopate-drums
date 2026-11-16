import { useEffect } from 'react'
import { useAppStore } from '@/app/store'
import { Button } from '@/components/Button'
import { onControl } from '@/components/focus'
import { PracticeViewIcon } from '@/components/icons'

/** Turns the practice view on or off, the device setting. */
export function togglePracticeView() {
  const { device, setDeviceSettings } = useAppStore.getState()
  setDeviceSettings({ practiceView: !device.practiceView })
}

/**
 * The desktop's Practice view toggle, at the end of the exercise's bar: lit while the view is on. The
 * view folds the sidebars to rails and the editor to its bar tabs, and grows the notation into the
 * room (`workstationLayout`). Only this, and P, switch it: Play never changes the layout.
 */
export function PracticeViewToggle() {
  const on = useAppStore((s) => s.device.practiceView)
  return (
    <Button
      size="md"
      aria-pressed={on}
      title={on ? 'Leave the practice view: show the editor and sidebars again (P)' : 'Practice view: fold the editor and sidebars, and let the notation fill the screen (P)'}
      onClick={togglePracticeView}
      className="h-8 aria-pressed:border-accent aria-pressed:bg-accent-tint aria-pressed:text-accent"
    >
      <PracticeViewIcon />
      <span>Practice view</span>
    </Button>
  )
}

/**
 * P switches the practice view while the focus is on the page, not a control, and no dialog is open,
 * as the editor's keys are; only while `enabled`, on the desktop's Practice screen.
 */
export function usePracticeViewKey(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key !== 'p' && e.key !== 'P') || e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return
      if (onControl(e.target) || document.querySelector('dialog[open], [role=menu]')) return
      e.preventDefault()
      if (!e.repeat) togglePracticeView()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled])
}
