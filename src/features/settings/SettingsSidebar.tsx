import type { KeyboardEvent, ReactNode } from 'react'
import { useId, useRef, useState } from 'react'
import { LOOK_STYLES, lookName } from '@/app/looks'
import { useAppStore } from '@/app/store'
import { Button } from '@/components/Button'
import { PanelHeading } from '@/components/PanelHeading'
import { Segmented, type SegmentedOption } from '@/components/Segmented'
import { SelectMenu } from '@/components/SelectMenu'
import { SettingGroup } from '@/components/SettingGroup'
import { Switch } from '@/components/Switch'
import { FullScreenHeading, chevronButtonClass } from '@/components/Sidebar'
import { Slider } from '@/components/Slider'
import { ChevronIcon, SpeakerIcon, SpeakerMutedIcon } from '@/components/icons'
import { ValueField } from '@/components/ValueField'
import { keepFocus } from '@/components/keepFocus'
import { MetronomeVolume } from '@/features/metronome/MetronomeVolume'
import { SOUND_OPTIONS, pickSound } from '@/features/metronome/SoundSheet'
import { LoopChip } from '@/features/playback/LoopChip'
import { ClickToggle, CountInToggle } from '@/features/playback/TransportControls'
import type { ExerciseSettings, Hand, HihatFoot, Layer, StickingMode, Theme, TimeSignature, VolumeSetting } from '@/core'
import {
  DEFAULT_DEVICE_SETTINGS,
  GROOVE_PRESETS,
  MAX_SWING,
  MAX_VOLUME,
  MIN_SWING,
  THEMES,
  TIME_SIGNATURES,
  TRIPLET_SWING,
  groovePreset,
  hihatFootOptions,
  meter,
  overrideCount,
} from '@/core'

/**
 * The Practice screen's own settings, at the top of the desktop's settings sidebar: the time, the
 * groove and the sticking. `playbackGroup` adds the Click and Count-in chips and the loop chip, for when the exercise's bar has no
 * room for them.
 */
