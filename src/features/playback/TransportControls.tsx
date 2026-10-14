import { useState } from 'react'
import { useAppStore } from '@/app/store'
import { Slider } from '@/components/Slider'
import { Switch } from '@/components/Switch'
import { fieldClass } from '@/components/ValueField'
import { MAX_BPM, MIN_BPM } from '@/core'
import { LoopReadout } from './LoopReadout'
import { PlaybackPosition } from './PlaybackPosition'
import { usePlaybackKeys } from './usePlaybackKeys'

/**
 * How much of the transport the header has room for: all of it, all but the BPM slider, or only
 * the position and the BPM box, with the count-in and loop readout in the Settings sidebar.
 */
export type HeaderRoom = 'full' | 'withoutSlider' | 'compact'

/**
 * The header's playback position, tempo controls and loop range. Play is on the staff
 * (`StaffPlayButton`); Ctrl+Space and Space work from here.
 */
export function TransportControls({ room }: { room: HeaderRoom }) {
  usePlaybackKeys()
  return (
    <div className="flex shrink-0 items-center gap-2.5 whitespace-nowrap">
      <PlaybackPosition />
      <BpmControl slider={room === 'full'} />
      {room !== 'compact' && (
        <>
          <CountInToggle />
          <LoopReadout />
        </>
      )}
    </div>
  )
}

function BpmControl({ slider }: { slider: boolean }) {
  const bpm = useAppStore((s) => s.editor.exercise.practice.bpm)
  const setBpm = useAppStore((s) => s.setBpm)
  return (
    <label className="flex items-center gap-2">
      <BpmInput className="w-16 px-1.5 py-0.5 text-right" />
      <span className="text-mute">BPM</span>
      {slider && (
        <Slider label="BPM slider" min={MIN_BPM} max={MAX_BPM} value={bpm} onChange={(value, { dragging }) => setBpm(value, { dragging })} className="w-24" />
      )}
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
      className={`${fieldClass} ${className}`}
    />
  )
}

/** Whether playback starts with a bar of clicks; kept for this device, not the exercise. */
export function CountInToggle() {
  const countIn = useAppStore((s) => s.device.countIn)
  const setDeviceSettings = useAppStore((s) => s.setDeviceSettings)
  return (
    <Switch
      label="Count-in"
      title="Play a one-bar count-in before the exercise"
      checked={countIn}
      onChange={(on) => setDeviceSettings({ countIn: on })}
    />
  )
}
