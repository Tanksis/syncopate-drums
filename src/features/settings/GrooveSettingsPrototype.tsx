// PROTOTYPE, throwaway (branch prototype/groove-settings): the Groove settings redesign, round 2.
// Variant C won round 1 (A, limb rows, and B, groove cards, are in this branch's history):
//   a Time group (time signature, swing) over a Groove group: one Pattern picker, grouped by style and
//   filtered by the time signature, then the feet as their own pill rows.
// Second question: how the settings groups are headed, switched with ?heading=current|rule|title|card.
// Switch with ?groove=current|C&heading=… or the floating bar at the bottom.
// The time signature is visual only: the notation and audio stay 4/4, and the compound patterns are silent.
// Not for main.

import type { ReactNode } from 'react'
import { useState } from 'react'
import { create } from 'zustand'
import { useAppStore } from '@/app/store'
import { PanelHeading } from '@/components/PanelHeading'
import { ChevronIcon } from '@/components/icons'
import { Segmented } from '@/components/Segmented'
import { Slider } from '@/components/Slider'
import { ValueField } from '@/components/ValueField'
import type { GroovePresetId, HihatFoot } from '@/core'
import { MAX_SWING, MIN_SWING, TRIPLET_SWING } from '@/core'

const VARIANTS = ['current', 'C'] as const
type Variant = (typeof VARIANTS)[number]
const NAMES: Record<Variant, string> = { current: 'Today', C: 'Pattern + feet' }

const SIDEBARS = ['today', 'one'] as const
type Sidebar = (typeof SIDEBARS)[number]
const SIDEBAR_NAMES: Record<Sidebar, string> = { today: 'Today', one: 'One list' }

const HEADINGS = ['current', 'rule', 'title', 'card'] as const
type Heading = (typeof HEADINGS)[number]
const HEADING_NAMES: Record<Heading, string> = { current: 'Today', rule: 'Rule', title: 'Title', card: 'Card' }

type TimeSig = '4/4' | '3/4' | '2/4' | '6/8' | '12/8'
const TIME_SIGS: TimeSig[] = ['4/4', '3/4', '2/4', '6/8', '12/8']
const compound = (ts: TimeSig) => ts === '6/8' || ts === '12/8'

type Pattern = 'off' | 'jazz' | 'hihat8' | 'bell68' | 'shuffle128'
type Bass = 'off' | 'feathered'

function readParam<T extends string>(name: string, options: readonly T[], fallback: T): T {
  const v = new URLSearchParams(location.search).get(name)
  return (options as readonly string[]).includes(v ?? '') ? (v as T) : fallback
}

/** The prototype's own state: the variants, the (visual-only) time signature and the silent compound patterns. */
const useProto = create<{
  variant: Variant
  heading: Heading
  sidebar: Sidebar
  timeSig: TimeSig
  /** A compound pattern, which has no sound yet; null plays the exercise's real groove. */
  silentPattern: Pattern | null
  bass: Bass
  customSwing: boolean
  note: { text: string; undo: () => void } | null
}>(() => ({
  variant: readParam('groove', VARIANTS, 'C'),
  heading: readParam('heading', HEADINGS, 'rule'),
  sidebar: readParam('sidebar', SIDEBARS, 'one'),
  timeSig: '4/4',
  silentPattern: null,
  bass: 'off',
  customSwing: false,
  note: null,
}))

type Param = 'groove' | 'heading' | 'sidebar'
const KEYS: Record<Param, 'variant' | 'heading' | 'sidebar'> = { groove: 'variant', heading: 'heading', sidebar: 'sidebar' }

function setParam(name: Param, value: string) {
  const url = new URL(location.href)
  url.searchParams.set(name, value)
  history.replaceState(history.state, '', url)
  useProto.setState({ [KEYS[name]]: value })
}

export function useSidebarVariant() {
  return useProto((s) => s.sidebar)
}

/** Where the screen's own settings end and the ones shared by both screens begin, in the one-list sidebar. */
export function AllScreensLabel() {
  return (
    <p className="-mb-2 pt-3 text-xs text-mute">For both screens</p>
  )
}

/** The real groove preset a pattern and bass drum stand for, or null when there's none yet. */
function presetFor(pattern: Pattern, bass: Bass): GroovePresetId | null {
  if (pattern === 'off') return 'off'
  if (pattern === 'jazz') return bass === 'feathered' ? 'jazzFeathered' : 'jazz'
  if (pattern === 'hihat8') return 'hihatEighths'
  return null
}

