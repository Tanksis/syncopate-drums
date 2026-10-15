import type { KeyboardEvent, ReactNode } from 'react'
import { useId, useRef, useState } from 'react'
import { LOOK_STYLES, lookName } from '@/app/looks'
import { useAppStore } from '@/app/store'
import { Button } from '@/components/Button'
import { DoneButton } from '@/components/DoneButton'
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
import {
  DEFAULT_DEVICE_SETTINGS,
  GROOVE_PRESETS,
  HIHAT_FOOT_SETTINGS,
  MAX_SWING,
  MAX_VOLUME,
  MIN_SWING,
  THEMES,
  TRIPLET_SWING,
  groovePreset,
  overrideCount,
} from '@/core'

/**
 * The settings, as the desktop's sidebar. `playbackGroup` adds the count-in and loop chip, for when
 * the header has no room for them. `fullScreen`, on a phone, they're the phone's tabbed settings instead.
 */
export function SettingsSidebar({
  onCollapse,
  fullScreen = false,
  playbackGroup = false,
}: {
  onCollapse: () => void
  fullScreen?: boolean
  playbackGroup?: boolean
}) {
  if (fullScreen) return <PhoneSettings onDone={onCollapse} />
  return (
    <aside aria-label="Settings" className="flex w-[250px] flex-col gap-3.5 overflow-auto border-l border-line bg-panel p-3">
      <SidebarHeading name="Settings" side="right" onCollapse={onCollapse} />
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
      <SettingGroup title="Mix">
        <MixRow layer="click" />
        <MixRow layer="exercise" />
        <MixRow layer="groove" />
      </SettingGroup>
      <SettingGroup title="Appearance">
        <LookChoice />
        <ModeChoice />
      </SettingGroup>
    </aside>
  )
}

const PHONE_TABS = [
  { id: 'groove', name: 'Groove' },
  { id: 'sticking', name: 'Sticking' },
  { id: 'mix', name: 'Mix' },
  { id: 'theme', name: 'Theme' },
] as const

type PhoneTab = (typeof PHONE_TABS)[number]['id']

/**
 * The settings over the whole phone screen: Loop and Count-in pinned at the top, then a tab for each
 * section, so one section shows at a time and nothing needs a long scroll. The tick closes them.
 */
