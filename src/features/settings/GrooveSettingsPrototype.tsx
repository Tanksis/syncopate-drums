// PROTOTYPE, throwaway (branch prototype/groove-settings): the Groove settings redesign, with a Time
// group (time signature, swing) above a Groove group. Switch with ?groove=current|A|B or the floating
// bar at the bottom.
//   A: one row of chips per limb (Cymbal, Bass drum, Hi-hat foot).
//   B: named groove cards with a one-line description and a mini pattern strip.
// The time signature is visual only: the notation and audio stay 4/4, and the compound grooves are silent.
// Not for main.

import { useState } from 'react'
import { create } from 'zustand'
import { useAppStore } from '@/app/store'
import { PanelHeading } from '@/components/PanelHeading'
import { ChevronIcon } from '@/components/icons'
import { Segmented } from '@/components/Segmented'
import { Slider } from '@/components/Slider'
import { ValueField } from '@/components/ValueField'
import type { GroovePresetId, HihatFoot } from '@/core'
import { MAX_SWING, MIN_SWING, TICKS_PER_BEAT, TRIPLET_SWING, grooveHitsByTick } from '@/core'

const VARIANTS = ['current', 'A', 'B', 'C'] as const
type Variant = (typeof VARIANTS)[number]
const NAMES: Record<Variant, string> = { current: 'Current (today)', A: 'Limb rows', B: 'Groove cards', C: 'Pattern picker + feet' }

type TimeSig = '4/4' | '3/4' | '2/4' | '6/8' | '12/8'
const TIME_SIGS: TimeSig[] = ['4/4', '3/4', '2/4', '6/8', '12/8']
const compound = (ts: TimeSig) => ts === '6/8' || ts === '12/8'

type Cymbal = 'off' | 'jazz' | 'hihat8' | 'bell68' | 'shuffle128'
type Bass = 'off' | 'feathered'

function readVariant(): Variant {
  const v = new URLSearchParams(location.search).get('groove')
  return (VARIANTS as readonly string[]).includes(v ?? '') ? (v as Variant) : 'A'
}

/** The prototype's own state: the variant, the (visual-only) time signature and the silent compound grooves. */
const useProto = create<{
  variant: Variant
  timeSig: TimeSig
  /** A compound groove, which has no sound yet; null plays the exercise's real groove. */
  silentCymbal: Cymbal | null
  bass: Bass
  customSwing: boolean
  note: { text: string; undo: () => void } | null
}>(() => ({ variant: readVariant(), timeSig: '4/4', silentCymbal: null, bass: 'off', customSwing: false, note: null }))

function setVariant(variant: Variant) {
  const url = new URL(location.href)
  url.searchParams.set('groove', variant)
  history.replaceState(history.state, '', url)
  useProto.setState({ variant })
}

export function useGrooveVariant() {
  return useProto((s) => s.variant)
}

/** The real groove preset a cymbal and bass drum stand for, or null when there's none yet. */
function presetFor(cymbal: Cymbal, bass: Bass): GroovePresetId | null {
  if (cymbal === 'off') return 'off'
  if (cymbal === 'jazz') return bass === 'feathered' ? 'jazzFeathered' : 'jazz'
  if (cymbal === 'hihat8') return 'hihatEighths'
  return null
}

function cymbalOf(groove: GroovePresetId): Cymbal {
  return groove === 'jazz' || groove === 'jazzFeathered' ? 'jazz' : groove === 'hihatEighths' ? 'hihat8' : 'off'
}

