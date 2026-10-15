import { useAppStore } from '@/app/store'
import { Segmented } from '@/components/Segmented'
import { Sheet } from '@/components/Sheet'
import type { MetronomeSound } from '@/core'
import { METRONOME_SOUNDS } from '@/core'
import { previewMetronomeSound } from '@/features/playback/engine'
import { MetronomeVolume } from './MetronomeVolume'

export const SOUND_NAMES: Record<MetronomeSound, string> = {
  beep: 'Beep',
  woodBlock: 'Wood block',
  cowbell: 'Cowbell',
  hihat: 'Hi-hat',
  rideBell: 'Ride bell',
}

/** The phone's Sound sheet: the click's sound, heard at once when picked, and the beats' volume. */
export function SoundSheet({ onDone }: { onDone: () => void }) {
  const sound = useAppStore((s) => s.device.metronome.sound)
  const setMetronome = useAppStore((s) => s.setMetronome)
  const pick = (next: MetronomeSound) => {
    setMetronome({ sound: next })
    previewMetronomeSound(useAppStore.getState().device.metronome).catch((error: unknown) => console.error(error))
  }
  return (
    <Sheet title="Sound" onDone={onDone}>
      <div className="flex flex-col gap-2">
        <span className="font-semibold">Click</span>
        <Segmented
          label="Click sound"
          options={METRONOME_SOUNDS.map((s) => ({ value: s, label: SOUND_NAMES[s] }))}
          value={sound}
          onChange={pick}
          className="flex-col rounded-2xl! [&>button]:h-11 [&>button]:text-base"
        />
      </div>
      <MetronomeVolume setting="beatVolume" label="Beats volume" />
    </Sheet>
  )
}