function patternOf(groove: GroovePresetId): Pattern {
  return groove === 'jazz' || groove === 'jazzFeathered' ? 'jazz' : groove === 'hihatEighths' ? 'hihat8' : 'off'
}

/** Picks a pattern and bass drum: the real groove where there is one; a pattern's suggested feet and swing are said, with an undo. */
function usePickGroove() {
  const setGroove = useAppStore((s) => s.setGroove)
  const setSwing = useAppStore((s) => s.setSwing)
  const setHihatFoot = useAppStore((s) => s.setHihatFoot)
  return (pattern: Pattern, bass: Bass) => {
    const before = useAppStore.getState().editor.exercise.practice
    const preset = presetFor(pattern, bass)
    useProto.setState({ bass, silentPattern: preset ? null : pattern })
    setGroove(preset ?? 'off')
    const notes: string[] = []
    // The ride suggests the hi-hat foot on 2 & 4, shown in its own row. The bass drum is left alone.
    if (pattern === 'jazz' && before.hihatFoot === 'off' && patternOf(before.groove) !== 'jazz') {
      setHihatFoot('twoAndFour')
      notes.push('hi-hat foot to 2 & 4')
    }
    const after = useAppStore.getState().editor.exercise.practice
    if (after.swing !== before.swing) notes.push('swing to Triplet')
    if (notes.length === 0) return
    useProto.setState({
      note: {
        text: `Set the ${notes.join(' and the ')}.`,
        undo: () => {
          setSwing(before.swing)
          setHihatFoot(before.hihatFoot)
          useProto.setState({ note: null })
        },
      },
    })
  }
}

function useCurrentPattern(): Pattern {
  const groove = useAppStore((s) => s.editor.exercise.practice.groove)
  const silent = useProto((s) => s.silentPattern)
  return silent ?? patternOf(groove)
}

// ——— group headings, used by every settings group on both screens ———

/** A settings group's heading alone, for groups that lay out their own body (the Metronome's). */
export function ProtoGroupTitle({ children }: { children: ReactNode }) {
  const heading = useProto((s) => s.heading)
  if (heading === 'current') return <PanelHeading>{children}</PanelHeading>
  if (heading === 'title') return <h3 className="mb-1 font-display text-[15px] font-semibold text-ink normal-case">{children}</h3>
  return (
    <h3 className="mb-1 font-display text-[13px] font-bold tracking-wider text-ink [font-variant-caps:var(--heading-caps)] [text-transform:var(--heading-case)]">
      {children}
    </h3>
  )
}

/** A settings group's frame, separating it from the groups around it as the heading variant says. */
export function ProtoFrame({ children }: { children?: ReactNode }) {
  const heading = useProto((s) => s.heading)
  const frame: Record<Heading, string> = {
    current: '',
    rule: 'border-t border-line pt-3',
    title: 'pt-1.5',
    card: 'rounded-lg border border-line bg-card p-2.5',
  }
  return <section className={frame[heading]}>{children}</section>
}

/** A settings group: its heading and its rows, separated from the groups around it as the heading variant says. */
export function ProtoGroup({ title, children }: { title: string; children?: ReactNode }) {
  const heading = useProto((s) => s.heading)
  const frame: Record<Heading, string> = {
    current: 'flex flex-col gap-1.5',
    rule: 'flex flex-col gap-2 border-t border-line pt-3',
    title: 'flex flex-col gap-2 pt-1.5',
    card: 'flex flex-col gap-2 rounded-lg border border-line bg-card p-2.5',
  }
  return (
    <section className={frame[heading]}>
      <ProtoGroupTitle>{title}</ProtoGroupTitle>
      {children}
    </section>
  )
}

/** A sub-heading inside a group (Feet): the small upper-case label, a level under the group's. */
function SubHeading({ children }: { children: ReactNode }) {
  return (
    <h4 className="mt-1 flex items-center gap-2 text-xs font-normal text-mute">
      {children}
      <span className="h-px flex-1 bg-line" />
    </h4>
  )
}

// ——— rows ———

