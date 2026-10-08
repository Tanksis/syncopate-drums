// The staff parts: the exercise and its groove layer written by limb, as drum-set charts are (ADRs
// 0002, 0004 and 0005). Everything played with the hands (the snare row among it) is one part, stems
// up; everything played with the feet (the kick row among it) is the other, stems down, unless the
// feet only ever play with the hands in a bar: then the bar is one voice and the feet hang on the
// hands' stems. Hits at the same tick share a stem.

import type { Bar, Duration, GroovePresetId, Limb, Row } from './model'
import { ROWS, TICKS_PER_BAR, TICKS_PER_BEAT, itemTicks, noteId } from './model'
import type { GrooveNotation } from './groove'
import { grooveHitsByTick } from './groove'
import type { Instrument } from './schedule'
import { placeItems, spellSpan } from './speller'

/** A drum of the kit as the notation writes it. */
export type Drum = 'hihat' | 'ride' | 'snare' | 'bass' | 'hihatFoot'

/** The limb that plays each drum: the hands part or the feet part. */
const LIMB: Record<Drum, Limb> = { hihat: 'hands', ride: 'hands', snare: 'hands', bass: 'feet', hihatFoot: 'feet' }

/** Top to bottom on the staff: the order of a chord's notes. */
const DRUM_ORDER: readonly Drum[] = ['hihat', 'ride', 'snare', 'bass', 'hihatFoot']

const DRUM_OF_INSTRUMENT: Partial<Record<Instrument, Drum>> = {
  snare: 'snare',
  kick: 'bass',
  kickFeathered: 'bass',
  ride: 'ride',
  rideBell: 'ride',
  hihatClosed: 'hihat',
  hihatPedal: 'hihatFoot',
}

/** The drum each row is written on. */
const ROW_DRUM: Record<Row, Drum> = { snare: 'snare', kick: 'bass' }

/** Where each row's notes sit on the percussion staff: snare on the third space, bass drum on the first. */
const ROW_NOTATION: Record<Row, GrooveNotation> = {
  snare: { key: 'c/5', notehead: 'normal' },
  kick: { key: 'f/4', notehead: 'normal' },
}

/** One notehead of a chord. */
export interface StaffNote {
  drum: Drum
  /** Where VexFlow places it on the percussion staff, and its notehead. */
  key: string
  notehead: 'x' | 'normal'
  /** Set only on the exercise's notes: the struck note's id (see `noteId`), for sticking and overrides. */
  noteId?: string
  /** A tied continuation of this drum's note in the part's previous chord: drawn, not struck. */
  tied: boolean
}

interface Value {
  /** Tick within the bar. */
  start: number
  duration: Duration
  dotted: boolean
  /** Part of the triplet group that fills its beat. */
  triplet: boolean
}

/** Noteheads on one stem. */
export interface StaffChord extends Value {
  kind: 'chord'
  notes: StaffNote[]
  /**
   * The ticks within the bar of the hits this chord strikes, where the playhead lands on it: its
   * start, or none for a chord of tied continuations. A groove hit off a triplet beat's grid is
   * written on the next triplet position but still sounds at its own tick.
   */
  strikes: number[]
}

/** A rest, written where a part that has notes in the bar, or holds the snare row, is silent. */
export interface StaffRest extends Value {
  kind: 'rest'
}

/** Silence in a part with only groove notes: no rest is written, just space to keep it in time. */
export interface StaffSpace extends Value {
  kind: 'space'
}

export type StaffEvent = StaffChord | StaffRest | StaffSpace

/** One bar's two parts, each filling the bar in order, or empty. */
export interface StaffBar {
  /** Snare, ride and hi-hat, and in a bar of one voice the feet too: stems up. */
  hands: StaffEvent[]
  /** Bass drum and hi-hat foot: stems down. Empty in a bar of one voice. */
  feet: StaffEvent[]
}

/** A note sounding (or held) from `start` to `end`, ticks of the whole exercise. */
interface Sound {
  drum: Drum
  notation: GrooveNotation
  start: number
  end: number
  /** Where it is heard: differs from `start` only for a groove hit moved onto a triplet grid. */
  heard: number
  noteId?: string
}

