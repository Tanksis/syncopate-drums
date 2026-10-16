// PROTOTYPE (2026-10-16), not for main: new-user polish tickets 03–06 and 09, shown in the real app
// so the user can pick before they're specced. Each question is a URL search param, switched from
// the floating panel at the bottom right:
//   welcome  03: how a first visit gets in (today | card | start | banner)
//   copy     03: the phone's Copy button's words (today | edit | mine)
//   empty    03: the Library's empty state; pretends the Library is empty (today | button | panel)
//   rename   04: how renaming shows (today | pencil | field | menu)
//   rows     05: naming the editor's two rows (today | column | legend | inline)
//   size     05: the editor's small controls on desktop (today | large)
//   hint     06: the empty-staff hint (today | above | editor)
//   fit      06: a short exercise in a big card (today | centre | hug | grow)
//   count    09: the beat count while playing (off | corner | bar | strip | fixed | over)
// Nothing here is stored: a dismissed welcome comes back on reload.

import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { create } from 'zustand'
import { useAppStore } from '@/app/store'
import { Button } from '@/components/Button'
import { BEATS_PER_BAR, TICKS_PER_BEAT, exampleExercises, hasHits, isExample } from '@/core'
import { playhead } from '@/features/playback/engine'

const QUESTIONS = {
  welcome: { label: '03 Welcome', options: { today: 'Today', card: 'Card', start: 'Start page', banner: 'Banner' } },
  copy: { label: '03 Phone copy', options: { today: 'Copy', edit: 'Edit a copy', mine: 'Make it mine' } },
  empty: { label: '03 Empty Library', options: { today: 'Today', button: 'Button', panel: 'Panel' } },
  rename: { label: '04 Rename', options: { today: 'Today', pencil: 'Pencil', field: 'Field', menu: 'Menu' } },
  rows: { label: '05 Row names', options: { today: 'Today', column: 'Column', legend: 'Legend', inline: 'Inline' } },
  size: { label: '05 Control size', options: { today: 'Today', large: 'Larger' } },
  hint: { label: '06 Empty hint', options: { today: 'Today', above: 'Above staff', editor: 'In editor' } },
  fit: { label: '06 Short exercise', options: { today: 'Today', centre: 'Centred', hug: 'Card hugs', grow: 'Grow' } },
  count: { label: '09 Beat count', options: { off: 'Off', corner: 'Corner', bar: 'In the bar', strip: 'Strip', fixed: 'Strip, always there', over: 'Strip over the staff' } },
} as const

type Question = keyof typeof QUESTIONS
type Answer<Q extends Question> = keyof (typeof QUESTIONS)[Q]['options']
type Answers = { [Q in Question]: Answer<Q> }

function read<Q extends Question>(q: Q): Answer<Q> {
  const options = Object.keys(QUESTIONS[q].options)
  const v = new URLSearchParams(location.search).get(q) ?? ''
  return (options.includes(v) ? v : options[0]) as Answer<Q>
}

const useProto = create<Answers & { welcomeGone: boolean }>(() => ({
  welcome: read('welcome'),
  copy: read('copy'),
  empty: read('empty'),
  rename: read('rename'),
  rows: read('rows'),
  size: read('size'),
  hint: read('hint'),
  fit: read('fit'),
  count: read('count'),
  welcomeGone: false,
}))

/** One question's current answer. */
export function useAnswer<Q extends Question>(q: Q): Answer<Q> {
  return useProto((s) => s[q]) as unknown as Answer<Q>
}

function setAnswer(q: Question, value: string) {
  const url = new URL(location.href)
  url.searchParams.set(q, value)
  history.replaceState(history.state, '', url)
  useProto.setState({ [q]: value, ...(q === 'welcome' ? { welcomeGone: false } : {}) })
}

// ——— the floating panel ———

