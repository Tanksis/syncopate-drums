import type { ReactNode } from 'react'
import { useAppStore } from '@/app/store'
import { Button } from '@/components/Button'
import { PanelHeading } from '@/components/PanelHeading'
import { Segmented } from '@/components/Segmented'
import { SidebarHeading } from '@/components/Sidebar'
import { Slider } from '@/components/Slider'
import { Switch } from '@/components/Switch'
import { ValueField } from '@/components/ValueField'
import { LoopChip } from '@/features/playback/LoopChip'
import { CountInToggle } from '@/features/playback/TransportControls'
import type { ExerciseSettings, GroovePresetId, HihatFoot, Theme, VolumeSetting } from '@/core'
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
        <GroovePicker />
        <HihatFootChoice />
        <Swing />
      </SettingGroup>
      <SettingGroup title="Sticking">
        <Choice label="Mode" setting="sticking" options={['natural', 'alternate', 'off']} />
        <Choice label="Lead hand" setting="leadHand" options={['R', 'L']} />
        <ResetOverrides />
      </SettingGroup>
      <SettingGroup title="Volume">
        <Volume label="Click" setting="clickVolume" />
        <Volume label="Exercise" setting="exerciseVolume">
          <MuteExercise />
        </Volume>
        <Volume label="Groove" setting="grooveVolume" />
      </SettingGroup>
      <SettingGroup title="Display">
        <ThemeChoice />
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
function GroovePicker() {
  const groove = useAppStore((s) => s.editor.exercise.practice.groove)
  const setGroove = useAppStore((s) => s.setGroove)
  return (
    <label className="flex items-center justify-between gap-2">
      <span className="text-mute">Preset</span>
      <select
        aria-label="Groove preset"
        value={groove}
        // The sidebar is narrow, so the longer names are cut short; the full name shows on hover.
        title={groovePreset(groove).name}
        // Once a preset is picked, hand the keyboard back to the editor.
        onChange={(e) => {
          setGroove(e.target.value as GroovePresetId)
          e.currentTarget.blur()
        }}
        className="min-w-0 flex-1 cursor-pointer rounded-md border border-edge bg-card px-1 py-0.5"
      >
        {GROOVE_PRESETS.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.name}
          </option>
        ))}
      </select>
    </label>
  )
}

const HIHAT_FOOT_NAMES: Record<HihatFoot, string> = { off: 'Off', one: 'On 1', quarters: 'Quarters', twoAndFour: '2 & 4', ands: '&s' }

/** The hi-hat foot played in every bar, with any groove or none, in place of the groove's own (ADR 0010). */
function HihatFootChoice() {
  const hihatFoot = useAppStore((s) => s.editor.exercise.practice.hihatFoot)
  const setHihatFoot = useAppStore((s) => s.setHihatFoot)
  return (
    <div className="flex flex-col gap-1">
      <span className="text-mute">Hi-hat foot</span>
      <Segmented
        label="Hi-hat foot"
        fill
        options={HIHAT_FOOT_SETTINGS.map((option) => ({ value: option, label: HIHAT_FOOT_NAMES[option] }))}
        value={hihatFoot}
        onChange={setHihatFoot}
      />
    </div>
  )
}

const SWING_PRESETS = [
  { name: 'off', swing: MIN_SWING },
  { name: 'light', swing: 0.58 },
  { name: 'medium', swing: 0.62 },
  { name: 'triplet', swing: TRIPLET_SWING },
  { name: 'dotted', swing: 0.75 },
]

/** A typed swing, as an amount; one that shows as a preset (66.7% is triplet) is that preset. */
const swingFromPercent = (percent: number) =>
  SWING_PRESETS.find((preset) => Math.abs(preset.swing * 100 - percent) < 0.05)?.swing ?? percent / 100

/** The swing amount: a slider from straight to dotted, and buttons for off (straight) and the common feels. */
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
        options={SWING_PRESETS.map((p) => ({ value: p.swing, label: p.name }))}
        value={preset?.swing ?? null}
        onChange={(amount) => setSwing(amount)}
      />
    </div>
  )
}

/** A layer's volume on this device, 100% being its usual level; it applies while playing. */
function Volume({ label, setting, children }: { label: string; setting: VolumeSetting; children?: ReactNode }) {
  const volume = useAppStore((s) => s.device[setting])
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
        className="flex-1"
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
      {/* The same width on every row, so the sliders line up. */}
      <div className="flex w-11 justify-end">{children}</div>
    </div>
  )
}

const THEME_NAMES: Record<Theme, string> = { auto: 'Auto', light: 'Light', dark: 'Dark' }

/** Light or dark on this device, or Auto to follow the device's own setting. */
function ThemeChoice() {
  const theme = useAppStore((s) => s.device.theme)
  const setDeviceSettings = useAppStore((s) => s.setDeviceSettings)
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-mute">Theme</span>
      <Segmented
        label="Theme"
        options={THEMES.map((option) => ({ value: option, label: THEME_NAMES[option] }))}
        value={theme}
        onChange={(option) => setDeviceSettings({ theme: option })}
      />
    </div>
  )
}

/** Silences the exercise, so the drummer can play the line over the click and the groove. */
function MuteExercise() {
  const muted = useAppStore((s) => s.device.exerciseMuted)
  const setDeviceSettings = useAppStore((s) => s.setDeviceSettings)
  return (
    <Switch
      label="Mute the exercise"
      labelHidden
      title={muted ? 'Unmute the exercise' : 'Mute the exercise'}
      checked={muted}
      onChange={(exerciseMuted) => setDeviceSettings({ exerciseMuted })}
    />
  )
}

/** Clears every sticking override in one undoable step; disabled when there are none. */
function ResetOverrides() {
  const count = useAppStore((s) => overrideCount(s.editor.exercise))
  const dispatch = useAppStore((s) => s.dispatch)
  return (
    <Button disabled={count === 0} onClick={() => dispatch({ type: 'resetOverrides' })} className="self-end">
      Reset overrides ({count})
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
