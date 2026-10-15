import { useAppStore } from '@/app/store'
import { Slider } from '@/components/Slider'
import { ValueField } from '@/components/ValueField'
import { DEFAULT_METRONOME_SETTINGS, MAX_VOLUME } from '@/core'

/** One of the metronome's volumes, the beats' or the subdivision's: its name and percent over a full-width slider. */
export function MetronomeVolume({ setting, label }: { setting: 'beatVolume' | 'subdivisionVolume'; label: string }) {
  const volume = useAppStore((s) => s.device.metronome[setting])
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
          onChange={(percent) => setMetronome({ [setting]: percent / 100 })}
          className="w-14"
        />
      </div>
      <Slider
        label={label}
        min={0}
        max={MAX_VOLUME}
        step={0.01}
        value={volume}
        reset={DEFAULT_METRONOME_SETTINGS[setting]}
        onChange={(value, { dragging }) => setMetronome({ [setting]: value }, { dragging })}
        className="h-11"
      />
    </div>
  )
}