function Row({ label, large, hint, children }: { label: string; large: boolean; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className={large ? 'font-semibold' : 'text-mute'}>{label}</span>
        {hint && <span className="text-xs text-mute">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

/** What picking a pattern also changed, in a quiet line with an undo. */
function Note() {
  const note = useProto((s) => s.note)
  if (!note) return null
  return (
    <p className="flex items-baseline gap-2 text-xs text-mute">
      <span className="flex-1">{note.text}</span>
      <button type="button" className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-accent" onClick={note.undo}>
        Undo
      </button>
      <button type="button" className="cursor-pointer border-0 bg-transparent p-0 text-mute" aria-label="Dismiss" onClick={() => useProto.setState({ note: null })}>
        ✕
      </button>
    </p>
  )
}

function TimeSignature({ large }: { large: boolean }) {
  const timeSig = useProto((s) => s.timeSig)
  const pick = usePickGroove()
  const pattern = useCurrentPattern()
  const bass = useProto((s) => s.bass)
  const hihatFoot = useAppStore((s) => s.editor.exercise.practice.hihatFoot)
  const setHihatFoot = useAppStore((s) => s.setHihatFoot)
  const change = (ts: TimeSig) => {
    useProto.setState({ timeSig: ts, note: null })
    if (!footOptions(ts).some((o) => o.value === hihatFoot)) setHihatFoot('off')
    // A pattern that doesn't fit the new meter is turned off.
    if (!patternsFor(ts).some((g) => g.patterns.some((p) => p.id === pattern))) pick('off', bass)
  }
  return (
    <Row label="Time signature" large={large} hint={compound(timeSig) ? 'beats in threes' : undefined}>
      <Segmented label="Time signature" fill className={large ? '' : 'text-xs'} options={TIME_SIGS.map((ts) => ({ value: ts, label: ts }))} value={timeSig} onChange={change} />
    </Row>
  )
}

const SWING_PRESETS = [
  { name: 'Straight', swing: MIN_SWING },
  { name: 'Triplet', swing: TRIPLET_SWING },
  { name: 'Dotted', swing: 0.75 },
]

/** Straight, Triplet, Dotted, and Custom for anything between, which shows the slider and percent. Hidden in compound time. */
function Swing({ large }: { large: boolean }) {
  const swing = useAppStore((s) => s.editor.exercise.practice.swing)
  const setSwing = useAppStore((s) => s.setSwing)
  const timeSig = useProto((s) => s.timeSig)
  const custom = useProto((s) => s.customSwing)
  if (compound(timeSig))
    return (
      <Row label="Swing" large={large}>
        <span className="text-xs text-mute">Not used in {timeSig}: each beat is already three eighths.</span>
      </Row>
    )
  const preset = SWING_PRESETS.find((p) => Math.abs(p.swing - swing) < 1e-6)
  const showCustom = custom || !preset
  const percent = `${(swing * 100).toFixed(1).replace('.0', '')}%`
  return (
    <Row label="Swing" large={large} hint={showCustom ? undefined : percent}>
      <Segmented
        label="Swing"
        fill
        className={large ? '' : 'text-xs'}
        options={[...SWING_PRESETS.map((p) => ({ value: String(p.swing), label: p.name })), { value: 'custom', label: 'Custom' }]}
        value={showCustom ? 'custom' : String(preset.swing)}
        onChange={(v) => {
          if (v === 'custom') return useProto.setState({ customSwing: true })
          useProto.setState({ customSwing: false })
          setSwing(Number(v))
        }}
      />
      {showCustom && (
        <div className="flex items-center gap-2 pt-1">
          <Slider label="Swing" min={MIN_SWING} max={MAX_SWING} step={0.005} value={swing} reset={MIN_SWING} onChange={setSwing} className="flex-1" />
          <ValueField label="Swing %" value={swing * 100} unit="%" min={50} max={75} decimals={1} onChange={(p) => setSwing(p / 100)} className="w-16 sm:w-14" />
        </div>
      )}
    </Row>
  )
}

/** The hi-hat foot, with only the options that make sense in the meter. */
function footOptions(ts: TimeSig): { value: HihatFoot; label: string; title: string }[] {
  const all = [
    { value: 'off' as const, label: 'Off', title: 'No hi-hat foot' },
    { value: 'one' as const, label: '1', title: 'On beat 1' },
    { value: 'quarters' as const, label: 'Beats', title: 'Every beat' },
    { value: 'twoAndFour' as const, label: '2 & 4', title: 'The backbeat' },
    { value: 'ands' as const, label: '&s', title: 'The off-beats' },
  ]
  if (ts === '4/4') return all
  if (compound(ts)) return all.slice(0, 3)
  return all.filter((o) => o.value !== 'twoAndFour')
}

function HihatFootRow({ large }: { large: boolean }) {
  const hihatFoot = useAppStore((s) => s.editor.exercise.practice.hihatFoot)
  const setHihatFoot = useAppStore((s) => s.setHihatFoot)
  const timeSig = useProto((s) => s.timeSig)
  return (
    <Row label="Hi-hat foot" large={large}>
      <Segmented label="Hi-hat foot" fill className={large ? '' : 'text-xs'} options={footOptions(timeSig)} value={hihatFoot} onChange={setHihatFoot} />
    </Row>
  )
}

// ——— the Pattern picker ———

interface PatternInfo {
  id: Pattern
  name: string
  description: string
  /** x a hit, . a rest, one character per eighth. */
  strip?: string
}

/** The patterns that fit a time signature, grouped by style; only those that exist. */
function patternsFor(ts: TimeSig): { family: string; patterns: PatternInfo[] }[] {
  const none = { family: '', patterns: [{ id: 'off' as const, name: 'None', description: 'Just the click and your exercise.' }] }
  if (ts === '6/8') return [none, { family: 'Afro-Cuban', patterns: [{ id: 'bell68', name: 'Bell', description: 'The 6/8 bell, on cowbell or ride bell.', strip: 'x.xxx.' }] }]
  if (ts === '12/8') return [none, { family: 'Blues', patterns: [{ id: 'shuffle128', name: 'Shuffle', description: 'Ride on the 1st and 3rd of each triplet.', strip: 'x.xx.xx.xx.x' }] }]
  return [
    none,
    { family: 'Jazz', patterns: [{ id: 'jazz', name: 'Ride', description: 'The swing ride: 1, 2 &, 3, 4 &.', strip: 'x.xxx.xx' }] },
    { family: 'Rock & pop', patterns: [{ id: 'hihat8', name: 'Hi-hat 8ths', description: 'Eighths on the closed hi-hat.', strip: 'xxxxxxxx' }] },
  ]
}

function Strip({ strip }: { strip: string }) {
  return (
    <span className="flex shrink-0 gap-[3px]" aria-hidden>
      {[...strip].map((c, i) => (
        <span key={i} className={`size-[5px] rounded-full ${c === 'x' ? 'bg-ink/70' : 'bg-line'}`} />
      ))}
    </span>
  )
}

function PatternPicker({ large }: { large: boolean }) {
  const timeSig = useProto((s) => s.timeSig)
  const pattern = useCurrentPattern()
  const bass = useProto((s) => s.bass)
  const groove = useAppStore((s) => s.editor.exercise.practice.groove)
  const pick = usePickGroove()
  const [open, setOpen] = useState(false)
  const groups = patternsFor(timeSig)
  const current = groups.flatMap((g) => g.patterns).find((p) => p.id === pattern) ?? groups[0].patterns[0]
  const family = groups.find((g) => g.patterns.includes(current))?.family
  const keepBass: Bass = groove === 'jazzFeathered' ? 'feathered' : bass
  return (
    <Row label="Pattern" large={large}>
      <div className="relative flex">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className={`flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 rounded-md border border-edge bg-card text-left text-ink hover:border-accent aria-expanded:border-accent ${large ? 'h-11 px-3' : 'px-2 py-0.5'}`}
        >
          <span className="truncate">
            {current.name}
            {family && <span className="text-mute"> · {family}</span>}
          </span>
          <span className="shrink-0 text-mute">
            <ChevronIcon />
          </span>
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div role="listbox" aria-label="Pattern" className="absolute top-full right-0 left-0 z-50 mt-1 flex max-h-96 flex-col overflow-auto rounded-md border border-edge bg-card py-1 shadow-lg">
              {groups.map((g, i) => (
                <div key={g.family || 'none'} className={`flex flex-col ${i > 0 ? 'mt-1 border-t border-line pt-1' : ''}`}>
                  {g.family && <span className="px-3 pt-1 text-[11px] text-mute">{g.family}</span>}
                  {g.patterns.map((p) => {
                    const on = p === current
                    return (
                      <button
                        key={p.id}
                        type="button"
                        role="option"
                        aria-selected={on}
                        onClick={() => {
                          pick(p.id, keepBass)
                          setOpen(false)
                        }}
                        className={`grid cursor-pointer grid-cols-[1rem_1fr_auto] items-center gap-x-1.5 border-0 bg-transparent px-2 text-left text-ink hover:bg-paper ${large ? 'py-2.5' : 'py-1.5'}`}
                      >
                        <span className="text-accent">{on ? '✓' : ''}</span>
                        <span>{p.name}</span>
                        {p.strip ? <Strip strip={p.strip} /> : <span />}
                        <span />
                        <span className="col-span-2 text-xs text-mute">{p.description}</span>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Row>
  )
}

function GrooveRows({ large }: { large: boolean }) {
  const pattern = useCurrentPattern()
  const bass = useProto((s) => s.bass)
  const groove = useAppStore((s) => s.editor.exercise.practice.groove)
  const pick = usePickGroove()
  const shownBass: Bass = groove === 'jazzFeathered' ? 'feathered' : pattern === 'jazz' ? 'off' : bass
  return (
    <>
      <PatternPicker large={large} />
      <Note />
      <SubHeading>Feet</SubHeading>
      <Row label="Bass drum" large={large} hint={pattern !== 'jazz' && shownBass === 'feathered' ? 'heard with Ride only, for now' : undefined}>
        <Segmented
          label="Bass drum"
          fill
          className={large ? '' : 'text-xs'}
          options={[
            { value: 'off' as const, label: 'Off' },
            { value: 'feathered' as const, label: 'Feathered', title: 'Softly on every beat' },
          ]}
          value={shownBass}
          onChange={(b) => pick(pattern, b)}
        />
      </Row>
      <HihatFootRow large={large} />
    </>
  )
}

/**
 * The Time and Groove groups for the variant being tried. `large` on the phone, where the tab is the
 * group; `current` is today's Groove group.
 */
export function PrototypeGroove({ large = false, current }: { large?: boolean; current: ReactNode }) {
  const variant = useProto((s) => s.variant)
  if (variant === 'current') return <>{current}</>
  if (large)
    return (
      <>
        <TimeSignature large />
        <Swing large />
        <hr className="w-full border-0 border-t border-line" />
        <GrooveRows large />
      </>
    )
  return (
    <>
      <ProtoGroup title="Time">
        <TimeSignature large={false} />
        <Swing large={false} />
      </ProtoGroup>
      <ProtoGroup title="Groove">
        <GrooveRows large={false} />
      </ProtoGroup>
    </>
  )
}

function Cycle<T extends string>({ name, options, value, names, param }: { name: string; options: readonly T[]; value: T; names: Record<T, string>; param: Param }) {
  const go = (step: number) => setParam(param, options[(options.indexOf(value) + step + options.length) % options.length])
  return (
    <span className="flex items-center">
      <button type="button" className="cursor-pointer px-2 py-1" onClick={() => go(-1)} aria-label={`Previous ${name}`}>‹</button>
      <span className="min-w-36 text-center">
        <span className="text-white/60">{name}</span> {names[value]}
      </span>
      <button type="button" className="cursor-pointer px-2 py-1" onClick={() => go(1)} aria-label={`Next ${name}`}>›</button>
    </span>
  )
}

/** The floating bar that switches the variants; dev builds only. */
export function GrooveVariantSwitcher() {
  const variant = useProto((s) => s.variant)
  const heading = useProto((s) => s.heading)
  const sidebar = useProto((s) => s.sidebar)
  const [hidden, setHidden] = useState(false)
  if (!import.meta.env.DEV || hidden) return null
  return (
    <div className="fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-1 rounded-full bg-black px-2 py-1 text-sm whitespace-nowrap text-white shadow-lg">
      <Cycle name="Groove" options={VARIANTS} value={variant} names={NAMES} param="groove" />
      <span className="text-white/30">|</span>
      <Cycle name="Headings" options={HEADINGS} value={heading} names={HEADING_NAMES} param="heading" />
      <span className="text-white/30">|</span>
      <Cycle name="Sidebar" options={SIDEBARS} value={sidebar} names={SIDEBAR_NAMES} param="sidebar" />
      <button type="button" className="cursor-pointer px-1.5 py-1 text-white/50" onClick={() => setHidden(true)} aria-label="Hide">✕</button>
    </div>
  )
}
