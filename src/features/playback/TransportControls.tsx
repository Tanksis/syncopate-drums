import type { PointerEvent, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/app/store'
import { keepFocus } from '@/components/keepFocus'
import { CheckIcon, MetronomeIcon, MetronomeOffIcon, MinusIcon, PlusIcon } from '@/components/icons'
import { MAX_BPM, MIN_BPM, wheelSteps } from '@/core'
import { BpmStep } from './BpmStep'
import { LoopChip } from './LoopChip'
import { PlaybackPosition } from './PlaybackPosition'
import { usePlaybackKeys } from './usePlaybackKeys'

/**
 * How much of the transport the exercise's bar, over the notation, has room for beside the name: all
 * of it, or only the position and the tempo, with the Click and Count-in chips and the loop chip on a
 * row of their own under it (`PlaybackChips`).
 */
export type TransportRoom = 'full' | 'compact'

/**
 * The exercise bar's playback position, tempo, Click and Count-in chips and loop chip. Play is on the
 * staff (`StaffPlayButton`); Ctrl+Space and Space work from here.
 */
export function TransportControls({ room }: { room: TransportRoom }) {
  usePlaybackKeys()
  return (
    <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
      <PlaybackPosition />
      <Tempo />
      {room === 'full' && (
        <>
          <span aria-hidden className="h-6 w-px bg-line" />
          <PlaybackChips />
        </>
      )}
    </div>
  )
}

/** The Click and Count-in chips and the loop chip: in the transport, or on a row of their own under it. */
export function PlaybackChips({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 whitespace-nowrap ${className}`}>
      <ClickToggle />
      <CountInToggle />
      <span aria-hidden className="h-6 w-px bg-line" />
      <LoopChip />
    </div>
  )
}

/** The exercise bar's − and + around the BPM. */
const stepClass = 'size-8 rounded-md border-edge bg-card text-ink hover:border-accent hover:text-accent active:border-accent active:text-accent'

/** How far, in px, the pointer moves up or down the BPM box for a BPM, and before it counts as a drag. */
const DRAG_PX_PER_BPM = 4
const DRAG_START_PX = 4

/** How many px a line of a wheel scrolled in lines counts as. */
const WHEEL_LINE_PX = 40

/** − [80 BPM] +: − and + step the tempo and repeat while held. */
function Tempo() {
  const drag = useBpmDrag()
  return (
    <div className="flex items-center gap-1.5">
      <BpmStep step={-1} className={stepClass}>
        <MinusIcon />
      </BpmStep>
      {/* The BPM box: the number to type into and its unit, ringed as one field, and dragged up or down or scrolled to change it. */}
      <label
        title="Type a tempo, or drag up or down, or scroll"
        {...drag}
        className="flex h-8 cursor-ns-resize touch-none items-center gap-1 rounded-md border border-edge bg-bg px-2 select-none focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent"
      >
        <BpmInput className="w-9 cursor-ns-resize select-text [appearance:textfield] border-0 bg-transparent p-0 text-right font-mono text-base font-semibold tabular-nums outline-none focus:cursor-text [&::-webkit-inner-spin-button]:appearance-none" />
        <span className="text-[11px] font-semibold tracking-wide text-mute">BPM</span>
      </label>
      <BpmStep step={1} className={stepClass}>
        <PlusIcon />
      </BpmStep>
    </div>
  )
}

/**
 * The BPM box's drag and wheel, as props for it and a ref: dragging up makes it faster, a BPM per few px, and the
 * wheel moves it a BPM a notch, as the Metronome's dial does. Both are saved once they stop. A press that doesn't
 * move clicks through to the number, to type into.
 */
function useBpmDrag() {
  const drag = useRef<{ startY: number; startBpm: number; moved: boolean } | undefined>(undefined)
  // Set by a drag, so the click it ends with doesn't put the caret in the number.
  const dragged = useRef(false)
  const box = useRef<HTMLLabelElement>(null)

  const onPointerDown = (e: PointerEvent<HTMLLabelElement>) => {
    if (e.button !== 0) return
    dragged.current = false
    drag.current = { startY: e.clientY, startBpm: useAppStore.getState().editor.exercise.practice.bpm, moved: false }
  }
  const onPointerMove = (e: PointerEvent<HTMLLabelElement>) => {
    const current = drag.current
    if (!current) return
    const dy = current.startY - e.clientY
    if (!current.moved) {
      if (Math.abs(dy) < DRAG_START_PX) return
      current.moved = true
      e.currentTarget.setPointerCapture(e.pointerId)
      // A drag isn't typing: the number gives up the caret.
      if (document.activeElement instanceof HTMLElement && e.currentTarget.contains(document.activeElement)) document.activeElement.blur()
    }
    const { editor, setBpm } = useAppStore.getState()
    const next = current.startBpm + Math.trunc(dy / DRAG_PX_PER_BPM)
    if (next !== editor.exercise.practice.bpm) setBpm(next, { dragging: true })
  }
  const onPointerEnd = () => {
    const moved = drag.current?.moved
    drag.current = undefined
    if (!moved) return
    dragged.current = true
    // Saves the tempo the drag left, now.
    const { editor, setBpm } = useAppStore.getState()
    setBpm(editor.exercise.practice.bpm)
  }
  const onClick = (e: { preventDefault: () => void }) => {
    if (dragged.current) e.preventDefault()
    dragged.current = false
  }

  // React's wheel listener is passive, and this one has to keep the page from scrolling.
  useEffect(() => {
    const el = box.current!
    let pending = 0
    const onWheel = (e: WheelEvent) => {
      // Ctrl and the wheel, or a pinch, zooms the page; a sideways scroll scrolls it.
      if (e.ctrlKey || e.deltaY === 0) return
      e.preventDefault()
      const step = wheelSteps(pending, e.deltaMode === WheelEvent.DOM_DELTA_PIXEL ? e.deltaY : e.deltaY * WHEEL_LINE_PX)
      pending = step.pending
      if (step.steps === 0) return
      const { editor, setBpm } = useAppStore.getState()
      // Saved once the wheel stops, as a drag is.
      setBpm(editor.exercise.practice.bpm + step.steps, { dragging: true })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  return { ref: box, onPointerDown, onPointerMove, onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd, onClickCapture: onClick }
}

/** The tempo as a number box to type into; `className` gives it its look. */
export function BpmInput({ className }: { className: string }) {
  const bpm = useAppStore((s) => s.editor.exercise.practice.bpm)
  const setBpm = useAppStore((s) => s.setBpm)
  // While typing, the box holds the text as typed. A value in range applies at once, unless
  // more digits could still follow (typing 300 shouldn't play at 30 on the way); Enter or
  // leaving the box applies whatever is there.
  const [draft, setDraft] = useState<string | null>(null)

  const type = (text: string) => {
    setDraft(text)
    const value = Number(text)
    if (text !== '' && value >= MIN_BPM && value <= MAX_BPM && value * 10 > MAX_BPM) setBpm(value)
  }
  const commit = () => {
    if (draft !== null && draft !== '') setBpm(Number(draft))
    setDraft(null)
  }

  return (
    <input
      type="number"
      inputMode="numeric"
      aria-label="BPM"
      min={MIN_BPM}
      max={MAX_BPM}
      value={draft ?? bpm}
      onChange={(e) => type(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      className={className}
    />
  )
}

/** Lit when on (an accent tint, border and text) and dashed in grey when off: the Click and Count-in toggles. */
const toggleOn = 'border-solid border-accent bg-accent-tint font-semibold text-accent'
const toggleOff = 'border-dashed border-edge bg-card text-mute hover:text-ink'

/** A pill-shaped toggle, as tall as the loop chip, with an icon and a word on it. */
function ToggleChip({ on, label, title, onToggle, children }: { on: boolean; label: string; title: string; onToggle: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={on}
      title={title}
      onMouseDown={keepFocus}
      onClick={onToggle}
      className={`inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 whitespace-nowrap ${on ? toggleOn : toggleOff}`}
    >
      {children}
    </button>
  )
}

/** Whether playback starts with a bar of clicks; kept for this device, not the exercise. */
export function CountInToggle() {
  const countIn = useAppStore((s) => s.device.countIn)
  const setDeviceSettings = useAppStore((s) => s.setDeviceSettings)
  return (
    <ToggleChip
      on={countIn}
      label="Count-in"
      title={countIn ? 'Start without a count-in' : 'Play a one-bar count-in before the exercise'}
      onToggle={() => setDeviceSettings({ countIn: !countIn })}
    >
      {countIn && <CheckIcon />}
      <span>Count-in</span>
    </ToggleChip>
  )
}

/** Whether the click plays, and how to flip it: the same setting as Mix's Click mute, kept for this device. */
function useClick() {
  const muted = useAppStore((s) => s.device.clickMuted)
  const setDeviceSettings = useAppStore((s) => s.setDeviceSettings)
  return {
    on: !muted,
    title: muted ? 'Turn the click on' : 'Turn the click off (the count-in still plays)',
    toggle: () => setDeviceSettings({ clickMuted: !muted }),
  }
}

/** The metronome's click while the exercise plays, as a chip: off, the count-in still clicks. */
export function ClickToggle() {
  const click = useClick()
  return (
    <ToggleChip on={click.on} label="Click" title={click.title} onToggle={click.toggle}>
      {click.on ? <MetronomeIcon /> : <MetronomeOffIcon />}
      <span>{click.on ? 'Click' : 'Click off'}</span>
    </ToggleChip>
  )
}

/** The phone's Click toggle: a tile with the metronome over "Click", or crossed out over "Off". `slim` is a little lower. */
export function ClickTile({ slim = false }: { slim?: boolean }) {
  const click = useClick()
  return (
    <button
      type="button"
      aria-label="Click"
      aria-pressed={click.on}
      title={click.title}
      onMouseDown={keepFocus}
      onClick={click.toggle}
      className={`flex w-13 shrink-0 cursor-pointer touch-manipulation flex-col items-center justify-center gap-px rounded-xl border text-[11px] font-semibold select-none ${
        slim ? 'h-11' : 'h-12'
      } ${click.on ? toggleOn : toggleOff}`}
    >
      {click.on ? <MetronomeIcon /> : <MetronomeOffIcon />}
      <span>{click.on ? 'Click' : 'Off'}</span>
    </button>
  )
}
