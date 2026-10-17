import { useAppStore } from '@/app/store'
import { Popover } from '@/components/Popover'
import { GearIcon, SpeakerIcon, SpeakerMutedIcon } from '@/components/icons'
import { AppearanceSettings, MixSettings } from './SettingsSidebar'

/**
 * The header's Mix button, on the Practice screen: a panel of the exercise playback's layers, their
 * volumes and mutes. Its speaker is crossed out while any layer is muted.
 */
export function MixButton() {
  const muted = useAppStore((s) => s.device.clickMuted || s.device.exerciseMuted || s.device.grooveMuted)
  return (
    <Popover
      label="Mix"
      title={muted ? 'Mix (a layer is muted)' : 'Mix'}
      icon={muted ? <SpeakerMutedIcon /> : <SpeakerIcon />}
    >
      <MixSettings />
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
