import type { ReactNode } from 'react'
import { useAppStore } from '@/app/store'
import { Button } from '@/components/Button'
import { PanelHeading } from '@/components/PanelHeading'
import { Segmented } from '@/components/Segmented'
import { SelectMenu } from '@/components/SelectMenu'
import { SidebarHeading } from '@/components/Sidebar'
import { Slider } from '@/components/Slider'
import { SpeakerIcon, SpeakerMutedIcon } from '@/components/icons'
import { ValueField } from '@/components/ValueField'
import { LoopChip } from '@/features/playback/LoopChip'
import { CountInToggle } from '@/features/playback/TransportControls'
import type { ExerciseSettings, HihatFoot, Layer, Theme, VolumeSetting } from '@/core'
import { DEFAULT_DEVICE_SETTINGS, GROOVE_PRESETS, HIHAT_FOOT_SETTINGS, MAX_SWING, MAX_VOLUME, MIN_SWING, THEMES, TRIPLET_SWING, groovePreset, overrideCount } from '@/core'

/** `playbackGroup` adds the count-in and loop chip, for when the header has no room for them. */
export function SettingsSidebar({
  onCollapse,
  fullScreen = false,
  playbackGroup = false,
}: {
  onCollapse: () => void
  fullScreen?: boolean
  playbackGroup?: boolean
}) {
  return (
    <aside
      aria-label="Settings"
      className={`flex flex-col gap-3.5 overflow-auto bg-panel p-3 ${fullScreen ? 'w-full' : 'w-[250px] border-l border-line'}`}
    >
      <SidebarHeading name="Settings" side="right" fullScreen={fullScreen} onCollapse={onCollapse} />
      {playbackGroup && (
        <SettingGroup title="Playback">
          <div className="flex items-center justify-between gap-2">
            <LoopChip />
            <CountInToggle />
          </div>
        </SettingGroup>
      )}
      <SettingGroup title="Groove">
        <GroovePicker large={fullScreen} />
        <HihatFootChoice large={fullScreen} />
        <Swing />
      </SettingGroup>
      <SettingGroup title="Sticking">
        <Choice label="Mode" setting="sticking" options={['natural', 'alternate', 'off']} />
        <Choice label="Lead hand" setting="leadHand" options={['R', 'L']} />
        <ResetOverrides />
      </SettingGroup>
      <SettingGroup title="Mix">
        <MixRow layer="click" large={fullScreen} />
        <MixRow layer="exercise" large={fullScreen} />
        <MixRow layer="groove" large={fullScreen} />
      </SettingGroup>
      <SettingGroup title="Appearance">
        <ModeChoice />
      </SettingGroup>
    </aside>
  )
}

function SettingGroup({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <PanelHeading>{title}</PanelHeading>
      {children}
    </section>
  )
}

/** The groove layer played and drawn with the exercise, or none. */
function GroovePicker({ large }: { large: boolean }) {
  const groove = useAppStore((s) => s.editor.exercise.practice.groove)
  const setGroove = useAppStore((s) => s.setGroove)
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-mute">Preset</span>
      <SelectMenu
        label="Groove preset"
        large={large}
        options={GROOVE_PRESETS.map((preset) => ({ value: preset.id, label: preset.name }))}
        value={groovePreset(groove).id}
        onChange={setGroove}
      />
    </div>
  )
}

const HIHAT_FOOT_OPTIONS: Record<HihatFoot, { label: string; hint?: string }> = {
  off: { label: 'Off' },
  one: { label: 'On 1', hint: 'beat 1' },
  quarters: { label: 'Quarters', hint: 'every beat' },
  twoAndFour: { label: '2 & 4', hint: 'backbeat' },
  ands: { label: 'Off-beats', hint: 'the &s' },
}

/** The hi-hat foot played in every bar, with any groove or none, in place of the groove's own (ADR 0010). */
function HihatFootChoice({ large }: { large: boolean }) {
  const hihatFoot = useAppStore((s) => s.editor.exercise.practice.hihatFoot)
  const setHihatFoot = useAppStore((s) => s.setHihatFoot)
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-mute">Hi-hat foot</span>
      <SelectMenu
        label="Hi-hat foot"
        large={large}
        options={HIHAT_FOOT_SETTINGS.map((option) => ({ value: option, ...HIHAT_FOOT_OPTIONS[option] }))}
        value={hihatFoot}
        onChange={setHihatFoot}
      />
    </div>
  )
}

const SWING_PRESETS = [
  { name: 'Straight', swing: MIN_SWING },
  { name: 'Light', swing: 0.58 },
  { name: 'Medium', swing: 0.62 },
  { name: 'Triplet', swing: TRIPLET_SWING },
  { name: 'Dotted', swing: 0.75 },
]

/** A typed swing, as an amount; one that shows as a preset (66.7% is triplet) is that preset. */
const swingFromPercent = (percent: number) =>
  SWING_PRESETS.find((preset) => Math.abs(preset.swing * 100 - percent) < 0.05)?.swing ?? percent / 100