/** Picks a cymbal and bass drum: the real groove where there is one, with the Q1/Q2 behaviours made visible. */
function usePickGroove() {
  const setGroove = useAppStore((s) => s.setGroove)
  const setSwing = useAppStore((s) => s.setSwing)
  const setHihatFoot = useAppStore((s) => s.setHihatFoot)
  return (cymbal: Cymbal, bass: Bass) => {
    const before = useAppStore.getState().editor.exercise.practice
    const preset = presetFor(cymbal, bass)
    useProto.setState({ bass, silentCymbal: preset ? null : cymbal })
    setGroove(preset ?? 'off')
    const notes: string[] = []
    // Q1: the jazz ride brings the hi-hat foot on 2 & 4 with it, shown in its own row.
    if (cymbal === 'jazz' && before.hihatFoot === 'off' && cymbalOf(before.groove) !== 'jazz') {
      setHihatFoot('twoAndFour')
      notes.push('hi-hat foot on 2 & 4')
    }
    const after = useAppStore.getState().editor.exercise.practice
    // Q2: the swing it turns on is said, with an undo.
    if (after.swing !== before.swing) notes.push('swing to Triplet')
    if (notes.length === 0) return
    useProto.setState({
      note: {
        text: `Jazz ride: set ${notes.join(' and ')}.`,
        undo: () => {
          setSwing(before.swing)
          setHihatFoot(before.hihatFoot)
          useProto.setState({ note: null })
        },
      },
    })
  }
}

function useCurrentCymbal(): Cymbal {
  const groove = useAppStore((s) => s.editor.exercise.practice.groove)
  const silent = useProto((s) => s.silentCymbal)
  return silent ?? cymbalOf(groove)
}

// ——— shared bits ———

function Row({ label, large, hint, children }: { label: string; large: boolean; hint?: string; children: React.ReactNode }) {
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

function Note() {
  const note = useProto((s) => s.note)
  if (!note) return null
  return (
    <div className="flex items-center justify-between gap-2 rounded border border-line bg-paper px-2 py-1.5 text-xs">
      <span>{note.text}</span>
      <span className="flex shrink-0 gap-2">
        <button type="button" className="cursor-pointer font-semibold text-accent" onClick={note.undo}>Undo</button>
        <button type="button" className="cursor-pointer text-mute" aria-label="Dismiss" onClick={() => useProto.setState({ note: null })}>✕</button>
      </span>
    </div>
  )
}

function TimeSignature({ large }: { large: boolean }) {
  const timeSig = useProto((s) => s.timeSig)
  const pick = usePickGroove()
  const cymbal = useCurrentCymbal()
  const bass = useProto((s) => s.bass)
  const hihatFoot = useAppStore((s) => s.editor.exercise.practice.hihatFoot)
  const setHihatFoot = useAppStore((s) => s.setHihatFoot)
  const change = (ts: TimeSig) => {
    useProto.setState({ timeSig: ts, note: null })
    if (!footOptions(ts).some((o) => o.value === hihatFoot)) setHihatFoot('off')
    // A groove that doesn't fit the new meter is turned off.
    if (!cymbalsFor(ts).includes(cymbal)) pick('off', bass)
  }
  return (
    <Row label="Time signature" large={large} hint={compound(timeSig) ? 'beats in threes' : undefined}>
      <Segmented label="Time signature" fill className={large ? '' : 'text-xs'} options={TIME_SIGS.map((ts) => ({ value: ts, label: ts }))} value={timeSig} onChange={change} />
    </Row>
  )
}

const SWING_PRESETS = [
  { name: 'Straight', swing: MIN_SWING },
  { name: 'Light', swing: 0.58 },
  { name: 'Medium', swing: 0.62 },
  { name: 'Triplet', swing: TRIPLET_SWING },
  { name: 'Dotted', swing: 0.75 },
]

/** Q4: chips, with Custom showing the slider and percent. Hidden in compound time. */
function SwingChips({ large }: { large: boolean }) {
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
  // On the phone Custom is a sixth chip; in the narrow desktop sidebar it's a link by the percent.
  const options = [...SWING_PRESETS.map((p) => ({ value: String(p.swing), label: p.name })), ...(large ? [{ value: 'custom', label: 'Custom' }] : [])]
  const percent = `${(swing * 100).toFixed(1).replace('.0', '')}%`
  const hint = large ? (showCustom ? undefined : percent) : undefined
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className={large ? 'font-semibold' : 'text-mute'}>Swing</span>
        {hint && <span className="text-xs text-mute">{hint}</span>}
        {!large && (
          <span className="flex shrink-0 items-center gap-1.5">
            {!showCustom && <span className="text-xs text-mute tabular-nums">{percent}</span>}
            <button
              type="button"
              aria-pressed={showCustom}
              className="cursor-pointer rounded-full border border-line bg-transparent px-2 py-px text-xs hover:border-accent aria-pressed:border-accent aria-pressed:text-accent"
              onClick={() => useProto.setState({ customSwing: !showCustom })}
            >
              {showCustom ? 'Done' : 'Custom'}
            </button>
          </span>
        )}
      </div>
      <Segmented
        label="Swing"
        fill
        className={large ? 'text-sm' : 'text-xs'}
        options={options}
        value={showCustom && large ? 'custom' : preset ? String(preset.swing) : null}
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
    </div>
  )
}

