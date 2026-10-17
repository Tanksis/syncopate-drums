import { useAppStore } from '@/app/store'
import { Slider } from '@/components/Slider'
import { ValueField } from '@/components/ValueField'
import { DEFAULT_METRONOME_SETTINGS, MAX_VOLUME } from '@/core'

/**
 * The metronome's volume, for every click: its name and percent over a full-width slider, or as a
 * `row`, its name, slider and percent side by side, as the Mix's rows are.
 */
export function MetronomeVolume({ label = 'Volume', row = false }: { label?: string; row?: boolean }) {
  const volume = useAppStore((s) => s.device.metronome.volume)
  const setMetronome = useAppStore((s) => s.setMetronome)
  if (row)
    return (
      <div className="flex items-center gap-2">
        <span className="w-14 text-mute">{label}</span>
        <Slider
          label={label}
          min={0}
          max={MAX_VOLUME}
          step={0.01}
          value={volume}
          reset={DEFAULT_METRONOME_SETTINGS.volume}
          onChange={(value, { dragging }) => setMetronome({ volume: value }, { dragging })}
          className="flex-1"
        />
        <ValueField
          label={`${label} %`}
          value={volume * 100}
          unit="%"
          min={0}
          max={MAX_VOLUME * 100}
          decimals={0}
          onChange={(percent) => setMetronome({ volume: percent / 100 })}
          className="w-12"
        />
      </div>
    )
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
