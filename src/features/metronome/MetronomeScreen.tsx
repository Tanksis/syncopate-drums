import type { ReactNode } from 'react'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { useAppStore } from '@/app/store'
import { Button } from '@/components/Button'
import { keepFocus } from '@/components/keepFocus'
import { tapTempo } from '@/core'
import { BpmStep } from '@/features/playback/BpmStep'
import { toggleMetronome } from '@/features/playback/transport'
import { BeatBlocks } from './BeatBlocks'
import { DIAL_SIZE, Dial } from './Dial'
import { RhythmSheet } from './RhythmSheet'
import { SoundSheet } from './SoundSheet'
import { SubdivisionPicture } from './SubdivisionPicture'
import { useMetronomeBeat } from './useMetronomeBeat'

/** The − and + beside Play. */
const stepClass = 'size-13 short:size-11 rounded-full border-edge bg-card text-2xl/none active:border-accent active:text-accent'

/** Tap tempo and Sound: round, finger-sized buttons. */
const pillClass = 'rounded-full! px-5.5!'

/**
 * The phone's Metronome screen: the time signature and subdivision at the top, a block per beat,
 * the dial, − Play +, then Tap tempo and the Sound sheet. It fits the screen without scrolling: the
 * dial takes the room the rest leaves, and on a short screen the rest is drawn smaller. Turned
 * sideways (`landscape`), the dial is on the left, as tall as the screen allows, and the rest is
 * stacked beside it, the beat blocks kept full height, since they're watched while it plays.
 */
export function MetronomeScreen({ landscape = false }: { landscape?: boolean }) {
  const beat = useMetronomeBeat()
  const tap = useTapTempo()
  const [soundOpen, setSoundOpen] = useState(false)
  const [rhythmOpen, setRhythmOpen] = useState(false)
  const rhythm = <RhythmButtons landscape={landscape} onOpen={() => setRhythmOpen(true)} />
  const blocks = <BeatBlocks beat={beat} tall={landscape} />
  const play = (
    <div className={`flex items-center justify-center gap-5.5 ${landscape ? '' : 'px-4 pb-3.5 short:pb-2.5'}`}>
      <BpmStep step={-1} tempo="metronome" className={stepClass}>
        <span aria-hidden>−</span>
      </BpmStep>
      <PlayButton />
      <BpmStep step={1} tempo="metronome" className={stepClass}>
        <span aria-hidden>+</span>
      </BpmStep>
    </div>
  )
  const more = (
    <div className={`flex justify-center gap-3 ${landscape ? '' : 'px-4 pb-5 short:pb-3'}`}>
      <TapTempo tap={tap} className={pillClass}>
        Tap tempo
      </TapTempo>
      <Button size="lg" onClick={() => setSoundOpen(true)} aria-haspopup="dialog" className={pillClass}>
        Sound
      </Button>
    </div>
  )
  const sheets = (
    <>
      {soundOpen && <SoundSheet onDone={() => setSoundOpen(false)} />}
      {rhythmOpen && <RhythmSheet onDone={() => setRhythmOpen(false)} />}
    </>
  )
  if (landscape)
    return (
      <main aria-label="Metronome" className="flex min-h-0 flex-1 items-center gap-6 overflow-auto bg-bg pr-[max(1.5rem,env(safe-area-inset-right))] pl-6">
        <FitDial beat={beat} className="h-full w-[42%] max-w-80 shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col gap-2.5 py-2">
          {rhythm}
          {blocks}
          {play}
          {more}
        </div>
        {sheets}
      </main>
    )
  return (
    <main aria-label="Metronome" className="flex min-h-0 flex-1 flex-col overflow-auto bg-bg">
      {rhythm}
      <div className="px-4 pt-3 short:pt-2">{blocks}</div>
      <FitDial beat={beat} className="min-h-0 flex-[1_1_0] py-3 short:py-2" />
      {play}
      {more}
      {sheets}
    </main>
  )
}