function TimeGroup({ large }: { large: boolean }) {
  return (
    <>
      <TimeSignature large={large} />
      <SwingChips large={large} />
      {!large && <p className="text-xs text-mute italic">Prototype: the time signature is visual only.</p>}
    </>
  )
}

function cymbalsFor(ts: TimeSig): Cymbal[] {
  if (ts === '6/8') return ['off', 'bell68']
  if (ts === '12/8') return ['off', 'shuffle128']
  return ['off', 'jazz', 'hihat8']
}

const CYMBAL_NAMES: Record<Cymbal, string> = { off: 'Off', jazz: 'Jazz ride', hihat8: 'Hi-hat 8ths', bell68: 'Bell', shuffle128: 'Shuffle ride' }

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

// ——— Variant A: one row per limb ———

function VariantA({ large }: { large: boolean }) {
  const timeSig = useProto((s) => s.timeSig)
  const cymbal = useCurrentCymbal()
  const bass = useProto((s) => s.bass)
  const groove = useAppStore((s) => s.editor.exercise.practice.groove)
  const pick = usePickGroove()
  // The real bass drum, where the exercise's groove has one.
  const shownBass: Bass = groove === 'jazzFeathered' ? 'feathered' : cymbal === 'jazz' ? 'off' : bass
  return (
    <>
      <Row label="Cymbal" large={large} hint={cymbal === 'bell68' || cymbal === 'shuffle128' ? 'silent in the prototype' : undefined}>
        <Segmented
          label="Cymbal"
          fill
          className={large ? '' : 'text-xs'}
          options={cymbalsFor(timeSig).map((c) => ({ value: c, label: CYMBAL_NAMES[c] }))}
          value={cymbal}
          onChange={(c) => pick(c, shownBass)}
        />
      </Row>
      <Row label="Bass drum" large={large} hint={cymbal !== 'jazz' && shownBass === 'feathered' ? 'heard with Jazz ride only, for now' : undefined}>
        <Segmented
          label="Bass drum"
          fill
          className={large ? '' : 'text-xs'}
          options={[
            { value: 'off' as const, label: 'Off' },
            { value: 'feathered' as const, label: 'Feathered', title: 'Softly on every beat' },
          ]}
          value={shownBass}
          onChange={(b) => pick(cymbal, b)}
        />
      </Row>
      <HihatFootRow large={large} />
    </>
  )
}

// ——— Variant B: groove cards ———

interface Card {
  id: string
  cymbal: Cymbal
  bass: Bass
  name: string
  description: string
  /** Lanes of the mini strip: one string per lane, x a hit, . a rest, one character per eighth. */
  strip?: { cymbal: string; foot: string; bass: string }
}

/** The mini strip of a real preset, read from its hits: one cell per eighth in a 4/4 bar. */
function stripOf(id: GroovePresetId) {
  const lanes = { cymbal: '', foot: '', bass: '' }
  const hits = grooveHitsByTick(id)
  for (let i = 0; i < 8; i++) {
    const at = hits.get((i * TICKS_PER_BEAT) / 2) ?? []
    lanes.cymbal += at.some((h) => h.instrument === 'ride' || h.instrument === 'hihatClosed') ? 'x' : '.'
    lanes.foot += at.some((h) => h.instrument === 'hihatPedal') ? 'x' : '.'
    lanes.bass += at.some((h) => h.instrument === 'kickFeathered') ? 'x' : '.'
  }
  return lanes
}

