import { useState } from 'react'
import { useAppStore } from '@/app/store'
import { MAX_BPM, MIN_BPM } from '@/core'
import { togglePlayback } from './transport'
import { usePlaybackKeys } from './usePlaybackKeys'

/** The header's play/stop button and tempo controls. */
export function TransportControls() {
  usePlaybackKeys()
  const playing = useAppStore((s) => s.playing)
  return (
    <div className="flex items-center gap-3.5">
      <button
        type="button"
        title="Play / stop (Ctrl+Space)"
        // Keep focus off the button, so Space enters a rest rather than toggling playback.
        onMouseDown={(e) => e.preventDefault()}
        onClick={togglePlayback}
        className="w-20 cursor-pointer rounded-md border border-line bg-panel px-2.5 py-1 font-semibold hover:border-accent"
      >
        {playing ? '■ Stop' : '▶ Play'}
      </button>
      <BpmControl />
    </div>
  )
}

function BpmControl() {
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
    <label className="flex items-center gap-2">
      <input
        type="number"
        aria-label="BPM"
        min={MIN_BPM}
        max={MAX_BPM}
        value={draft ?? bpm}
        onChange={(e) => type(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className="w-16 rounded-md border border-line bg-card px-1.5 py-0.5 text-right tabular-nums"
      />
      <span className="text-mute">BPM</span>
      <input
        type="range"
        aria-label="BPM slider"
        min={MIN_BPM}
        max={MAX_BPM}
        value={bpm}
        onChange={(e) => setBpm(Number(e.target.value), { dragging: true })}
        // Once a drag ends, save the tempo it settled on and hand the keyboard back to the editor.
        onPointerUp={(e) => {
          setBpm(Number(e.currentTarget.value))
          e.currentTarget.blur()
        }}
        className="w-36 accent-accent"
      />
    </label>
  )
}