/**
 * The exercise and its groove preset as the notation writes them, bar by bar: a hands part (stems
 * up) and a feet part (stems down) of chords, rests and space. The snare row is in the hands part
 * and the kick row in the feet part.
 *
 * - A bar where the feet play (the kick row or the groove), but only ever together with the hands,
 *   is one voice: the feet's notes join the hands' chords and the feet part is empty. Otherwise the
 *   bar is two voices.
 * - Hits at the same tick in a part share a chord. A chord holds until the part's next chord, or
 *   until all its notes' holds have ended if that is sooner. A groove note holds to the end of its
 *   beat.
 * - An exercise note held past its part's next chord ends there, untied. Its exact hold and ties
 *   are written only where nothing else in the part strikes before it ends.
 * - A part rests wherever it is silent if it has a note in the bar; the hands part also rests in a
 *   bar where the feet part has none, or once the snare row has a note anywhere. Otherwise a part
 *   has space there. Rests and notes are spelled as the speller spells them.
 * - Where the exercise and the groove strike the same drum at once, the exercise's note is written.
 * - In a part's triplet beat (one its row writes as a triplet group), a groove hit off the triplet
 *   grid is written on the next triplet position.
 */
export function staffParts(bars: readonly Bar[], groove: GroovePresetId): StaffBar[] {
  const total = bars.length * TICKS_PER_BAR

  // Each row's struck notes, each held through its tied continuations, and its triplet beats.
  const [snare, kick] = ROWS.map((row) => {
    const sounds: Sound[] = []
    const triplet = Array.from({ length: total / TICKS_PER_BEAT }, () => false)
    for (const p of placeItems(bars, row)) {
      const start = p.bar * TICKS_PER_BAR + p.start
      if (p.item.kind !== 'note') continue
      if (p.item.triplet) triplet[Math.floor(start / TICKS_PER_BEAT)] = true
      const end = start + itemTicks(p.item)
      if (p.continuation && sounds.length) sounds.at(-1)!.end = end
      else sounds.push({ drum: ROW_DRUM[row], notation: ROW_NOTATION[row], start, end, heard: start, noteId: noteId(row, p.bar, p.start) })
    }
    return { sounds, triplet }
  })
  const exercise = [...snare.sounds, ...kick.sounds]
  const triplet = snare.triplet.map((t, beat) => t || kick.triplet[beat])

  const grooveSounds: Sound[] = bars.flatMap((_, b) =>
    [...grooveHitsByTick(groove)].flatMap(([tick, hits]) =>
      hits.flatMap((hit): Sound[] => {
        const drum = DRUM_OF_INSTRUMENT[hit.instrument]
        if (!drum) return []
        const start = b * TICKS_PER_BAR + tick
        const end = start - (start % TICKS_PER_BEAT) + TICKS_PER_BEAT
        return [{ drum, notation: hit.notation, start, end, heard: start }]
      }),
    ),
  )

  const barOf = (s: Sound) => Math.floor(s.start / TICKS_PER_BAR)
  // Every sound on the grid of the hands part as it would be in a bar of one voice, which holds the exercise.
  const all = [...exercise, ...grooveSounds.map((s) => onGrid(s, triplet))]
  const oneVoice = bars.map((_, b) => {
    const inBar = all.filter((s) => barOf(s) === b)
    const handStarts = new Set(inBar.filter((s) => LIMB[s.drum] === 'hands').map((s) => s.start))
    const feet = inBar.filter((s) => LIMB[s.drum] === 'feet')
    return feet.length > 0 && feet.every((s) => handStarts.has(s.start))
  })
  const limbOf = (s: Sound): Limb => (oneVoice[barOf(s)] ? 'hands' : LIMB[s.drum])
  const barOfBeat = (beat: number) => Math.floor((beat * TICKS_PER_BEAT) / TICKS_PER_BAR)

  // Each part's sounds and triplet beats: in a bar of one voice the hands part holds both rows.
  const [hands, feet] = (['hands', 'feet'] as const).map((limb) => {
    const own = limb === 'hands' ? snare : kick
    const beats = triplet.map((t, beat) => (oneVoice[barOfBeat(beat)] ? limb === 'hands' && t : own.triplet[beat]))
    const sounds = [
      ...exercise.filter((s) => limbOf(s) === limb),
      ...grooveSounds.filter((s) => limbOf(s) === limb).map((s) => onGrid(s, beats)),
    ]
    return { beats, sounds, inBar: (b: number) => sounds.some((s) => barOf(s) === b) }
  })
  const snareRowPlays = snare.sounds.length > 0
  const parts = [
    writePart(hands.sounds, hands.beats, bars.map((_, b) => hands.inBar(b) || !feet.inBar(b) || snareRowPlays), total),
    writePart(feet.sounds, feet.beats, bars.map((_, b) => feet.inBar(b)), total),
  ]

  return bars.map((_, b) => {
    const inBar = (events: StaffEvent[]) =>
      events
        .filter((e) => Math.floor(e.start / TICKS_PER_BAR) === b)
        .map((e) => ({ ...e, start: e.start - b * TICKS_PER_BAR }))
    return { hands: inBar(parts[0]), feet: oneVoice[b] ? [] : inBar(parts[1]) }
  })
}