function cardsFor(ts: TimeSig): Card[] {
  const off: Card = { id: 'off', cymbal: 'off', bass: 'off', name: 'None', description: 'Just the click and your exercise.' }
  if (ts === '6/8')
    return [off, { id: 'bell68', cymbal: 'bell68', bass: 'off', name: '6/8 bell', description: 'Afro-Cuban bell pattern.', strip: { cymbal: 'x.xxx.', foot: '......', bass: '......' } }]
  if (ts === '12/8')
    return [off, { id: 'shuffle128', cymbal: 'shuffle128', bass: 'off', name: '12/8 shuffle', description: 'Shuffle ride, the middle triplet left out.', strip: { cymbal: 'x.xx.xx.xx.x', foot: '...x.....x..', bass: '' } }]
  return [
    off,
    { id: 'jazz', cymbal: 'jazz', bass: 'off', name: 'Jazz', description: 'Ride “spang-a-lang”, hi-hat foot on 2 & 4.', strip: stripOf('jazz') },
    { id: 'jazzFeathered', cymbal: 'jazz', bass: 'feathered', name: 'Jazz, feathered', description: 'Jazz, plus a soft bass drum on every beat.', strip: stripOf('jazzFeathered') },
    { id: 'hihat8', cymbal: 'hihat8', bass: 'off', name: 'Rock 8ths', description: 'Straight eighths on the closed hi-hat.', strip: stripOf('hihatEighths') },
  ]
}

