import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { useAppStore } from '@/app/store'
import { keepFocus } from '@/components/keepFocus'
import { clampMetronomeBpm } from '@/core'

/** How long a BPM button is held before it repeats, and how often it repeats then, in ms. */
const REPEAT_DELAY = 400
const REPEAT_EVERY = 70

/**
 * A button that changes the tempo by `step`, again and again while it's held, and saves once it's
 * let go: the phone's transport bar and the desktop header each give it their own look. It moves
 * the open exercise's tempo, or the metronome's own.
 */
export function BpmStep({
  step,
  tempo = 'exercise',
  className,
  children,
}: {
  step: 1 | -1
  tempo?: 'exercise' | 'metronome'
  className: string
  children: ReactNode
}) {
  const timer = useRef<number | undefined>(undefined)
  const held = useRef(false)

  /** Moves the tempo by `by`; while `dragging`, it isn't saved yet. */
  const change = (by: number, dragging: boolean) => {
    const { editor, device, setBpm, setMetronome } = useAppStore.getState()
    if (tempo === 'metronome') setMetronome({ bpm: clampMetronomeBpm(device.metronome.bpm + by) }, { dragging })
    else setBpm(editor.exercise.practice.bpm + by, { dragging })
  }
  const release = () => {
    window.clearTimeout(timer.current)
    if (!held.current) return
    held.current = false
    change(0, false)
  }
  useEffect(() => () => window.clearTimeout(timer.current), [])

  return (
    <button
      type="button"
      aria-label={step > 0 ? 'Faster' : 'Slower'}
      onPointerDown={(e) => {
        if (e.button !== 0) return
        held.current = true
        change(step, true)
        const repeat = () => {
          change(step, true)
          timer.current = window.setTimeout(repeat, REPEAT_EVERY)
        }
        timer.current = window.setTimeout(repeat, REPEAT_DELAY)
      }}
      onMouseDown={keepFocus}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={release}
      // A pointer changes the tempo as it goes down; the keyboard (detail 0) clicks.
      onClick={(e) => e.detail === 0 && change(step, false)}
      onContextMenu={(e) => e.preventDefault()}
      // A long press doesn't select or call out.
      className={`flex shrink-0 cursor-pointer touch-manipulation select-none items-center justify-center border [-webkit-touch-callout:none] ${className}`}
    >
      {children}
    </button>
  )
}
