// The 40 PAS rudiments, built into the app and never stored, read-only like the examples (ADR 0018).
// Our own notation of the standard patterns, each written in a compact text form of hands and marks.

import type { Bar, Exercise, Grace, Hand, Item, Note, TimeSignature } from './model'
import { meter, newExercise, restBar } from './model'
import { setBeat } from './speller'

/** The four families the PAS chart lists the rudiments under, in its order. */
export type RudimentFamily = 'Rolls' | 'Diddles' | 'Flams' | 'Drags'

/** The families in the order the Rudiments tab heads them. */
export const RUDIMENT_FAMILIES: readonly RudimentFamily[] = ['Rolls', 'Diddles', 'Flams', 'Drags']

/**
 * A rudiment as the Rudiments tab lists it: its PAS number, name and family, and the id of its
 * exercise, or null for one not built yet ("coming soon").
 */
export interface RudimentEntry {
  number: number
  name: string
  family: RudimentFamily
  id: string | null
}

/**
 * A rudiment's notes, written bar by bar, each bar's beats separated by spaces. A beat is four
 * sixteenth slots or three triplet-eighth slots: `.` for no hit, or a hand (`R` or `L`, as for a
 * right lead) after its marks: `>` an accent, then its grace hands in lower case as the PAS chart
 * writes them, the other hand (`lR` a flam, `llR` a drag). A hit sounds until the next hit or the
 * end of its beat, so `>R..` is an accented quarter.
 */
interface Written {
  /** 4/4 unless given. */
  timeSignature?: TimeSignature
  bpm: number
  bars: string[]
}

/** One of the PAS 40 as the chart numbers and files it, with its notes once it is built. */
interface Rudiment {
  number: number
  name: string
  family: RudimentFamily
  /** Missing for a rudiment not built yet. */
  written?: Written
}

/** Starts every rudiment's id, so it can never match a stored exercise's UUID. */
const RUDIMENT_PREFIX = 'rudiment:'

const RUDIMENTS: readonly Rudiment[] = [
  { number: 1, name: 'Single stroke roll', family: 'Rolls', written: { bpm: 80, bars: ['RLRL RLRL RLRL RLRL'] } },
  // Written in triplet eighths: the grid has no sixteenth triplets (half the speed per tempo).
  { number: 2, name: 'Single stroke four', family: 'Rolls', written: { bpm: 100, bars: ['RLR >L.. RLR >L..'] } },
  { number: 3, name: 'Single stroke seven', family: 'Rolls', written: { bpm: 100, bars: ['RLR LRL >R.. ...', 'LRL RLR >L.. ...'] } },
  { number: 4, name: 'Multiple bounce roll', family: 'Rolls' },
  { number: 5, name: 'Triple stroke roll', family: 'Rolls' },
  { number: 6, name: 'Double stroke open roll', family: 'Rolls' },
  { number: 7, name: 'Five stroke roll', family: 'Rolls' },
  { number: 8, name: 'Six stroke roll', family: 'Rolls' },
  { number: 9, name: 'Seven stroke roll', family: 'Rolls' },
  { number: 10, name: 'Nine stroke roll', family: 'Rolls' },
  { number: 11, name: 'Ten stroke roll', family: 'Rolls' },
  { number: 12, name: 'Eleven stroke roll', family: 'Rolls' },
  { number: 13, name: 'Thirteen stroke roll', family: 'Rolls' },
  { number: 14, name: 'Fifteen stroke roll', family: 'Rolls' },
  { number: 15, name: 'Seventeen stroke roll', family: 'Rolls' },
  { number: 16, name: 'Single paradiddle', family: 'Diddles', written: { bpm: 80, bars: ['>RLRR >LRLL >RLRR >LRLL'] } },
  { number: 17, name: 'Double paradiddle', family: 'Diddles', written: { bpm: 100, bars: ['>RLR LRR >LRL RLL'] } },
  { number: 18, name: 'Triple paradiddle', family: 'Diddles', written: { bpm: 80, bars: ['>RLRL RLRR >LRLR LRLL'] } },
  { number: 19, name: 'Single paradiddle-diddle', family: 'Diddles', written: { bpm: 100, bars: ['>RLR RLL >RLR RLL'] } },
  { number: 20, name: 'Flam', family: 'Flams', written: { bpm: 80, bars: ['lR.rL. lR.rL. lR.rL. lR.rL.'] } },
  { number: 21, name: 'Flam accent', family: 'Flams', written: { bpm: 80, bars: ['>lRLR >rLRL >lRLR >rLRL'] } },
  { number: 22, name: 'Flam tap', family: 'Flams', written: { bpm: 80, bars: ['>lRR>rLL >lRR>rLL >lRR>rLL >lRR>rLL'] } },
  { number: 23, name: 'Flamacue', family: 'Flams', written: { bpm: 80, bars: ['lR>LRL lR... rL>RLR rL...'] } },
  { number: 24, name: 'Flam paradiddle', family: 'Flams', written: { bpm: 70, bars: ['>lRLRR >rLRLL >lRLRR >rLRLL'] } },
  { number: 25, name: 'Single flammed mill', family: 'Flams', written: { bpm: 70, bars: ['>lRRLR >rLLRL >lRRLR >rLLRL'] } },
  { number: 26, name: 'Flam paradiddle-diddle', family: 'Flams', written: { bpm: 80, bars: ['>lRLR RLL >rLRL LRR'] } },
  { number: 27, name: 'Pataflafla', family: 'Flams', written: { bpm: 70, bars: ['lRLRrL lRLRrL lRLRrL lRLRrL'] } },
  { number: 28, name: 'Swiss army triplet', family: 'Flams', written: { bpm: 80, bars: ['>lRRL >lRRL >lRRL >lRRL'] } },
  { number: 29, name: 'Inverted flam tap', family: 'Flams', written: { bpm: 70, bars: ['>lRL>rLR >lRL>rLR >lRL>rLR >lRL>rLR'] } },
  // An eighth, two sixteenths and an eighth, twice: the PAS chart's 6/8 halves, in 3/4 sixteenths.
  { number: 30, name: 'Flam drag', family: 'Flams', written: { timeSignature: '3/4', bpm: 80, bars: ['>lR.LL R.>rL. RRL.'] } },
  { number: 31, name: 'Drag', family: 'Drags' },
  { number: 32, name: 'Single drag tap', family: 'Drags' },
  { number: 33, name: 'Double drag tap', family: 'Drags' },
  { number: 34, name: 'Lesson 25', family: 'Drags' },
  { number: 35, name: 'Single dragadiddle', family: 'Drags' },
  { number: 36, name: 'Drag paradiddle #1', family: 'Drags' },
  { number: 37, name: 'Drag paradiddle #2', family: 'Drags' },
  { number: 38, name: 'Single ratamacue', family: 'Drags' },
  { number: 39, name: 'Double ratamacue', family: 'Drags' },
  { number: 40, name: 'Triple ratamacue', family: 'Drags' },
]

