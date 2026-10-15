import { useAppStore } from '@/app/store'
import { Slider } from '@/components/Slider'
import { ValueField } from '@/components/ValueField'
import { DEFAULT_METRONOME_SETTINGS, MAX_VOLUME } from '@/core'

/** The metronome's volume, for every click: its name and percent over a full-width slider. */
export function MetronomeVolume({ label = 'Volume' }: { label?: string }) {
  const volume = useAppStore((s) => s.device.metronome.volume)
  const setMetronome = useAppStore((s) => s.setMetronome)
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">{label}</span>
        <ValueField
          label={`${label} %`}
          value={volume * 100}
          unit="%"
          min={0}
          max={MAX_VOLUME * 100}
          decimals={0}
          onChange={(percent) => setMetronome({ volume: percent / 100 })}
          className="w-14"
        />
      </div>
      <Slider
        label={label}
        min={0}
        max={MAX_VOLUME}
        step={0.01}
        value={volume}
        reset={DEFAULT_METRONOME_SETTINGS.volume}
        onChange={(value, { dragging }) => setMetronome({ volume: value }, { dragging })}
        className="h-11"
      />
    </div>
  )
}