function PhoneSettings({ onDone }: { onDone: () => void }) {
  const [tab, setTab] = useState<PhoneTab>('groove')
  const id = useId()
  return (
    <aside aria-label="Settings" className="flex w-full flex-col bg-panel">
      <div className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-2.5">
        <h2 className="m-0 font-display text-2xl font-semibold">Settings</h2>
        <DoneButton label="Close settings" onClick={onDone} />
      </div>
      <div className="flex items-center justify-between gap-3 px-4 pb-3.5">
        <LoopChip />
        <CountInToggle />
      </div>
      <PhoneTabs id={id} tab={tab} onChange={setTab} />
      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${tab}`} className="flex min-h-0 flex-1 flex-col gap-5 overflow-auto px-4 py-5">
        {tab === 'groove' && (
          <>
            <GroovePicker large />
            <HihatFootChoice large />
            <Swing stacked />
          </>
        )}
        {tab === 'sticking' && (
          <>
            <Choice label="Mode" setting="sticking" options={['natural', 'alternate', 'off']} stacked />
            <Choice label="Lead hand" setting="leadHand" options={['R', 'L']} stacked />
            <ResetOverrides />
          </>
        )}
        {tab === 'mix' && (
          <>
            <MixRow layer="click" large />
            <MixRow layer="exercise" large />
            <MixRow layer="groove" large />
          </>
        )}
        {tab === 'theme' && (
          <>
            <LookChoice large />
            <ModeChoice stacked />
          </>
        )}
      </div>
    </aside>
  )
}

/** The phone settings' section tabs; the arrow keys, Home and End move between them, as in any tab list. */
function PhoneTabs({ id, tab, onChange }: { id: string; tab: PhoneTab; onChange: (tab: PhoneTab) => void }) {
  const list = useRef<HTMLDivElement>(null)
  const onKeyDown = (e: KeyboardEvent) => {
    const i = PHONE_TABS.findIndex((t) => t.id === tab)
    const n = PHONE_TABS.length
    const keys: Record<string, number> = { ArrowLeft: (i - 1 + n) % n, ArrowRight: (i + 1) % n, Home: 0, End: n - 1 }
    const next = keys[e.key]
    if (next === undefined) return
    e.preventDefault()
    onChange(PHONE_TABS[next].id)
    list.current?.querySelectorAll<HTMLElement>('[role=tab]')[next]?.focus()
  }
  return (
    <div ref={list} role="tablist" aria-label="Settings sections" onKeyDown={onKeyDown} className="mx-4 grid grid-cols-4 border-b border-line">
      {PHONE_TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          id={`${id}-${t.id}`}
          aria-selected={t.id === tab}
          aria-controls={`${id}-panel`}
          tabIndex={t.id === tab ? 0 : -1}
          onClick={() => onChange(t.id)}
          className="-mb-px h-11 cursor-pointer touch-manipulation border-0 border-b-3 border-solid border-transparent bg-transparent font-semibold text-mute aria-selected:border-accent aria-selected:text-accent"
        >
          {t.name}
        </button>
      ))}
    </div>
  )
}

/** A setting's name and its control: side by side, or `stacked` with the name above a full-width control. */
function Labelled({ label, stacked, children }: { label: string; stacked: boolean; children: ReactNode }) {
  if (stacked)
    return (
      <div className="flex flex-col gap-2">
        <span className="font-semibold">{label}</span>
        {/* A row, so a control that grows (flex-1) takes the width rather than the height. */}
        <div className="flex">{children}</div>
      </div>
    )
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-mute">{label}</span>
      {children}
    </div>
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
function GroovePicker({ large = false }: { large?: boolean }) {
  const groove = useAppStore((s) => s.editor.exercise.practice.groove)
  const setGroove = useAppStore((s) => s.setGroove)
  return (
    <Labelled label="Preset" stacked={large}>
      <SelectMenu
        label="Groove preset"
        large={large}
        options={GROOVE_PRESETS.map((preset) => ({ value: preset.id, label: preset.name }))}
        value={groovePreset(groove).id}
        onChange={setGroove}
      />
    </Labelled>
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
function HihatFootChoice({ large = false }: { large?: boolean }) {
  const hihatFoot = useAppStore((s) => s.editor.exercise.practice.hihatFoot)
  const setHihatFoot = useAppStore((s) => s.setHihatFoot)
  return (
    <Labelled label="Hi-hat foot" stacked={large}>
      <SelectMenu
        label="Hi-hat foot"
        large={large}
        options={HIHAT_FOOT_SETTINGS.map((option) => ({ value: option, ...HIHAT_FOOT_OPTIONS[option] }))}
        value={hihatFoot}
        onChange={setHihatFoot}
      />
    </Labelled>
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

/**
 * The swing amount: a slider from straight to dotted, and chips for straight and the common feels.
 * `stacked`, its name and percent sit over a full-width slider.
 */
function Swing({ stacked = false }: { stacked?: boolean }) {
  const swing = useAppStore((s) => s.editor.exercise.practice.swing)
  const setSwing = useAppStore((s) => s.setSwing)
  const preset = SWING_PRESETS.find((p) => Math.abs(p.swing - swing) < 1e-6)
  const slider = (
    <Slider label="Swing" min={MIN_SWING} max={MAX_SWING} step={0.005} value={swing} reset={MIN_SWING} onChange={setSwing} className="flex-1" />
  )
  const percent = (
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
  )
  return (
    <div className={`flex flex-col ${stacked ? 'gap-2.5' : 'gap-1.5'}`}>
      {stacked ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">Swing</span>
            {percent}
          </div>
          <div className="flex">{slider}</div>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-mute">Swing</span>
          {slider}
          {percent}
        </div>
      )}
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
 * `large`, on a phone, its name and percent sit over the slider and a finger-sized mute.
 */
function MixRow({ layer, large = false }: { layer: Layer; large?: boolean }) {
  const setting: VolumeSetting = `${layer}Volume`
  const mute = `${layer}Muted` as const
  const label = layer[0].toUpperCase() + layer.slice(1)
  const volume = useAppStore((s) => s.device[setting])
  const muted = useAppStore((s) => s.device[mute])
  const setDeviceSettings = useAppStore((s) => s.setDeviceSettings)
  const setVolume = (value: number, dragging = false) =>
    setDeviceSettings({ [setting]: value }, { dragging })
  const slider = (
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
  )
  const percent = (
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
  )
  const muteButton = (
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
  )
  if (large)
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold">{label}</span>
          {percent}
        </div>
        <div className="flex items-center gap-2">
          {slider}
          {muteButton}
        </div>
      </div>
    )
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 text-mute">{label}</span>
      {slider}
      {percent}
      {muteButton}
    </div>
  )
}

/** The theme: how the app looks on this device, its look in code (ADR 0013). */
function LookChoice({ large = false }: { large?: boolean }) {
  const look = useAppStore((s) => s.device.look)
  const setDeviceSettings = useAppStore((s) => s.setDeviceSettings)
  return (
    <Labelled label="Theme" stacked={large}>
      <SelectMenu
        label="Theme"
        large={large}
        options={LOOK_STYLES.map((style) => ({ value: style.look, label: lookName(style.look) }))}
        value={look}
        onChange={(option) => setDeviceSettings({ look: option })}
      />
    </Labelled>
  )
}

const MODE_NAMES: Record<Theme, string> = { auto: 'Auto', light: 'Light', dark: 'Dark' }

/** The mode, light or dark on this device, or Auto to follow the device's own setting. */
function ModeChoice({ stacked = false }: { stacked?: boolean }) {
  const theme = useAppStore((s) => s.device.theme)
  const setDeviceSettings = useAppStore((s) => s.setDeviceSettings)
  return (
    <div className={stacked ? 'flex flex-col gap-2' : 'flex items-center justify-between gap-2'}>
      <span className={stacked ? 'font-semibold' : 'text-mute'}>Mode</span>
      <Segmented
        label="Mode"
        fill={stacked}
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
  stacked = false,
}: {
  label: string
  setting: K
  options: ExerciseSettings[K][]
  stacked?: boolean
}) {
  const value = useAppStore((s) => s.editor.exercise[setting])
  const dispatch = useAppStore((s) => s.dispatch)
  return (
    <div className={stacked ? 'flex flex-col gap-2' : 'flex items-center justify-between gap-2'}>
      <span className={stacked ? 'font-semibold' : 'text-mute'}>{label}</span>
      <Segmented
        label={label}
        fill={stacked}
        options={options.map((option) => ({ value: option, label: String(option) }))}
        value={value}
        onChange={(option) => dispatch({ type: 'setExerciseSettings', settings: { [setting]: option } })}
      />
    </div>
  )
}
