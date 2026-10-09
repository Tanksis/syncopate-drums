import { useRef, useState } from 'react'
import { useAppStore } from '@/app/store'
import { keepFocus } from '@/components/keepFocus'
import { MAX_BPM, MIN_BPM } from '@/core'
import { LoopReadout } from './LoopReadout'
import { PlaybackPosition } from './PlaybackPosition'
import { togglePlayback } from './transport'
import { usePlaybackKeys } from './usePlaybackKeys'

/** The header's play/stop button, tempo controls and loop range. */
export function TransportControls() {
  usePlaybackKeys()
  const playing = useAppStore((s) => s.playing)
  return (
    <div className="flex items-center gap-3.5">
      <button
        type="button"
        title="Play from the count-in / stop (Ctrl+Space). Space pauses and resumes."
        // Keep focus off the button, so Space pauses rather than clicking it.
        onMouseDown={keepFocus}
        onClick={togglePlayback}
        className="w-20 cursor-pointer rounded-md border border-line bg-panel px-2.5 py-1 font-semibold hover:border-accent"
      >
        {playing ? '■ Stop' : '▶ Play'}
      </button>
      <PlaybackPosition />
      <BpmControl />
      <CountInToggle />
      <LoopReadout />
    </div>
  )
}

function BpmControl() {
  const bpm = useAppStore((s) => s.editor.exercise.practice.bpm)
  const setBpm = useAppStore((s) => s.setBpm)
  // A pointer drag on the slider saves once it ends; arrow keys on it save at once.
  const dragging = useRef(false)

  return (
    <label className="flex items-center gap-2">
      <BpmInput className="w-16 px-1.5 py-0.5 text-right" />
      <span className="text-mute">BPM</span>
      <input
        type="range"
        aria-label="BPM slider"
        min={MIN_BPM}
        max={MAX_BPM}
        value={bpm}
        onChange={(e) => setBpm(Number(e.target.value), { dragging: dragging.current })}
        onPointerDown={() => (dragging.current = true)}
        // Once a drag ends, save the tempo it settled on and hand the keyboard back to the editor.
        onPointerUp={(e) => {
          dragging.current = false
          setBpm(Number(e.currentTarget.value))
          e.currentTarget.blur()
        }}
        className="w-36 accent-accent"
      />
    </label>
  )
}

/** The tempo as a number box to type into. */
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
      className={`rounded-md border border-line bg-card tabular-nums ${className}`}
    />
  )
}

/** Whether playback starts with a bar of clicks; kept for this device, not the exercise. */
export function CountInToggle() {
  const countIn = useAppStore((s) => s.device.countIn)
  const setDeviceSettings = useAppStore((s) => s.setDeviceSettings)
  return (
    <button
      type="button"
      aria-pressed={countIn}
      title="Play a one-bar count-in before the exercise"
      // Keep focus off the button, so the editor's keys still work after a click.
      onMouseDown={keepFocus}
      onClick={() => setDeviceSettings({ countIn: !countIn })}
      className="cursor-pointer rounded-md border border-line bg-panel px-2 py-0.5 hover:border-accent aria-pressed:bg-accent aria-pressed:text-white"
    >
      count-in
    </button>
  )
}
