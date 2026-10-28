// The 40 PAS rudiments, built into the app and never stored, read-only like the examples (ADR 0018).
// Our own notation of the standard patterns, each written in a compact text form of hands and marks.

import type { Bar, Exercise, Grace, Hand, Item, Note, Roll, TimeSignature } from './model'
import { GRACE_NOTES, meter, newExercise, restBar } from './model'
import { setBeat } from './speller'
import { opposite } from './sticking'

/** The four families the PAS chart lists the rudiments under, in its order. */
export type RudimentFamily = 'Rolls' | 'Diddles' | 'Flams' | 'Drags'

/** The families in the order the Rudiments tab heads them. */
export const RUDIMENT_FAMILIES: readonly RudimentFamily[] = ['Rolls', 'Diddles', 'Flams', 'Drags']

/** A rudiment as the Rudiments tab lists it: its PAS number, name and family, and the id of its exercise. */
export interface RudimentEntry {
  number: number
  name: string
  family: RudimentFamily
  id: string
}

/**
 * A rudiment's notes, written bar by bar, each bar's beats separated by spaces. A beat is four
 * sixteenth slots or three triplet-eighth slots: `.` for no hit, or a hand (`R` or `L`, as for a
 * right lead) after its marks: `>` an accent, then `/` a double or `z` a buzz, then its grace hands
 * in lower case as the PAS chart writes them, the other hand (`lR` a flam, `llR` a drag). A hit sounds until the next hit or the
 * end of its beat, so `>R..` is an accented quarter, and `~` first in a beat ties the hit before
 * on into it.
 */
interface Written {
  /** 4/4 unless given. */
  timeSignature?: TimeSignature
  bpm: number
  bars: string[]
}

/** One of the PAS 40 as the chart numbers and files it, with its notes. */
interface Rudiment {
  number: number
  name: string
  family: RudimentFamily
  written: Written
}

/** Starts every rudiment's id, so it can never match a stored exercise's UUID. */
const RUDIMENT_PREFIX = 'rudiment:'

const RUDIMENTS: readonly Rudiment[] = [
  { number: 1, name: 'Single stroke roll', family: 'Rolls', written: { bpm: 80, bars: ['RLRL RLRL RLRL RLRL'] } },
  // Written in triplet eighths: the grid has no sixteenth triplets (half the speed per tempo).
  { number: 2, name: 'Single stroke four', family: 'Rolls', written: { bpm: 100, bars: ['RLR >L.. RLR >L..'] } },
  { number: 3, name: 'Single stroke seven', family: 'Rolls', written: { bpm: 100, bars: ['RLR LRL >R.. ...', 'LRL RLR >L.. ...'] } },
  { number: 4, name: 'Multiple bounce roll', family: 'Rolls', written: { bpm: 70, bars: ['zRzLzRzL zRzLzRzL zRzLzRzL zRzLzRzL'] } },
  // In triplet eighths, as the paradiddle-diddle is: the chart's sixteenth triplets.
  { number: 5, name: 'Triple stroke roll', family: 'Rolls', written: { bpm: 100, bars: ['RRR LLL RRR LLL'] } },
  // The doubles of the rolls from here on are slashed eighths, two sixteenths each, the release accented.
  { number: 6, name: 'Double stroke open roll', family: 'Rolls', written: { bpm: 80, bars: ['/R./L. /R./L. /R./L. /R./L.'] } },
  { number: 7, name: 'Five stroke roll', family: 'Rolls', written: { bpm: 80, bars: ['/R./L. >R... /L./R. >L...'] } },
  { number: 8, name: 'Six stroke roll', family: 'Rolls', written: { bpm: 80, bars: ['>R./L. /R.>L. >R./L. /R.>L.'] } },
  // In triplet eighths, as the single stroke four is: the chart's sixteenth triplets.
  { number: 9, name: 'Seven stroke roll', family: 'Rolls', written: { bpm: 100, bars: ['/R/L/R >L.. /L/R/L >R..'] } },
  { number: 10, name: 'Nine stroke roll', family: 'Rolls', written: { timeSignature: '3/4', bpm: 80, bars: ['/R./L. /R./L. >R...'] } },
  { number: 11, name: 'Ten stroke roll', family: 'Rolls', written: { timeSignature: '3/4', bpm: 80, bars: ['/R./L. /R./L. >R.>L.'] } },
  { number: 12, name: 'Eleven stroke roll', family: 'Rolls', written: { timeSignature: '3/4', bpm: 80, bars: ['/R./L. /R./L. /R.>L.', '/L./R. /L./R. /L.>R.'] } },
  { number: 13, name: 'Thirteen stroke roll', family: 'Rolls', written: { bpm: 80, bars: ['/R./L. /R./L. /R./L. >R...'] } },
  { number: 14, name: 'Fifteen stroke roll', family: 'Rolls', written: { bpm: 80, bars: ['/R./L. /R./L. /R./L. /R.>L.', '/L./R. /L./R. /L./R. /L.>R.'] } },
  // Eight doubles and the release are five beats, so two bars of 3/4 with a beat's rest.
  { number: 15, name: 'Seventeen stroke roll', family: 'Rolls', written: { timeSignature: '3/4', bpm: 80, bars: ['/R./L. /R./L. /R./L.', '/R./L. >R... ....'] } },
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
  { number: 31, name: 'Drag', family: 'Drags', written: { bpm: 80, bars: ['llR... rrL... llR... rrL...'] } },
  { number: 32, name: 'Single drag tap', family: 'Drags', written: { bpm: 80, bars: ['llR.>L. rrL.>R. llR.>L. rrL.>R.'] } },
  // A dotted eighth, a sixteenth and an eighth, twice: the PAS chart's 6/8 halves, in 3/4 sixteenths.
  { number: 33, name: 'Double drag tap', family: 'Drags', written: { timeSignature: '3/4', bpm: 70, bars: ['llR..llR >L.rrL. ~rrL>R.'] } },
  { number: 34, name: 'Lesson 25', family: 'Drags', written: { bpm: 80, bars: ['llRL>R. rrLR>L. llRL>R. rrLR>L.'] } },
  // Its drag is a double stroke of the note's own hand (RR L R R), not grace notes of the other.
  { number: 35, name: 'Single dragadiddle', family: 'Drags', written: { bpm: 70, bars: ['>/RLRR >/LRLL >/RLRR >/LRLL'] } },
  // An eighth and four sixteenths, twice: the PAS chart's 6/8 halves, in 3/4 sixteenths.
  { number: 36, name: 'Drag paradiddle #1', family: 'Drags', written: { timeSignature: '3/4', bpm: 70, bars: ['>R.llRL RR>L. rrLRLL'] } },
  { number: 37, name: 'Drag paradiddle #2', family: 'Drags', written: { bpm: 70, bars: ['>R.llR. llRLRR >L.rrL. rrLRLL'] } },
  // The ratamacues' sixteenth triplets are written in triplet eighths, so every note is twice as
  // long: the single stroke four's rhythm with a drag in front.
  { number: 38, name: 'Single ratamacue', family: 'Drags', written: { bpm: 100, bars: ['llRLR >L.. rrLRL >R..'] } },
  { number: 39, name: 'Double ratamacue', family: 'Drags', written: { timeSignature: '3/4', bpm: 100, bars: ['llR... llRLR >L..', 'rrL... rrLRL >R..'] } },
  { number: 40, name: 'Triple ratamacue', family: 'Drags', written: { bpm: 100, bars: ['llR... llR... llRLR >L..', 'rrL... rrL... rrLRL >R..'] } },
]