export function PracticeSettings({ playbackGroup = false }: { playbackGroup?: boolean }) {
  return (
    <>
      {playbackGroup && (
        <SettingGroup title="Playback">
          {/* Wrapping, since the two together are a little wider than the sidebar. */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <LoopChip />
            <div className="flex items-center gap-2">
              <ClickToggle />
              <CountInToggle />
            </div>
          </div>
        </SettingGroup>
      )}
      <SettingGroup title="Time">
        <TimeSignatureChoice />
      </SettingGroup>
      <SettingGroup title="Groove">
        <GroovePicker />
        <HihatFootChoice />
        <Swing />
      </SettingGroup>
      <SettingGroup title="Sticking">
        <Choice label="Mode" setting="sticking" options={STICKING_MODES} />
        <Choice label="Lead hand" setting="leadHand" options={LEAD_HANDS} />
        <ResetOverrides />
      </SettingGroup>
    </>
  )
}

/**
 * General: the settings that carry over between the screens, at the foot of the desktop's settings sidebar:
 * the mix, the metronome's sound and volume, and the theme. Its chevron, pointing down, folds it to
 * its heading, remembered on this device, which leaves the screen's own settings above it the room.
 */
export function GeneralSettings() {
  const open = useAppStore((s) => s.device.settingsSectionOpen)
  const setDeviceSettings = useAppStore((s) => s.setDeviceSettings)
  const id = useId()
  const label = open ? 'Fold General' : 'Open General'
  return (
    // At most a little over half the sidebar, scrolling past that, so a short window leaves the screen's own settings room.
    <section aria-labelledby={`${id}-heading`} className="flex max-h-[55%] shrink-0 flex-col gap-3.5 border-t border-line p-3">
      <div className="flex items-start justify-between gap-2">
        <PanelHeading id={`${id}-heading`} className={open ? '' : 'mb-0'}>
          General
        </PanelHeading>
        <button
          type="button"
          aria-label={label}
          aria-expanded={open}
          aria-controls={`${id}-groups`}
          title={label}
          // Keep focus off the button, so Space still plays.
          onMouseDown={keepFocus}
          onClick={() => setDeviceSettings({ settingsSectionOpen: !open })}
          className={`-mt-1 ${chevronButtonClass} ${open ? '' : '[&_svg]:rotate-180'}`}
        >
          <ChevronIcon />
        </button>
      </div>
      {open && (
        <div id={`${id}-groups`} className="-mx-3 flex min-h-0 flex-col gap-3.5 overflow-auto px-3">
          <SettingGroup title="Mix">
            <MixRow layer="click" />
            <MixRow layer="exercise" />
            <MixRow layer="groove" />
          </SettingGroup>
          <SettingGroup title="Metronome">
            <MetronomeSound />
            <MetronomeVolume row />
          </SettingGroup>
          <SettingGroup title="Appearance">
            <LookChoice />
            <ModeChoice />
            <FitNotationChoice />
            <BeatCountSwitch />
          </SettingGroup>
        </div>
      )}
    </section>
  )
}

/** The metronome's click sound, picked from a menu and heard at once. */
function MetronomeSound() {
  const sound = useAppStore((s) => s.device.metronome.sound)
  return (
    <Labelled label="Sound" stacked={false}>
      <SelectMenu label="Click sound" options={SOUND_OPTIONS} value={sound} onChange={pickSound} />
    </Labelled>
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
export function PhoneSettings({ onDone }: { onDone: () => void }) {
  const [tab, setTab] = useState<PhoneTab>('groove')
  const id = useId()
  return (
    <aside aria-label="Settings" className="flex w-full flex-col bg-panel">
      <FullScreenHeading name="Settings" onClose={onDone} className="px-4 pt-3.5 pb-2.5" />
      <div className="flex items-center justify-between gap-3 px-4 pb-3.5">
        <LoopChip />
        <CountInToggle />
      </div>
      <PhoneTabs id={id} tab={tab} onChange={setTab} />
      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${tab}`} className="flex min-h-0 flex-1 flex-col gap-5 overflow-auto px-4 py-5">
        {tab === 'groove' && (
          <>
            <TimeSignatureChoice large />
            <hr className="w-full border-0 border-t border-line" />
            <GroovePicker large />
            <HihatFootChoice large />
            <Swing stacked />
          </>
        )}
        {tab === 'sticking' && (
          <>
            <Choice label="Mode" setting="sticking" options={STICKING_MODES} stacked />
            <Choice label="Lead hand" setting="leadHand" options={LEAD_HANDS} stacked />
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
            <BeatCountSwitch large />
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
function Labelled({
  label,
  title,
  stacked,
  children,
}: {
  label: string
  /** A tooltip on the whole row, saying what the setting does. */
  title?: string
  stacked: boolean
  children: ReactNode
}) {
  if (stacked)
    return (
      <div className="flex flex-col gap-2" title={title}>
        <span className="font-semibold">{label}</span>
        {/* A row, so a control that grows (flex-1) takes the width rather than the height. */}
        <div className="flex">{children}</div>
      </div>
    )
  return (
    <div className="flex items-center gap-2" title={title}>
      <span className="w-20 shrink-0 text-mute">{label}</span>
      {children}
    </div>
  )
}

/**
 * The exercise's time signature, as chips. A change cuts or pads every bar to the new one's beats,
 * as an undoable edit, so it goes through the editor like the sticking settings.
 */
function TimeSignatureChoice({ large = false }: { large?: boolean }) {
  const timeSignature = useAppStore((s) => s.editor.exercise.timeSignature)
  const dispatch = useAppStore((s) => s.dispatch)
  return (
    <div className="flex flex-col gap-2" title="Cuts or pads every bar to the new beats; Ctrl+Z undoes it">
      <div className="flex items-baseline justify-between gap-2">
        <span className={large ? 'font-semibold' : 'text-mute'}>Time signature</span>
        {meter(timeSignature).compound && <span className="text-xs text-mute">beats in threes</span>}
      </div>
      <Segmented
        label="Time signature"
        fill
        className={large ? '' : 'text-xs'}
        options={TIME_SIGNATURES.map((ts) => ({ value: ts, label: ts }))}
        value={timeSignature}
        onChange={(ts: TimeSignature) => dispatch({ type: 'setTimeSignature', timeSignature: ts })}
      />
    </div>
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
  const timeSignature = useAppStore((s) => s.editor.exercise.timeSignature)
  const setHihatFoot = useAppStore((s) => s.setHihatFoot)
  return (
    <Labelled label="Hi-hat foot" title="The hi-hat pedal played under every bar" stacked={large}>
      <SelectMenu
        label="Hi-hat foot"
        large={large}
        options={hihatFootOptions(timeSignature).map((option) => ({ value: option, ...HIHAT_FOOT_OPTIONS[option] }))}
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
  const timeSignature = useAppStore((s) => s.editor.exercise.timeSignature)
  const setSwing = useAppStore((s) => s.setSwing)
  // Compound time's beats are already three eighths, so nothing is swung (ADR 0015).
  if (meter(timeSignature).compound)
    return (
      <div className={stacked ? 'flex flex-col gap-2' : 'flex items-baseline gap-2'}>
        <span className={stacked ? 'font-semibold' : 'text-mute'}>Swing</span>
        <span className="text-xs text-mute">Not used in {timeSignature}: each beat is already three eighths.</span>
      </div>
    )
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

/** What a layer's volume sets, where its name alone doesn't say: a tooltip on its whole row (the mute keeps its own). */
const MIX_TITLES: Partial<Record<Layer, string>> = {
  exercise: "How loud the exercise's own notes play",
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
  const title = MIX_TITLES[layer]
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
      <div className="flex flex-col gap-1" title={title}>
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
    <div className="flex items-center gap-2" title={title}>
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

/** Whether a short exercise grows to fill the desktop's notation card (Fit) or is drawn at its usual size, on this device. */
function FitNotationChoice() {
  const fitNotation = useAppStore((s) => s.device.fitNotation)
  const setDeviceSettings = useAppStore((s) => s.setDeviceSettings)
  return (
    <div className="flex items-center justify-between gap-2" title="Fit draws a short exercise larger, to fill the card">
      <span className="text-mute">Notation</span>
      <Segmented
        label="Notation"
        options={NOTATION_SIZES}
        value={fitNotation}
        onChange={(fit) => setDeviceSettings({ fitNotation: fit })}
      />
    </div>
  )
}

/** Whether the notation card counts the beats while an exercise plays, on this device. */
function BeatCountSwitch({ large = false }: { large?: boolean }) {
  const beatCount = useAppStore((s) => s.device.beatCount)
  const setDeviceSettings = useAppStore((s) => s.setDeviceSettings)
  return (
    <div className="flex items-center justify-between gap-2" title="While an exercise plays, count the beats in the notation's corner">
      <span className={large ? 'font-semibold' : 'text-mute'}>Beat count</span>
      <Switch label="Beat count" labelHidden checked={beatCount} onChange={(on) => setDeviceSettings({ beatCount: on })} />
    </div>
  )
}

const NOTATION_SIZES: SegmentedOption<boolean>[] = [
  { value: true, label: 'Fit' },
  { value: false, label: 'Normal' },
]

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

/** The sticking modes by name, in order; the stored values stay lowercase. */
const STICKING_MODE_LABELS: Record<StickingMode, string> = { natural: 'Natural', alternate: 'Alternate', off: 'Off' }

const STICKING_MODES: SegmentedOption<StickingMode>[] = Object.entries(STICKING_MODE_LABELS).map(([value, label]) => ({
  value: value as StickingMode,
  label,
}))

/** The lead hands, named by their letters as on the staff. */
const LEAD_HANDS: SegmentedOption<Hand>[] = [
  { value: 'R', label: 'R' },
  { value: 'L', label: 'L' },
]

/** A row of buttons choosing one value of an exercise setting; each change is an undoable edit. */
function Choice<K extends keyof ExerciseSettings>({
  label,
  setting,
  options,
  stacked = false,
}: {
  label: string
  setting: K
  options: SegmentedOption<ExerciseSettings[K]>[]
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
        options={options}
        value={value}
        onChange={(option) => dispatch({ type: 'setExerciseSettings', settings: { [setting]: option } })}
      />
    </div>
  )
}