export function PolishSwitcher() {
  // Collapsed at first on a phone, where it would cover the transport.
  const [open, setOpen] = useState(() => window.innerWidth >= 640)
  const [hidden, setHidden] = useState(false)
  const answers = useProto()
  if (!import.meta.env.DEV || hidden) return null
  return (
    <div className="fixed top-1 right-14 z-[60] flex sm:top-auto sm:right-3 sm:bottom-3 flex-col gap-0.5 rounded-xl bg-black/90 p-2 text-xs text-white shadow-lg">
      <div className="flex items-center gap-2">
        <button type="button" className="flex-1 cursor-pointer text-left font-bold text-white" onClick={() => setOpen(!open)}>
          Prototype {open ? '▾' : '▴'}
        </button>
        <button type="button" className="cursor-pointer text-white/60" onClick={() => setHidden(true)}>
          Hide
        </button>
      </div>
      {open &&
        (Object.keys(QUESTIONS) as Question[]).map((q) => {
          const keys = Object.keys(QUESTIONS[q].options)
          const options = QUESTIONS[q].options as Record<string, string>
          const i = keys.indexOf(answers[q] as string)
          const go = (d: number) => setAnswer(q, keys[(i + d + keys.length) % keys.length])
          return (
            <div key={q} className="flex items-center gap-1">
              <span className="w-28 text-white/60">{QUESTIONS[q].label}</span>
              <button type="button" className="cursor-pointer px-1.5 text-white" onClick={() => go(-1)} aria-label={`Previous ${q}`}>
                ‹
              </button>
              <span className={`w-24 text-center ${i === 0 ? 'text-white/60' : 'font-semibold text-amber-300'}`}>{options[keys[i]]}</span>
              <button type="button" className="cursor-pointer px-1.5 text-white" onClick={() => go(1)} aria-label={`Next ${q}`}>
                ›
              </button>
            </div>
          )
        })}
    </div>
  )
}

// ——— 03: welcome ———

const EXAMPLES = exampleExercises()
const dismissWelcome = () => useProto.setState({ welcomeGone: true })

function useWelcomeActions(onBrowse: () => void) {
  const createExercise = useAppStore((s) => s.createExercise)
  const setDeviceSettings = useAppStore((s) => s.setDeviceSettings)
  return {
    create: () => {
      createExercise()
      dismissWelcome()
    },
    browse: () => {
      setDeviceSettings({ libraryTab: 'examples' })
      onBrowse()
      dismissWelcome()
    },
  }
}

/** Whether the card or banner shows: an example is open and it hasn't been dismissed. */
function useWelcomeShown(kind: 'card' | 'banner' | 'start') {
  const welcome = useAnswer('welcome')
  const gone = useProto((s) => s.welcomeGone)
  const example = useAppStore((s) => isExample(s.editor.exercise.id))
  return welcome === kind && !gone && (kind === 'start' || example)
}

/** Card: over the notation paper, centred, the example faint behind it. */
export function WelcomeCard({ onBrowse }: { onBrowse: () => void }) {
  const shown = useWelcomeShown('card')
  const { create, browse } = useWelcomeActions(onBrowse)
  if (!shown) return null
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-paper/70 p-4">
      <div className="relative flex max-w-md flex-col gap-3 rounded-card border border-line bg-card p-5 shadow-popover">
        <button type="button" aria-label="Dismiss" onClick={dismissWelcome} className="absolute top-2 right-3 cursor-pointer border-0 bg-transparent text-mute">
          ✕
        </button>
        <h2 className="m-0 font-display text-xl font-bold">Welcome to Syncopate!</h2>
        <p className="m-0 text-mute">
          Write a drum exercise on the grid, see it as notation with the sticking under it, and play along with a groove and a click. This is an example; make your own or try the others.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="lg" onClick={create}>
            New exercise
          </Button>
          <Button size="lg" onClick={browse}>
            Browse examples
          </Button>
        </div>
      </div>
    </div>
  )
}

/** Banner: a strip over the notation card, in place of the read-only notice. */
export function WelcomeBanner({ onBrowse, phone = false }: { onBrowse: () => void; phone?: boolean }) {
  const shown = useWelcomeShown('banner')
  const { create, browse } = useWelcomeActions(onBrowse)
  if (!shown) return null
  return (
    <div className={`flex flex-wrap items-center gap-2 border-b border-line bg-accent-tint px-4 py-2 ${phone ? 'text-sm' : ''}`}>
      <span className="flex-1">
        <b>New here?</b> This is an example, read-only. Make your own, or open another.
      </span>
      <Button variant="primary" onClick={create}>
        New exercise
      </Button>
      <Button onClick={browse}>Examples</Button>
      <button type="button" aria-label="Dismiss" onClick={dismissWelcome} className="cursor-pointer border-0 bg-transparent text-mute">
        ✕
      </button>
    </div>
  )
}

/** Whether the banner shows, which then stands in for the read-only notice. */
export function useBannerShown() {
  return useWelcomeShown('banner')
}

