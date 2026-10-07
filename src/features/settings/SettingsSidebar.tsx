import type { ReactNode } from 'react'
import { useRef } from 'react'
import { useAppStore } from '@/app/store'
import { PanelHeading } from '@/components/PanelHeading'
import type { ExerciseSettings, GroovePresetId, VolumeSetting } from '@/core'
import { GROOVE_PRESETS, MAX_SWING, MAX_VOLUME, MIN_SWING, groovePreset, overrideCount } from '@/core'

export function SettingsSidebar() {
  return (
    <aside
      aria-label="Settings"
      className="flex flex-col gap-3.5 overflow-auto border-l border-line bg-panel p-3"
    >
      <SettingGroup title="Groove">
        <GroovePicker />
        <Swing />
      </SettingGroup>
      <SettingGroup title="Sticking">
        <Choice label="Mode" setting="sticking" options={['natural', 'alternate', 'off']} />
        <Choice label="Lead hand" setting="leadHand" options={['R', 'L']} />
        <ResetOverrides />
      </SettingGroup>
      <SettingGroup title="Exercise">
        <Choice label="Voice" setting="voice" options={['snare', 'bass']} names={{ bass: 'bass drum' }} />
      </SettingGroup>
      <SettingGroup title="Editor" />
      <SettingGroup title="Volume">
        <Volume label="Click" setting="clickVolume" />
        <Volume label="Exercise" setting="exerciseVolume">
          <MuteExercise />
        </Volume>
        <Volume label="Groove" setting="grooveVolume" />
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
        className="min-w-0 flex-1 cursor-pointer rounded-md border border-line bg-card px-1 py-0.5"
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

const SWING_PRESETS = [
  { name: 'off', swing: MIN_SWING },
  { name: 'light', swing: 0.58 },
  { name: 'medium', swing: 0.62 },
  { name: 'triplet', swing: 2 / 3 },
  { name: 'dotted', swing: 0.75 },
]

/** The swing amount: a slider from straight to dotted, and buttons for off (straight) and the common feels. */
function Swing() {
  const swing = useAppStore((s) => s.editor.exercise.practice.swing)
  const setSwing = useAppStore((s) => s.setSwing)
  // A pointer drag on the slider saves once it ends; arrow keys on it save at once.
  const dragging = useRef(false)
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center justify-between gap-2">
        <span className="text-mute">Swing</span>
        <input
          type="range"
          aria-label="Swing"
          min={MIN_SWING}
          max={MAX_SWING}
          step={0.005}
          value={swing}
          onChange={(e) => setSwing(Number(e.target.value), { dragging: dragging.current })}
          onPointerDown={() => (dragging.current = true)}
          // Once a drag ends, save the amount it settled on and hand the keyboard back to the editor.
          onPointerUp={(e) => {
            dragging.current = false
            setSwing(Number(e.currentTarget.value))
            e.currentTarget.blur()
          }}
          className="min-w-0 flex-1 accent-accent"
        />
        <span className="w-12 text-right tabular-nums">{(swing * 100).toFixed(1)}%</span>
      </label>
      <div role="group" aria-label="Swing presets" className="flex overflow-hidden rounded-md border border-line">
        {SWING_PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            aria-pressed={Math.abs(preset.swing - swing) < 1e-6}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setSwing(preset.swing)}
            className="flex-1 cursor-pointer border-l border-line bg-card px-1 py-0.5 first:border-l-0 hover:text-accent aria-pressed:bg-accent aria-pressed:text-white aria-pressed:hover:text-white"
          >
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  )
}

/** A layer's volume on this device, 100% being its usual level; it applies while playing. */
function Volume({ label, setting, children }: { label: string; setting: VolumeSetting; children?: ReactNode }) {
  const volume = useAppStore((s) => s.device[setting])
  const setDeviceSettings = useAppStore((s) => s.setDeviceSettings)
  const setVolume = (value: number, dragging = false) =>
    setDeviceSettings({ [setting]: value }, { dragging })
  // A pointer drag on the slider saves once it ends; arrow keys on it save at once.
  const dragging = useRef(false)
  return (
    <div className="flex items-center gap-2">
      <label className="flex min-w-0 flex-1 items-center gap-2">
        <span className="w-14 text-mute">{label}</span>
        <input
          type="range"
          aria-label={`${label} volume`}
          min={0}
          max={MAX_VOLUME}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value), dragging.current)}
          onPointerDown={() => (dragging.current = true)}
          // Once a drag ends, save the volume it settled on and hand the keyboard back to the editor.
          onPointerUp={(e) => {
            dragging.current = false
            setVolume(Number(e.currentTarget.value))
            e.currentTarget.blur()
          }}
          className="min-w-0 flex-1 accent-accent"
        />
        <span className="w-9 text-right tabular-nums">{Math.round(volume * 100)}%</span>
      </label>
      {/* The same width on every row, so the sliders line up. */}
      <div className="flex w-11 justify-end">{children}</div>
    </div>
  )
}

/** Silences the exercise, so the drummer can play the line over the click and the groove. */
function MuteExercise() {
  const muted = useAppStore((s) => s.device.exerciseMuted)
  const setDeviceSettings = useAppStore((s) => s.setDeviceSettings)
  return (
    <button
      type="button"
      aria-pressed={muted}
      title={muted ? 'Unmute the exercise' : 'Mute the exercise'}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => setDeviceSettings({ exerciseMuted: !muted })}
      className="cursor-pointer rounded-md border border-line bg-card px-1.5 py-0.5 hover:text-accent aria-pressed:bg-accent aria-pressed:text-white aria-pressed:hover:text-white"
    >
      mute
    </button>
  )
}

/** Clears every sticking override in one undoable step; disabled when there are none. */
function ResetOverrides() {
  const count = useAppStore((s) => overrideCount(s.editor.exercise))
  const dispatch = useAppStore((s) => s.dispatch)
  return (
    <button
      type="button"
      disabled={count === 0}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => dispatch({ type: 'resetOverrides' })}
      className="cursor-pointer self-end rounded-md border border-line bg-card px-2 py-0.5 hover:text-accent disabled:cursor-default disabled:text-mute disabled:hover:text-mute"
    >
      Reset overrides ({count})
    </button>
  )
}

/** A row of buttons choosing one value of an exercise setting; each change is an undoable edit. */
function Choice<K extends keyof ExerciseSettings>({
  label,
  setting,
  options,
  names = {},
}: {
  label: string
  setting: K
  options: ExerciseSettings[K][]
  names?: Partial<Record<ExerciseSettings[K], string>>
}) {
  const value = useAppStore((s) => s.editor.exercise[setting])
  const dispatch = useAppStore((s) => s.dispatch)
  return (
    <div role="group" aria-label={label} className="flex items-center justify-between gap-2">
      <span className="text-mute">{label}</span>
      <div className="flex overflow-hidden rounded-md border border-line">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={option === value}
            // Keep focus off the button, so the editor's keys still work after a click.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => dispatch({ type: 'setExerciseSettings', settings: { [setting]: option } })}
            className="cursor-pointer border-l border-line bg-card px-2 py-0.5 first:border-l-0 hover:text-accent aria-pressed:bg-accent aria-pressed:text-white aria-pressed:hover:text-white"
          >
            {names[option] ?? option}
          </button>
        ))}
      </div>
    </div>
  )
}