/** The time signature and subdivision, each a small labelled button showing its value (the subdivision's picture); either opens the Rhythm sheet. */
function RhythmButtons({ landscape, onOpen }: { landscape: boolean; onOpen: () => void }) {
  const { beats, noteValue, subdivision } = useAppStore((s) => s.device.metronome)
  return (
    <div className={`grid grid-cols-2 gap-2 ${landscape ? '' : 'px-4 pt-2.5'}`}>
      <RhythmButton label="Time signature" onClick={onOpen}>
        <b className="font-sans text-[22px]/[30px] tabular-nums">
          {beats}/{noteValue}
        </b>
      </RhythmButton>
      <RhythmButton label="Subdivision" onClick={onOpen}>
        {/* On the time signature's 30 px line, so the two sit level. */}
        <span className="flex h-[30px] items-center">
          <SubdivisionPicture id={subdivision} size={0.75} inline />
        </span>
      </RhythmButton>
    </div>
  )
}

/** A small button with its setting's name over its value. */
function RhythmButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onMouseDown={keepFocus}
      onClick={onClick}
      className="flex min-w-0 cursor-pointer touch-manipulation flex-col items-center gap-1.5 rounded-xl border-0 bg-transparent py-1.5 text-ink active:bg-hover"
    >
      <span className="text-xs text-mute">{label}</span>
      {children}
    </button>
  )
}

/** The smallest the dial is drawn, in px, however short the screen; below it the screen scrolls. */
const MIN_DIAL = 140

/** The dial, as large as the room its box (`className`) leaves allows, up to its full size. */
function FitDial({ beat, className }: { beat: number | undefined; className: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(DIAL_SIZE)
  useLayoutEffect(() => {
    const el = ref.current!
    const observer = new ResizeObserver(() => {
      const { paddingTop, paddingBottom } = getComputedStyle(el)
      const room = Math.min(el.clientWidth - 32, el.clientHeight - parseFloat(paddingTop) - parseFloat(paddingBottom))
      setSize(Math.floor(Math.max(MIN_DIAL, Math.min(DIAL_SIZE, room))))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return (
    // Its height is the room left, not the dial's, so the dial never pushes the rest down.
    <div ref={ref} className={`flex items-center justify-center ${className}`}>
      <Dial beat={beat} size={size} />
    </div>
  )
}

/** Plays the metronome from beat 1, stopping an exercise that's playing, or stops it; `className` sizes it. */
export function PlayButton({ className = 'size-19 short:size-16' }: { className?: string }) {
  const playing = useAppStore((s) => s.metronomePlaying)
  return (
    <button
      type="button"
      aria-label={playing ? 'Stop' : 'Play'}
      onMouseDown={keepFocus}
      onClick={toggleMetronome}
      className={`flex ${className} shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-full border border-play-button-edge bg-play-button text-2xl/none text-on-play-button shadow-card select-none active:opacity-80`}
    >
      <span aria-hidden>{playing ? '■' : '▶'}</span>
    </button>
  )
}

/** How many taps are kept: tapTempo reads the gaps between the last few. */
const TAPS_KEPT = 5

/** A tap of the tempo: from the second tap on, it sets the tempo from the drummer's taps. */
export function useTapTempo(): () => void {
  const taps = useRef<number[]>([])
  return useCallback(() => {
    taps.current = [...taps.current, performance.now()].slice(-TAPS_KEPT)
    const bpm = tapTempo(taps.current)
    if (bpm !== undefined) useAppStore.getState().setMetronome({ bpm })
  }, [])
}

/** The button that taps the tempo (`useTapTempo`'s `tap`). */
export function TapTempo({ tap, className, children }: { tap: () => void; className: string; children: ReactNode }) {
  return (
    <Button
      size="lg"
      // A tap counts as the finger lands, not as it lifts; the keyboard (detail 0) clicks.
      onPointerDown={(e) => e.button === 0 && tap()}
      onClick={(e) => e.detail === 0 && tap()}
      className={className}
    >
      {children}
    </Button>
  )
}