/** Whether the start page takes the notation's place. */
export function useStartPageShown() {
  return useWelcomeShown('start')
}

/** Start page: nothing opened yet; two ways in, in place of the notation and editor. */
export function StartPage({ phone = false }: { phone?: boolean }) {
  const createExercise = useAppStore((s) => s.createExercise)
  const openExercise = useAppStore((s) => s.openExercise)
  return (
    <div className={`flex min-h-0 flex-1 flex-col items-center overflow-auto bg-bg ${phone ? 'p-4' : 'justify-center p-8'}`}>
      <div className="flex w-full max-w-2xl flex-col gap-5">
        <div>
          <h2 className="m-0 font-display text-2xl font-bold">Welcome to Syncopate!</h2>
          <p className="m-0 mt-1 text-mute">Write drum exercises on a grid, read them as notation with the sticking, and play along.</p>
        </div>
        <div className={`grid gap-3 ${phone ? '' : 'grid-cols-2'}`}>
          <button
            type="button"
            onClick={() => {
              createExercise()
              dismissWelcome()
            }}
            className="flex cursor-pointer flex-col gap-2 rounded-card border-2 border-accent bg-card p-5 text-left shadow-card hover:bg-accent-tint"
          >
            <span className="text-3xl text-accent">＋</span>
            <span className="font-display text-lg font-bold">Start a new exercise</span>
            <span className="text-mute">An empty bar of 4/4. Click the grid to add hits.</span>
          </button>
          <div className="flex flex-col gap-1 rounded-card border border-line bg-card p-4 shadow-card">
            <span className="font-display text-lg font-bold">Or try an example</span>
            {EXAMPLES.map((example) => (
              <button
                key={example.id}
                type="button"
                onClick={() => {
                  openExercise(example.id)
                  dismissWelcome()
                }}
                className="cursor-pointer rounded border-0 bg-transparent px-2 py-1.5 text-left hover:bg-select"
              >
                {example.name.replace(/^Example: /, '')} <span className="text-mute">›</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** The phone's Copy button's words. */
export function useCopyLabel(): string {
  const copy = useAnswer('copy')
  return QUESTIONS.copy.options[copy]
}

/** The Library's empty state, given `empty` isn't today: shown in place of the list. */
export function EmptyLibrary({ onNew, onPattern }: { onNew: () => void; onPattern: () => void }) {
  const empty = useAnswer('empty')
  const setDeviceSettings = useAppStore((s) => s.setDeviceSettings)
  const examples = () => setDeviceSettings({ libraryTab: 'examples' })
  if (empty === 'button')
    return (
      <div className="flex flex-col gap-2 px-2 py-1">
        <span className="text-mute">No exercises yet.</span>
        <Button variant="primary" onClick={onNew}>
          New exercise
        </Button>
        <span className="text-xs text-mute">
          Or copy one from{' '}
          <button type="button" onClick={examples} className="cursor-pointer border-0 bg-transparent p-0 text-accent underline">
            Examples
          </button>
          .
        </span>
      </div>
    )
  return (
    <div className="m-1 flex flex-col items-center gap-3 rounded-card border border-dashed border-edge px-3 py-6 text-center">
      <span className="text-3xl text-mute">♩</span>
      <span className="font-semibold">Your exercises go here</span>
      <span className="text-xs text-mute">They're saved on this device.</span>
      <Button variant="primary" onClick={onNew} className="w-full">
        New exercise
      </Button>
      <Button onClick={onPattern} className="w-full">
        New from a sticking pattern…
      </Button>
      <Button variant="ghost" onClick={examples} className="w-full">
        Copy an example
      </Button>
    </div>
  )
}

// ——— 04: rename ———

export const PencilIcon = () => (
  <svg aria-hidden viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-3.5 shrink-0">
    <path d="M10.5 2.5l3 3L6 13H3v-3z" />
    <path d="M9 4l3 3" />
  </svg>
)

// ——— 05: rows ———

/** Legend: over the beat cards, what each row is and its colour. */
export function RowLegend() {
  return (
    <div className="flex items-center gap-4 text-xs text-mute">
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-full bg-ink" /> <b className="text-ink">Snare</b> top row · hands
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-full bg-kick" /> <b className="text-kick">Kick</b> bottom row · feet
      </span>
    </div>
  )
}

// ——— 06: hint ———

/** In editor: the hint over the beat cards, pointing at them. */
export function EditorHint() {
  const hint = useAnswer('hint')
  const empty = useAppStore((s) => !hasHits(s.editor.exercise))
  const example = useAppStore((s) => isExample(s.editor.exercise.id))
  if (hint !== 'editor' || !empty || example) return null
  return (
    <p className="m-0 flex items-center gap-2 rounded-md bg-accent-tint px-3 py-1.5 text-sm">
      <span className="text-accent">↓</span> Click a square to add a hit: the top row is the snare, the bottom row the kick.
    </p>
  )
}

// ——— 09: beat count ———

interface Beat {
  countIn: boolean
  beat: number
}

/** The beat being heard, while the exercise plays. */
function useBeat(): Beat | undefined {
  const playing = useAppStore((s) => s.playing)
  const [now, setNow] = useState<Beat>()
  const last = useRef('')
  useEffect(() => {
    if (!playing) {
      setNow(undefined)
      last.current = ''
      return
    }
    let frame = requestAnimationFrame(function step() {
      const head = playhead()
      if (head) {
        const beat = Math.floor(head.position.tick / TICKS_PER_BEAT)
        const key = `${head.position.bar}:${beat}`
        if (key !== last.current) {
          last.current = key
          setNow({ countIn: head.position.bar < 0, beat })
        }
      }
      frame = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(frame)
  }, [playing])
  return now
}

const reduceMotion = 'motion-reduce:scale-100!'

/** The count's numbers, the current one lit. */
function Numbers({ now, size }: { now: Beat | undefined; size: string }) {
  return (
    <>
      {Array.from({ length: BEATS_PER_BAR }, (_, b) => {
        const on = now?.beat === b
        return (
          <span
            key={b}
            className={`${size} transition-[color,transform] duration-75 ${reduceMotion} ${on ? (b === 0 ? 'scale-150 text-accent' : 'scale-125 text-ink') : 'text-line'}`}
          >
            {b + 1}
          </span>
        )
      })}
    </>
  )
}

/** Corner: the prototype's B, at the notation's top right. */
export function CornerCount({ phone = false }: { phone?: boolean }) {
  const count = useAnswer('count')
  const now = useBeat()
  if (count !== 'corner' || !now) return null
  return (
    <div aria-hidden className={`pointer-events-none absolute z-10 flex items-baseline font-semibold tabular-nums ${phone ? 'top-2 right-3 gap-2' : 'top-3 right-5 gap-3'}`}>
      {now.countIn && <span className="mr-2 text-sm text-mute">count-in</span>}
      <Numbers now={now} size={phone ? 'text-2xl' : 'text-3xl'} />
    </div>
  )
}

/** In the bar: the count in the exercise bar (desktop) or in the phone's header, in place of the name while playing. */
export function BarCount({ children }: { children: ReactNode }) {
  const count = useAnswer('count')
  const now = useBeat()
  if (count !== 'bar' || !now) return children
  return (
    <div aria-hidden className="flex flex-1 items-baseline justify-center gap-3 font-semibold tabular-nums">
      {now.countIn && <span className="text-xs text-mute">count-in</span>}
      <Numbers now={now} size="text-2xl/none" />
    </div>
  )
}

/** Strip: a row of beat blocks across the top of the notation card, like the Metronome's. */
export function StripCount() {
  const count = useAnswer('count')
  const now = useBeat()
  // strip: appears on Play and pushes the staff down. fixed: always there, dim
  // when stopped, so nothing moves. over: floats over the top of the card.
  if (count !== 'strip' && count !== 'fixed' && count !== 'over') return null
  if (!now && count !== 'fixed') return null
  const place = count === 'over' ? 'absolute inset-x-0 top-0 z-10 bg-paper/90 backdrop-blur-sm sm:left-14' : 'shrink-0 bg-paper'
  return (
    <div aria-hidden className={`flex gap-1.5 border-b border-line px-3 py-1.5 ${place}`}>
      {Array.from({ length: BEATS_PER_BAR }, (_, b) => {
        const on = now?.beat === b
        return (
          <span
            key={b}
            className={`flex h-7 flex-1 items-center justify-center rounded-md text-sm font-bold transition-colors duration-75 ${
              on ? (b === 0 ? 'bg-accent text-on-accent' : 'bg-ink text-paper') : 'bg-line/50 text-mute'
            }`}
          >
            {now?.countIn && b === 0 && !on ? 'count-in' : b + 1}
          </span>
        )
      })}
    </div>
  )
}