/** The swing amount: a slider from straight to dotted, and chips for straight and the common feels. */
function Swing() {
  const swing = useAppStore((s) => s.editor.exercise.practice.swing)
  const setSwing = useAppStore((s) => s.setSwing)
  const preset = SWING_PRESETS.find((p) => Math.abs(p.swing - swing) < 1e-6)
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="text-mute">Swing</span>
        <Slider
          label="Swing"
          min={MIN_SWING}
          max={MAX_SWING}
          step={0.005}
          value={swing}
          reset={MIN_SWING}
          onChange={setSwing}
          className="flex-1"
        />
        <ValueField
          label="Swing %"
          value={swing * 100}
          unit="%"
          min={MIN_SWING * 100}
          max={MAX_SWING * 100}
          decimals={1}
          onChange={(percent) => setSwing(swingFromPercent(percent))}
          className="w-16 sm:w-14"
        />
      </div>
      <Segmented
        label="Swing presets"
        fill
        // Smaller than the panel's text, so the five names fit the desktop sidebar's width.
        className="text-xs"
        options={SWING_PRESETS.map((p) => ({ value: p.swing, label: p.name }))}
        value={preset?.swing ?? null}
        onChange={(amount) => setSwing(amount)}
      />
    </div>
  )
}

/**
 * A playback layer in the mix: its volume on this device, 100% being its usual level, and a button
 * that mutes it, so the drummer can practise against any combination; both apply while playing.
 */
function MixRow({ layer, large }: { layer: Layer; large: boolean }) {
  const setting: VolumeSetting = `${layer}Volume`
  const mute = `${layer}Muted` as const
  const label = layer[0].toUpperCase() + layer.slice(1)
  const volume = useAppStore((s) => s.device[setting])
  const muted = useAppStore((s) => s.device[mute])
  const setDeviceSettings = useAppStore((s) => s.setDeviceSettings)
  const setVolume = (value: number, dragging = false) =>
    setDeviceSettings({ [setting]: value }, { dragging })
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 text-mute">{label}</span>
      <Slider
        label={`${label} volume`}
        min={0}
        max={MAX_VOLUME}
        step={0.01}
        value={volume}
        reset={DEFAULT_DEVICE_SETTINGS[setting]}
        onChange={(value, { dragging }) => setVolume(value, dragging)}
        className={`flex-1 ${muted ? 'opacity-40' : ''}`}
      />
      <ValueField
        label={`${label} volume %`}
        value={volume * 100}
        unit="%"
        min={0}
        max={MAX_VOLUME * 100}
        decimals={0}
        onChange={(percent) => setVolume(percent / 100)}
        className="w-14 sm:w-12"
      />
      <Button
        variant="ghost"
        icon
        size={large ? 'lg' : 'md'}
        aria-label={`Mute the ${layer}`}
        aria-pressed={muted}
        title={muted ? `Unmute the ${layer}` : `Mute the ${layer}`}
        onClick={() => setDeviceSettings({ [mute]: !muted })}
        className="-mr-1 aria-pressed:text-danger!"
      >
        {muted ? <SpeakerMutedIcon /> : <SpeakerIcon />}
      </Button>
    </div>
  )
}

const MODE_NAMES: Record<Theme, string> = { auto: 'Auto', light: 'Light', dark: 'Dark' }

/** The mode, light or dark on this device, or Auto to follow the device's own setting. */
function ModeChoice() {
  const theme = useAppStore((s) => s.device.theme)
  const setDeviceSettings = useAppStore((s) => s.setDeviceSettings)
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-mute">Mode</span>
      <Segmented
        label="Mode"
        options={THEMES.map((option) => ({ value: option, label: MODE_NAMES[option] }))}
        value={theme}
        onChange={(option) => setDeviceSettings({ theme: option })}
      />
    </div>
  )
}

/** Clears every sticking override in one undoable step; shown only when there are some. */
function ResetOverrides() {
  const count = useAppStore((s) => overrideCount(s.editor.exercise))
  const dispatch = useAppStore((s) => s.dispatch)
  if (count === 0) return null
  return (
    <Button onClick={() => dispatch({ type: 'resetOverrides' })} className="self-end">
      Reset {count} changed {count === 1 ? 'hand' : 'hands'}
    </Button>
  )
}

/** A row of buttons choosing one value of an exercise setting; each change is an undoable edit. */
function Choice<K extends keyof ExerciseSettings>({
  label,
  setting,
  options,
}: {
  label: string
  setting: K
  options: ExerciseSettings[K][]
}) {
  const value = useAppStore((s) => s.editor.exercise[setting])
  const dispatch = useAppStore((s) => s.dispatch)
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-mute">{label}</span>
      <Segmented
        label={label}
        options={options.map((option) => ({ value: option, label: String(option) }))}
        value={value}
        onChange={(option) => dispatch({ type: 'setExerciseSettings', settings: { [setting]: option } })}
      />
    </div>
  )
}