function Strip({ strip }: { strip: NonNullable<Card['strip']> }) {
  const lanes = [strip.cymbal, strip.foot, strip.bass].filter((l) => l && l.includes('x'))
  return (
    <div className="flex flex-col gap-0.5" aria-hidden>
      {lanes.map((lane, i) => (
        <div key={i} className="flex gap-0.5">
          {[...lane].map((c, j) => (
            <span key={j} className={`h-1.5 w-2.5 rounded-sm ${c === 'x' ? 'bg-accent' : 'bg-line'}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

function VariantB({ large }: { large: boolean }) {
  const timeSig = useProto((s) => s.timeSig)
  const groove = useAppStore((s) => s.editor.exercise.practice.groove)
  const silent = useProto((s) => s.silentCymbal)
  const pick = usePickGroove()
  const chosen = silent ?? (groove === 'hihatEighths' ? 'hihat8' : groove)
  return (
    <>
      <div role="radiogroup" aria-label="Groove" className="flex flex-col gap-1.5">
        {cardsFor(timeSig).map((card) => {
          const on = card.id === chosen
          return (
            <button
              key={card.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => pick(card.cymbal, card.bass)}
              className={`flex cursor-pointer items-center gap-2 rounded border px-2.5 text-left ${large ? 'py-2.5' : 'py-1.5'} ${on ? 'border-accent bg-paper' : 'border-line bg-transparent'}`}
            >
              <span className={`size-3 shrink-0 rounded-full border-2 ${on ? 'border-accent bg-accent' : 'border-line'}`} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-semibold">{card.name}</span>
                <span className="text-xs text-mute">{card.description}</span>
                {card.strip && <span className="pt-1"><Strip strip={card.strip} /></span>}
              </span>
            </button>
          )
        })}
      </div>
      <HihatFootRow large={large} />
    </>
  )
}

// ——— Variant C: one pattern picker (grouped, scalable), then the feet as their own pill rows ———
// The pattern is the hands' time-keeping only. The feet are separate settings, always shown: a pattern
// suggests its feet when picked (jazz: hi-hat foot 2 & 4), said in the note, and nothing hides them.

interface Style {
  id: string
  cymbal: Cymbal | null
  name: string
  description: string
  strip?: string
  /** Not built yet: shown to judge how the list grows. */
  later?: boolean
}

function stylesFor(ts: TimeSig): { family: string; styles: Style[] }[] {
  const none = { family: '', styles: [{ id: 'off', cymbal: 'off' as Cymbal, name: 'None', description: 'Just the click and your exercise.' }] }
  if (ts === '6/8')
    return [none, { family: 'Afro-Cuban', styles: [{ id: 'bell68', cymbal: 'bell68', name: '6/8 bell', description: 'The short bell pattern, on cowbell or ride bell.', strip: 'x.xxx.' }] }]
  if (ts === '12/8')
    return [
      none,
      { family: 'Blues', styles: [{ id: 'shuffle128', cymbal: 'shuffle128', name: 'Shuffle', description: 'Ride on the 1st and 3rd of each triplet.', strip: 'x.xx.xx.xx.x' }] },
      { family: 'Afro-Cuban', styles: [{ id: 'bell128', cymbal: null, name: '12/8 bell', description: 'The long (bembé) bell pattern.', strip: 'x.x.xx.x.x.x', later: true }] },
    ]
  if (ts === '3/4')
    return [none, { family: 'Jazz', styles: [{ id: 'waltz', cymbal: null, name: 'Jazz waltz', description: 'The ride pattern in three.', strip: 'x.xx.x', later: true }] }]
  return [
    none,
    {
      family: 'Jazz',
      styles: [
        { id: 'jazz', cymbal: 'jazz', name: 'Ride', description: 'The swing ride pattern: 1, 2 &, 3, 4 &.', strip: 'x.xxx.xx' },
        { id: 'twofeel', cymbal: null, name: 'Two feel', description: 'Ride on 1 and 3, for ballads.', strip: 'x...x...', later: true },
      ],
    },
    {
      family: 'Rock & pop',
      styles: [
        { id: 'hihat8', cymbal: 'hihat8', name: 'Hi-hat 8ths', description: 'Straight eighths on the closed hi-hat.', strip: 'xxxxxxxx' },
        { id: 'hihat16', cymbal: null, name: 'Hi-hat 16ths', description: 'Funk sixteenths, one hand.', strip: 'xxxxxxxx', later: true },
      ],
    },
    {
      family: 'Latin',
      styles: [{ id: 'bossa', cymbal: null, name: 'Bossa nova', description: 'Eighths on the ride over a cross-stick clave.', strip: 'xxxxxxxx', later: true }],
    },
  ]
}

function MiniStrip({ strip }: { strip: string }) {
  return (
    <span className="flex gap-0.5" aria-hidden>
      {[...strip].map((c, i) => (
        <span key={i} className={`h-1.5 w-2 rounded-sm ${c === 'x' ? 'bg-accent' : 'bg-line'}`} />
      ))}
    </span>
  )
}

function PatternPicker({ large }: { large: boolean }) {
  const timeSig = useProto((s) => s.timeSig)
  const cymbal = useCurrentCymbal()
  const bass = useProto((s) => s.bass)
  const groove = useAppStore((s) => s.editor.exercise.practice.groove)
  const pick = usePickGroove()
  const [open, setOpen] = useState(false)
  const groups = stylesFor(timeSig)
  const current = groups.flatMap((g) => g.styles).find((s) => s.cymbal === cymbal) ?? groups[0].styles[0]
  const family = groups.find((g) => g.styles.includes(current))?.family
  const keepBass: Bass = groove === 'jazzFeathered' ? 'feathered' : bass
  return (
    <div className="relative flex flex-col gap-1">
      <span className={large ? 'font-semibold' : 'text-mute'}>Pattern</span>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={`flex cursor-pointer items-center gap-2 rounded border border-line bg-paper px-2.5 text-left hover:border-accent ${large ? 'py-2.5' : 'py-1.5'}`}
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-semibold">
            {family && <span className="font-normal text-mute">{family} · </span>}
            {current.name}
          </span>
          {current.strip && (
            <span className="pt-1">
              <MiniStrip strip={current.strip} />
            </span>
          )}
        </span>
        <span className={`text-mute ${open ? 'rotate-180' : ''}`}>
          <ChevronIcon />
        </span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div role="listbox" aria-label="Pattern" className="absolute top-full right-0 left-0 z-50 mt-1 flex max-h-96 flex-col overflow-auto rounded border border-line bg-panel py-1 shadow-lg">
            {groups.map((g) => (
              <div key={g.family || 'none'} className="flex flex-col">
                {g.family && <span className="px-2.5 pt-2 pb-0.5 text-xs font-semibold tracking-wide text-mute uppercase">{g.family}</span>}
                {g.styles.map((st) => {
                  const on = st === current
                  return (
                    <button
                      key={st.id}
                      type="button"
                      role="option"
                      aria-selected={on}
                      disabled={st.later}
                      onClick={() => {
                        if (!st.cymbal) return
                        pick(st.cymbal, keepBass)
                        setOpen(false)
                      }}
                      className={`flex cursor-pointer flex-col gap-0.5 border-0 px-2.5 py-1.5 text-left disabled:cursor-default disabled:opacity-45 ${on ? 'bg-paper' : 'bg-transparent hover:bg-paper'}`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className={on ? 'font-semibold text-accent' : 'font-semibold'}>
                          {st.name}
                          {st.later && <span className="font-normal text-mute"> · later</span>}
                        </span>
                        {st.strip && <MiniStrip strip={st.strip} />}
                      </span>
                      <span className="text-xs text-mute">{st.description}</span>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function VariantC({ large }: { large: boolean }) {
  const cymbal = useCurrentCymbal()
  const bass = useProto((s) => s.bass)
  const groove = useAppStore((s) => s.editor.exercise.practice.groove)
  const pick = usePickGroove()
  const shownBass: Bass = groove === 'jazzFeathered' ? 'feathered' : cymbal === 'jazz' ? 'off' : bass
  return (
    <>
      <PatternPicker large={large} />
      <span className="pt-1 text-xs font-semibold tracking-wide text-mute uppercase">Feet</span>
      <Row label="Bass drum" large={large} hint={cymbal !== 'jazz' && shownBass === 'feathered' ? 'heard with Jazz ride only, for now' : undefined}>
        <Segmented
          label="Bass drum"
          fill
          className={large ? '' : 'text-xs'}
          options={[
            { value: 'off' as const, label: 'Off' },
            { value: 'feathered' as const, label: 'Feathered', title: 'Softly on every beat' },
          ]}
          value={shownBass}
          onChange={(b) => pick(cymbal, b)}
        />
      </Row>
      <HihatFootRow large={large} />
    </>
  )
}

/**
 * The Time and Groove groups for the variant being tried. `large` on the phone; `Group` wraps each
 * group in the desktop sidebar's heading.
 */
export function PrototypeGroove({ large = false, current }: { large?: boolean; current: React.ReactNode }) {
  const variant = useGrooveVariant()
  if (variant === 'current') return <>{current}</>
  const groove = variant === 'A' ? <VariantA large={large} /> : variant === 'B' ? <VariantB large={large} /> : <VariantC large={large} />
  if (large)
    return (
      <>
        <TimeGroup large />
        <hr className="border-line" />
        {groove}
        <Note />
      </>
    )
  return (
    <>
      <section className="flex flex-col gap-2.5">
        <PanelHeading>Time</PanelHeading>
        <TimeGroup large={false} />
      </section>
      <section className="flex flex-col gap-2.5">
        <PanelHeading>Groove</PanelHeading>
        {groove}
        <Note />
      </section>
    </>
  )
}

/** The floating bar that switches the variant; dev builds only. */
export function GrooveVariantSwitcher() {
  const variant = useGrooveVariant()
  const [hidden, setHidden] = useState(false)
  if (!import.meta.env.DEV || hidden) return null
  const go = (step: number) => setVariant(VARIANTS[(VARIANTS.indexOf(variant) + step + VARIANTS.length) % VARIANTS.length])
  return (
    <div className="fixed bottom-40 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-1 rounded-full bg-black px-2 py-1 text-sm text-white shadow-lg sm:bottom-4">
      <button type="button" className="cursor-pointer px-2 py-1" onClick={() => go(-1)} aria-label="Previous variant">‹</button>
      <span className="min-w-44 text-center">Groove {variant === 'current' ? '' : `${variant} · `}{NAMES[variant]}</span>
      <button type="button" className="cursor-pointer px-2 py-1" onClick={() => go(1)} aria-label="Next variant">›</button>
      <button type="button" className="cursor-pointer px-1.5 py-1 text-white/50" onClick={() => setHidden(true)} aria-label="Hide">✕</button>
    </div>
  )
}