/** A rudiment's id: the prefix and its name in lower case, words joined by hyphens. */
const idOf = ({ name }: Rudiment) => RUDIMENT_PREFIX + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')

/** The 40 rudiments in PAS order, as the Rudiments tab lists them. */
export function rudimentList(): RudimentEntry[] {
  return RUDIMENTS.map((r) => ({ number: r.number, name: r.name, family: r.family, id: r.written ? idOf(r) : null }))
}

/**
 * The rudiments built so far as exercises, in PAS order, under their fixed ids and never opened;
 * every call gives an equal set. Each note's hand is stored as an override, so it is always
 * printed and the Lead hand mirrors it.
 */
export function rudimentExercises(): Exercise[] {
  return RUDIMENTS.flatMap((rudiment) => {
    const { written } = rudiment
    if (!written) return []
    const { timeSignature = '4/4', bpm, bars } = written
    const base = newExercise({ id: idOf(rudiment), now: 0 })
    return [
      {
        ...base,
        name: rudiment.name,
        timeSignature,
        bars: writeBars(bars, meter(timeSignature).beats),
        sticking: 'alternate',
        practice: { ...base.practice, bpm },
      },
    ]
  })
}

/** Whether an id is one of the rudiments', rather than a stored exercise's or an example's. */
export function isRudiment(id: string): boolean {
  return RUDIMENTS.some((r) => r.written && idOf(r) === id)
}

/** What one struck note of the text form carries besides its rhythm. */
type Struck = Pick<Note, 'override' | 'dynamic' | 'grace'>

/** One slot of a beat: `.`, or a hand after its marks. */
const SLOT = /\.|>?(?:rr?|ll?)?[RL]/g

/** The grace the lower-case hands before a note's hand write: one is a flam and two a drag. */
const GRACES: Record<string, Grace> = { lR: 'flam', rL: 'flam', llR: 'drag', rrL: 'drag' }

/**
 * The bars of `beats` beats: each beat's hits written through the speller, so the spelling is the
 * app's own, then each struck snare note given its hand and marks, in order.
 */
function writeBars(lines: string[], beats: number): Bar[] {
  let bars: Bar[] = lines.map(() => restBar(beats))
  const struck: Struck[] = []
  lines.forEach((line, bar) => {
    line.split(' ').forEach((beat, b) => {
      const slots = beat.match(SLOT) ?? []
      if (slots.join('') !== beat) throw new Error(`Unreadable rudiment beat "${beat}"`)
      bars = setBeat(bars, 'snare', bar, b, slots.map((s) => (s === '.' ? '.' : 'x')).join(''))
      for (const slot of slots) {
        if (slot === '.') continue
        const hand = slot.at(-1) as Hand
        const graces = slot.replace(/^>/, '').slice(0, -1)
        if (graces && !GRACES[graces + hand]) throw new Error(`Grace notes "${graces}" aren't the other hand from ${hand}`)
        struck.push({
          override: hand,
          ...(slot.startsWith('>') ? { dynamic: 'accent' } : {}),
          ...(graces ? { grace: GRACES[graces + hand] } : {}),
        })
      }
    })
  })
  let next = 0
  let previous: Item | undefined
  return bars.map((bar) => ({
    ...bar,
    snare: bar.snare.map((item) => {
      const continuation = item.kind === 'note' && previous?.kind === 'note' && previous.tiedToNext
      previous = item
      return item.kind === 'note' && !continuation ? { ...item, ...struck[next++] } : item
    }),
  }))
}
