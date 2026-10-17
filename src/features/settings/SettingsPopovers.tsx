import { useAppStore } from '@/app/store'
import { Popover } from '@/components/Popover'
import { GearIcon, SpeakerIcon, SpeakerMutedIcon } from '@/components/icons'
import { AppearanceSettings, MetronomeSoundSettings, MixSettings } from './SettingsSidebar'

/**
 * The header's speaker, on either screen: a panel of the screen's own sound, as the settings sidebar
 * holds the screen's own settings. On Practice it's the Mix, the exercise playback's layers, their
 * volumes and mutes; on the Metronome, its click sound and volume. Its speaker is crossed out while
 * what it sets is silent somewhere: a muted layer, or the metronome at 0%.
 */
export function SoundButton() {
  const onMetronome = useAppStore((s) => s.device.screen === 'metronome')
  const muted = useAppStore((s) =>
    s.device.screen === 'metronome' ? s.device.metronome.volume === 0 : s.device.clickMuted || s.device.exerciseMuted || s.device.grooveMuted,
  )
  const label = onMetronome ? 'Metronome sound' : 'Mix'
  const silence = onMetronome ? 'at 0%' : 'a layer is muted'
  return (
    <Popover label={label} title={muted ? `${label} (${silence})` : label} icon={muted ? <SpeakerMutedIcon /> : <SpeakerIcon />}>
      {onMetronome ? <MetronomeSoundSettings /> : <MixSettings />}
    </Popover>
  )
}

/** The header's Preferences button, on either screen: a panel of how the app looks on this device. */
export function PreferencesButton() {
  return (
    <Popover label="Preferences" icon={<GearIcon />}>
      <AppearanceSettings />
    </Popover>
  )
}
