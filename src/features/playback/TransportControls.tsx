import { useState } from 'react'
import { useAppStore } from '@/app/store'
import { Slider } from '@/components/Slider'
import { Switch } from '@/components/Switch'
import { MinusIcon, PlusIcon } from '@/components/icons'
import { MAX_BPM, MIN_BPM } from '@/core'
import { BpmStep } from './BpmStep'
import { LoopChip } from './LoopChip'
import { PlaybackPosition } from './PlaybackPosition'
import { usePlaybackKeys } from './usePlaybackKeys'

/**
 * How much of the transport the header has room for: all of it, all but the BPM slider, or only
 * the position and the tempo, with the count-in and loop chip in the Settings sidebar.
 */
export type HeaderRoom = 'full' | 'withoutSlider' | 'compact'

/**
 * The header's playback position, tempo, count-in and loop chip. Play is on the staff
 * (`StaffPlayButton`); Ctrl+Space and Space work from here.
 */
export function TransportControls({ room }: { room: HeaderRoom }) {
  usePlaybackKeys()
  return (
    <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
      <PlaybackPosition />
      <Tempo slider={room === 'full'} />
      {room !== 'compact' && (
        <>
          <span aria-hidden className="h-6 w-px bg-line" />
          <CountInToggle />
          <LoopChip />
        </>
      )}
    </div>
  )
}

/** The header's − and + around the BPM. */
const stepClass = 'size-8 rounded-md border-edge bg-card text-ink hover:border-accent hover:text-accent active:border-accent active:text-accent'

/** − [80 BPM] +, then a slider given room: − and + step the tempo and repeat while held. */
function Tempo({ slider }: { slider: boolean }) {
  const bpm = useAppStore((s) => s.editor.exercise.practice.bpm)
  const setBpm = useAppStore((s) => s.setBpm)
  return (
    <div className="flex items-center gap-1.5">
      <BpmStep step={-1} className={stepClass}>
        <MinusIcon />
      </BpmStep>
      {/* The BPM box: the number to type into and its unit, ringed as one field. */}
      <label className="flex h-8 cursor-text items-center gap-1 rounded-md border border-edge bg-bg px-2 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent">
        <BpmInput className="w-9 [appearance:textfield] border-0 bg-transparent p-0 text-right font-mono text-base font-semibold tabular-nums outline-none [&::-webkit-inner-spin-button]:appearance-none" />
        <span className="text-[11px] font-semibold tracking-wide text-mute">BPM</span>
      </label>
      <BpmStep step={1} className={stepClass}>
        <PlusIcon />
      </BpmStep>
      {slider && (
        <Slider label="BPM slider" min={MIN_BPM} max={MAX_BPM} value={bpm} onChange={setBpm} className="ml-1.5 w-28" />
      )}
    </div>
  )
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
