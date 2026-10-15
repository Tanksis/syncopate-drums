import type { ReactNode } from 'react'
import { useRef, useState } from 'react'
import { useAppStore } from '@/app/store'
import { Button } from '@/components/Button'
import { keepFocus } from '@/components/keepFocus'
import { SUBDIVISIONS, tapTempo } from '@/core'
import { BpmStep } from '@/features/playback/BpmStep'
import { toggleMetronome } from '@/features/playback/transport'
import { BeatBlocks } from './BeatBlocks'
import { Dial } from './Dial'
import { SoundSheet } from './SoundSheet'
import { useMetronomeBeat } from './useMetronomeBeat'

/** The − and + beside Play. */
const stepClass = 'size-13 rounded-full border-edge bg-card text-2xl/none active:border-accent active:text-accent'

/** Tap tempo and Sound: round, finger-sized buttons. */
const pillClass = 'rounded-full! px-5.5!'

/**
 * The phone's Metronome screen: the time signature and subdivision at the top, a block per beat,
 * the dial, − Play +, then Tap tempo and the Sound sheet.
 */
export function MetronomeScreen() {
  const beat = useMetronomeBeat()
  const [soundOpen, setSoundOpen] = useState(false)
  return (
    <main aria-label="Metronome" className="flex min-h-0 flex-1 flex-col overflow-auto bg-bg">
      <RhythmButtons />
      <div className="px-4 pt-3">
        <BeatBlocks beat={beat} />
      </div>
      <div className="flex flex-1 items-center justify-center py-3">
        <Dial beat={beat} />
      </div>
      <div className="flex items-center justify-center gap-5.5 px-4 pb-3.5">
        <BpmStep step={-1} tempo="metronome" className={stepClass}>
          <span aria-hidden>−</span>
        </BpmStep>
        <PlayButton />
        <BpmStep step={1} tempo="metronome" className={stepClass}>
          <span aria-hidden>+</span>
        </BpmStep>
      </div>
      <div className="flex justify-center gap-3 px-4 pb-5">
        <TapTempo />
        <Button size="lg" onClick={() => setSoundOpen(true)} aria-haspopup="dialog" className={pillClass}>
          Sound
        </Button>
      </div>
      {soundOpen && <SoundSheet onDone={() => setSoundOpen(false)} />}
    </main>
  )
}

/** The time signature and subdivision, each a small labelled button showing its value. */
function RhythmButtons() {
  const { beats, noteValue, subdivision } = useAppStore((s) => s.device.metronome)
  const name = SUBDIVISIONS.find((s) => s.id === subdivision)?.name
  return (
    <div className="grid grid-cols-2 gap-2 px-4 pt-2.5">
      <RhythmButton label="Time signature">
        <b className="font-sans text-[22px]/[30px] tabular-nums">
          {beats}/{noteValue}
        </b>
      </RhythmButton>
      <RhythmButton label="Subdivision">
        <span className="truncate text-sm/[30px] font-semibold">{name}</span>
      </RhythmButton>
    </div>
  )
}

/** A small button with its setting's name over its value. The Rhythm sheet it opens comes with metronome ticket 04. */
function RhythmButton({ label, children }: { label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onMouseDown={keepFocus}
      className="flex min-w-0 cursor-pointer touch-manipulation flex-col items-center gap-0.5 rounded-xl border-0 bg-transparent py-1.5 text-ink active:bg-hover"
    >
      <span className="text-xs text-mute">{label}</span>
      {children}
    </button>
  )
}

/** Plays the metronome from beat 1, stopping an exercise that's playing, or stops it. */
function PlayButton() {
  const playing = useAppStore((s) => s.metronomePlaying)
  return (
    <button
      type="button"
      aria-label={playing ? 'Stop' : 'Play'}
      onMouseDown={keepFocus}
      onClick={toggleMetronome}
      className="flex size-19 shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-full border border-play-button-edge bg-play-button text-2xl/none text-on-play-button shadow-card select-none active:opacity-80"
    >
      <span aria-hidden>{playing ? '■' : '▶'}</span>
    </button>
  )
}

/** How many taps are kept: tapTempo reads the gaps between the last few. */
const TAPS_KEPT = 5

/** Sets the tempo from the drummer's taps, from the second tap on. */
function TapTempo() {
  const taps = useRef<number[]>([])
  const setMetronome = useAppStore((s) => s.setMetronome)
  const tap = () => {
    taps.current = [...taps.current, performance.now()].slice(-TAPS_KEPT)
    const bpm = tapTempo(taps.current)
    if (bpm !== undefined) setMetronome({ bpm })
  }
  return (
    <Button
      size="lg"
      // A tap counts as the finger lands, not as it lifts; the keyboard (detail 0) clicks.
      onPointerDown={(e) => e.button === 0 && tap()}
      onClick={(e) => e.detail === 0 && tap()}
      className={pillClass}
    >
      Tap tempo
    </Button>
  )
}