/** A groove sound in a triplet beat, its start and end moved on to the next triplet position. */
function onGrid(sound: Sound, triplet: readonly boolean[]): Sound {
  const snap = (tick: number) => {
    const beatStart = tick - (tick % TICKS_PER_BEAT)
    return triplet[beatStart / TICKS_PER_BEAT] ? beatStart + Math.ceil((tick - beatStart) / 4) * 4 : tick
  }
  // A hold ending on a beat line belongs to the beat before it.
  const end = sound.end % TICKS_PER_BEAT === 0 ? sound.end : snap(sound.end)
  return { ...sound, start: snap(sound.start), end }
}

/** One part over the whole exercise, with starts in ticks of the whole exercise. */
function writePart(sounds: Sound[], triplet: readonly boolean[], rests: readonly boolean[], total: number): StaffEvent[] {
  const events: StaffEvent[] = []
  const starts = [...new Set(sounds.map((s) => s.start))].sort((a, b) => a - b)
  const silence = (from: number, to: number) => {
    for (const { start, value } of spellSpan(from, to, false, triplet)) {
      events.push({ kind: rests[Math.floor(start / TICKS_PER_BAR)] ? 'rest' : 'space', start, ...value })
    }
  }
  let t = 0
  starts.forEach((start, i) => {
    if (t < start) silence(t, start)
    // The exercise wins where it strikes the same drum as the groove.
    const struck = new Map<Drum, Sound>()
    for (const s of sounds) if (s.start === start && (!struck.has(s.drum) || s.noteId)) struck.set(s.drum, s)
    // A note held past the part's next chord ends there: it is not tied on through that chord.
    const chord = [...struck.values()]
    const end = Math.min(starts[i + 1] ?? total, Math.max(...chord.map((s) => s.end)))
    spellSpan(start, end, true, triplet).forEach(({ start: at, value }, piece) => {
      const notes = chord
        .filter((s) => piece === 0 || s.end > at)
        .sort((a, b) => DRUM_ORDER.indexOf(a.drum) - DRUM_ORDER.indexOf(b.drum))
        .map((s): StaffNote => ({
          drum: s.drum,
          key: s.notation.key,
          notehead: s.notation.notehead,
          ...(s.noteId ? { noteId: s.noteId } : {}),
          tied: piece > 0,
        }))
      const heard = piece === 0 ? [...struck.values()].map((s) => s.heard % TICKS_PER_BAR) : []
      const strikes = [...new Set(heard)].sort((a, b) => a - b)
      events.push({ kind: 'chord', start: at, ...value, notes, strikes })
    })
    t = end
  })
  if (t < total) silence(t, total)
  return events
}
