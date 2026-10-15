import { useAppStore } from '@/app/store'
import { Segmented } from '@/components/Segmented'
import { Sheet } from '@/components/Sheet'
import type { MetronomeSound } from '@/core'
import { METRONOME_SOUNDS } from '@/core'
import { previewMetronomeSound } from '@/features/playback/engine'
import { MetronomeVolume } from './MetronomeVolume'

/** Each sound's name, as the Sound sheet and the desktop's panel offer it. */
export const SOUND_NAMES: Record<MetronomeSound, string> = {
  beep: 'Beep',
  woodBlock: 'Wood block',
  cowbell: 'Cowbell',
  hihat: 'Hi-hat',
  rideBell: 'Ride bell',
}

/** Picks the click's sound, and plays it once so it's heard at once. */
export function pickSound(sound: MetronomeSound): void {
  const { setMetronome } = useAppStore.getState()
  setMetronome({ sound })
  previewMetronomeSound(useAppStore.getState().device.metronome).catch((error: unknown) => console.error(error))
}

/** The phone's Sound sheet: the click's sound, heard at once when picked, and the beats' volume. */
export function SoundSheet({ onDone }: { onDone: () => void }) {
  const sound = useAppStore((s) => s.device.metronome.sound)
  return (
    <Sheet title="Sound" onDone={onDone}>
      <div className="flex flex-col gap-2">
        <span className="font-semibold">Click</span>
        <Segmented
          label="Click sound"
          options={METRONOME_SOUNDS.map((s) => ({ value: s, label: SOUND_NAMES[s] }))}
          value={sound}
          onChange={pickSound}
          className="flex-col rounded-2xl! [&>button]:h-11 [&>button]:text-base"
        />
      </div>
      <MetronomeVolume setting="beatVolume" label="Beats volume" />
    </Sheet>
  )
}
