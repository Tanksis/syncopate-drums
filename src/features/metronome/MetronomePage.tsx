import { useAppStore } from '@/app/store'
import { BpmStep } from '@/features/playback/BpmStep'
import { BeatBlocks, blockColumns } from './BeatBlocks'
import { Dial } from './Dial'
import { PlayButton, TapTempo, useTapTempo } from './MetronomeScreen'
import { SubdivisionGrid, TimeSignature } from './RhythmSheet'
import { useMetronomeKeys } from './useMetronomeKeys'
import { useMetronomeBeat } from './useMetronomeBeat'

/** The − and + beside the dial. */
const stepClass = 'size-12 rounded-full border-edge bg-card text-2xl/none text-ink hover:border-accent hover:text-accent active:border-accent active:text-accent'

/** The widest a beat block is drawn, in px, with the gap after it. */
const BLOCK_PITCH = 128

/**
 * The desktop's Metronome page, between the sidebars in place of the notation and editor: the beat
 * blocks over the dial, with − + and Tap tempo and Play beside it, each with its key. The settings
 * sidebar holds its time signature and subdivision (`MetronomeRhythm`), and the header's speaker its
 * sound and volume (`MetronomeSoundSettings`). Space, − + and the arrows, and T work from anywhere on it, and
 * the wheel over the dial changes the BPM.
 */
export function MetronomePage() {
  const beat = useMetronomeBeat()
  const tap = useTapTempo()
  useMetronomeKeys(tap)
  const beats = useAppStore((s) => s.device.metronome.levels.length)
  return (
    <main aria-label="Metronome" className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center-safe gap-8.5 overflow-auto bg-bg p-6">
      <div className="w-full" style={{ maxWidth: blockColumns(beats) * BLOCK_PITCH - 8 }}>
        <BeatBlocks beat={beat} large />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-6">
        <Dial beat={beat} hint="Drag the ring or scroll" />
        <div className="flex flex-col items-center gap-3.5">
          <div className="flex items-center gap-4.5">
            <BpmStep step={-1} tempo="metronome" className={stepClass}>
              <span aria-hidden>−</span>
            </BpmStep>
            <Key>− / + keys</Key>
            <BpmStep step={1} tempo="metronome" className={stepClass}>
              <span aria-hidden>+</span>
            </BpmStep>
          </div>
          <div className="flex items-center gap-4">
            <TapTempo tap={tap} className="rounded-full! px-5!">
              Tap <span className="font-normal text-mute">(T)</span>
            </TapTempo>
            <PlayButton className="size-16" />
            <Key>Space</Key>
          </div>
        </div>
      </div>
    </main>
  )
}

/** The Metronome screen's own settings, at the top of the desktop's settings sidebar. */
export function MetronomeRhythm() {
  return (
    <>
      <TimeSignature compact />
      <SubdivisionGrid compact />
    </>
  )
}

/** The key that does what the control beside it does. */
function Key({ children }: { children: string }) {
  return <span className="text-[13px] whitespace-nowrap text-mute">{children}</span>
}