/** A rudiment's id: the prefix and its name in lower case, words joined by hyphens. */
const idOf = ({ name }: Rudiment) => RUDIMENT_PREFIX + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')

/** The 40 rudiments in PAS order, as the Rudiments tab lists them. */
export function rudimentList(): RudimentEntry[] {
  return RUDIMENTS.map((r) => ({ number: r.number, name: r.name, family: r.family, id: idOf(r) }))
}

/**
 * The rudiments as exercises, in PAS order, under their fixed ids and never opened; every call
 * gives an equal set. Each note's hand is stored as an override, so it is always printed and the
 * Lead hand mirrors it.
 */
export function rudimentExercises(): Exercise[] {
  return RUDIMENTS.map((rudiment) => {
    const { timeSignature = '4/4', bpm, bars } = rudiment.written
    const base = newExercise({ id: idOf(rudiment), now: 0 })
    return {
      ...base,
      name: rudiment.name,
      timeSignature,
      bars: writeBars(bars, meter(timeSignature).beats),
      sticking: 'alternate',
      practice: { ...base.practice, bpm },
    }
  })
}

/** Whether an id is one of the rudiments', rather than a stored exercise's or an example's. */
export function isRudiment(id: string): boolean {
  return RUDIMENTS.some((r) => idOf(r) === id)
}

/** What one struck note of the text form carries besides its rhythm. */
type Struck = Pick<Note, 'override' | 'dynamic' | 'grace' | 'roll'>

/** One slot of a beat: `.`, `~` (first only), or a hand after its accent, roll stroke and grace hands. */
const SLOT = /^~|\.|>?[/z]?(?:rr?|ll?)?[RL]/g

/** The roll stroke each mark of the text form writes. */
const ROLL_MARKS: Record<string, Roll> = { '/': 'double', z: 'buzz' }

/** Whether a slot of a beat strikes a note, rather than resting or holding on. */
const strikes = (slot: string) => slot !== '.' && slot !== '~'

/** The grace that lower-case hands before a note's hand write, so many grace notes of the other hand. */
function graceOf(graces: string, hand: Hand): Grace {
  const grace = (Object.keys(GRACE_NOTES) as Grace[]).find((g) => GRACE_NOTES[g] === graces.length)
  if (!grace || graces !== opposite(hand).toLowerCase().repeat(graces.length)) {
    throw new Error(`Grace notes "${graces}" aren't the other hand from ${hand}`)
  }
  return grace
}

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
      bars = setBeat(bars, 'snare', bar, b, slots.map((s) => (strikes(s) ? 'x' : s)).join(''))
      for (const slot of slots) {
        if (!strikes(slot)) continue
        const hand = slot.at(-1) as Hand
        const [, accent, roll, graces] = slot.match(/^(>?)([/z]?)(.*).$/)!
        struck.push({
          override: hand,
          ...(accent ? { dynamic: 'accent' } : {}),
          ...(roll ? { roll: ROLL_MARKS[roll] } : {}),
          ...(graces ? { grace: graceOf(graces, hand) } : {}),
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
