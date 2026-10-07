// Sticking: which hand plays each struck note. Computed once over the whole exercise from bar 1,
// so it never depends on the loop range or which pass is playing.

import type { Exercise, Hand } from './model'
import { BEATS_PER_BAR, TICKS_PER_BEAT } from './model'
import type { PlacedItem } from './speller'
import { placeItems } from './speller'

/** The hand for one struck note. */
export interface NoteSticking {
  /** The struck note, as `bar:tick`, the same id the schedule uses. */
  noteId: string
  bar: number
  /** Start tick within the bar. */
  start: number
  /** The hand the sticking mode gives this note; null with sticking off. */
  computed: Hand | null
  override?: Hand
  /** The hand printed under the note: null with sticking off or under the bass drum voice. */
  shown: Hand | null
}

const other = (hand: Hand): Hand => (hand === 'R' ? 'L' : 'R')

/** A hand for each struck note, in order. Rests and tied continuations get none. */
export function sticking(exercise: Exercise): NoteSticking[] {
  const { leadHand, sticking: mode } = exercise
  const placed = placeItems(exercise.bars)
  const hands = mode === 'alternate' ? alternate(placed, leadHand) : natural(placed, leadHand)
  // Hidden hands keep their overrides, so switching back brings them back.
  const hidden = mode === 'off' || exercise.voice === 'bass'
  return placed.flatMap((p, i) => {
    if (p.item.kind !== 'note' || p.continuation) return []
    const computed = mode === 'off' ? null : hands[i]
    const { override } = p.item
    const shown = hidden ? null : (override ?? computed)
    return [{ noteId: `${p.bar}:${p.start}`, bar: p.bar, start: p.start, computed, override, shown }]
  })
}

/** How many notes carry a sticking override, shown or hidden. */
export function overrideCount(exercise: Exercise): number {
  return sticking(exercise).filter((n) => n.override).length
}

const isStruck = (p: PlacedItem) => p.item.kind === 'note' && !p.continuation

/** Alternates hand to hand over the struck notes, starting on the lead hand. */
function alternate(placed: readonly PlacedItem[], lead: Hand): Hand[] {
  let count = 0
  return placed.map((p) => (isStruck(p) && count++ % 2 === 1 ? other(lead) : lead))
}

/**
 * Ties each hand to a grid position: a straight beat's grid is its finest subdivision, starting
 * on the lead hand; a run of back-to-back triplet beats alternates on through every slot.
 */
function natural(placed: readonly PlacedItem[], lead: Hand): Hand[] {
  const beatOf = (p: PlacedItem) => p.bar * BEATS_PER_BAR + Math.floor(p.start / TICKS_PER_BEAT)
  const byBeat = new Map<number, number[]>()
  placed.forEach((p, i) => {
    const indexes = byBeat.get(beatOf(p))
    if (indexes) indexes.push(i)
    else byBeat.set(beatOf(p), [i])
  })
  const hands: Hand[] = placed.map(() => lead)
  /** Triplet slots already used by the run of triplet beats so far. */
  let run = 0
  let previousBeat = -1
  for (const [beat, indexes] of byBeat) {
    const offsets = indexes.map((i) => placed[i].start % TICKS_PER_BEAT)
    const triplet = indexes.some((i) => placed[i].item.kind === 'note' && placed[i].item.triplet)
    if (!triplet || beat !== previousBeat + 1) run = 0
    // Triplet slots are 4 ticks apart; a straight beat's grid is sixteenths, eighths or the quarter.
    const step = triplet ? 4 : offsets.some((o) => o % 6) ? 3 : offsets.some((o) => o % 12) ? 6 : 12
    indexes.forEach((i, k) => {
      const position = (triplet ? run : 0) + offsets[k] / step
      hands[i] = position % 2 === 0 ? lead : other(lead)
    })
    run = triplet ? run + 3 : 0
    previousBeat = beat
  }
  return hands
}
