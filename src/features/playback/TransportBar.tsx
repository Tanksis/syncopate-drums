import { useEffect, useRef } from 'react'
import { useAppStore } from '@/app/store'
import { BpmInput } from './TransportControls'
import { togglePause } from './transport'
import { usePlaybackKeys } from './usePlaybackKeys'

/** How long a BPM button is held before it repeats, and how often it repeats then, in ms. */
const REPEAT_DELAY = 400
const REPEAT_EVERY = 70

/** A round button, big enough for a thumb, that a long press doesn't select or call out. */
const roundButtonClass =
  'flex shrink-0 cursor-pointer touch-manipulation select-none items-center justify-center rounded-full border font-semibold [-webkit-touch-callout:none]'

/**
 * The phone layout's transport, fixed at the bottom within reach of a thumb: play/pause, and the
 * tempo with − and + buttons that repeat while held.
 */
export function TransportBar() {
  usePlaybackKeys()
  const playing = useAppStore((s) => s.playing)
  return (
    <div
      aria-label="Transport"
      role="toolbar"
      className="flex shrink-0 items-center gap-3 border-t border-line bg-card px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
    >
      <button
        type="button"
        aria-label={playing ? 'Pause' : 'Play'}
        onClick={togglePause}
        className={`${roundButtonClass} size-12 border-accent bg-accent text-lg/none text-white active:opacity-80`}
      >
        <span aria-hidden>{playing ? '❚❚' : '▶'}</span>
      </button>
      <div className="flex items-center gap-2">
        <BpmStep step={-1} />
        <label className="flex flex-col items-center">
          {/* 16 px or more, so iOS doesn't zoom in when it's focused. */}
          <BpmInput className="w-16 [appearance:textfield] px-1 py-1 text-center text-base font-semibold [&::-webkit-inner-spin-button]:appearance-none" />
          <span className="text-[11px] text-mute">BPM</span>
        </label>
        <BpmStep step={1} />
      </div>
    </div>
  )
}

/** A button that changes the tempo by `step`, again and again while it's held, and saves once it's let go. */
function BpmStep({ step }: { step: 1 | -1 }) {
  const timer = useRef<number | undefined>(undefined)
  const held = useRef(false)

  const change = (dragging: boolean) => {
    const { editor, setBpm } = useAppStore.getState()
    setBpm(editor.exercise.practice.bpm + step, { dragging })
  }
  const release = () => {
    window.clearTimeout(timer.current)
    if (!held.current) return
    held.current = false
    const { editor, setBpm } = useAppStore.getState()
    setBpm(editor.exercise.practice.bpm)
  }
  useEffect(() => () => window.clearTimeout(timer.current), [])

  return (
    <button
      type="button"
      aria-label={step > 0 ? 'Faster' : 'Slower'}
      onPointerDown={(e) => {
        if (e.button !== 0) return
        held.current = true
        change(true)
        const repeat = () => {
          change(true)
          timer.current = window.setTimeout(repeat, REPEAT_EVERY)
        }
        timer.current = window.setTimeout(repeat, REPEAT_DELAY)
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={release}
      // A pointer changes the tempo as it goes down; the keyboard (detail 0) clicks.
      onClick={(e) => e.detail === 0 && change(false)}
      onContextMenu={(e) => e.preventDefault()}
      className={`${roundButtonClass} size-11 border-line bg-panel text-xl/none active:border-accent active:text-accent`}
    >
      <span aria-hidden>{step > 0 ? '+' : '−'}</span>
    </button>
  )
}
