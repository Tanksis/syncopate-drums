// The staff parts: the exercise and its groove layer written by limb, as drum-set charts are (ADR
// 0002). Everything played with the hands is one part, stems up; everything played with the feet
// is the other, stems down. Hits at the same tick share a stem, and a part rests only where it is
// silent.

import type { Bar, Duration, GroovePresetId, Limb, Voice } from './model'
import { TICKS_PER_BAR, TICKS_PER_BEAT, VOICE_LIMB, itemTicks } from './model'
import type { GrooveNotation } from './groove'
import { grooveChords } from './groove'
import type { Instrument } from './schedule'
import { VOICE_INSTRUMENT } from './schedule'
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

/** Where an exercise voice's notes sit on the percussion staff: snare on the third space, bass drum on the first. */
const VOICE_NOTATION: Record<Voice, GrooveNotation> = {
  snare: { key: 'c/5', notehead: 'normal' },
  bass: { key: 'f/4', notehead: 'normal' },
}

/** One notehead of a chord. */
export interface StaffNote {
  drum: Drum
  /** Where VexFlow places it on the percussion staff, and its notehead. */
  key: string
  notehead: 'x' | 'normal'
  /** Set only on the exercise's notes: the struck note's id, `bar:tick`, for sticking and overrides. */
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

/** A rest, written where the part holding the exercise is silent. */
export interface StaffRest extends Value {
  kind: 'rest'
}

/** Silence in a part with only groove notes: no rest is written, just space to keep it in time. */
export interface StaffSpace extends Value {
  kind: 'space'
}

export type StaffEvent = StaffChord | StaffRest | StaffSpace

/** One bar's two parts, each filling the bar in order. */
export interface StaffBar {
  /** Snare, ride and hi-hat: stems up. */
  hands: StaffEvent[]
  /** Bass drum and hi-hat foot: stems down. */
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
 * up) and a feet part (stems down) of chords, rests and space.
 *
 * - Hits at the same tick in a part share a chord. A chord holds until the part's next chord, or
 *   until all its notes' holds have ended if that is sooner. Groove notes hold as `grooveChords`
 *   writes them.
 * - An exercise note held past its part's next chord ends there, untied. Its exact hold and ties
 *   are written only where nothing else in the part strikes before it ends.
 * - The part holding the exercise rests wherever it is silent; a part of groove notes alone has
 *   space there instead. Rests and notes are spelled as the speller spells them.
 * - Where the exercise and the groove strike the same drum at once, the exercise's note is written.
 * - In a triplet beat of the exercise, a groove hit off the triplet grid is written on the next
 *   triplet position.
 */
export function staffParts(bars: readonly Bar[], voice: Voice, groove: GroovePresetId): StaffBar[] {
  const total = bars.length * TICKS_PER_BAR
  const exerciseDrum = DRUM_OF_INSTRUMENT[VOICE_INSTRUMENT[voice]]!
  const exerciseLimb = VOICE_LIMB[voice]

  // The exercise's struck notes, each held through its tied continuations.
  const exercise: Sound[] = []
  const triplet = Array.from({ length: total / TICKS_PER_BEAT }, () => false)
  for (const p of placeItems(bars)) {
    const start = p.bar * TICKS_PER_BAR + p.start
    if (p.item.kind !== 'note') continue
    if (p.item.triplet) triplet[Math.floor(start / TICKS_PER_BEAT)] = true
    const end = start + itemTicks(p.item)
    if (p.continuation && exercise.length) exercise.at(-1)!.end = end
    else exercise.push({ drum: exerciseDrum, notation: VOICE_NOTATION[voice], start, end, heard: start, noteId: `${p.bar}:${p.start}` })
  }

  const grooveSounds: Sound[] = bars.flatMap((_, b) =>
    grooveChords(groove).flatMap((chord) =>
      chord.hits.flatMap((hit): Sound[] => {
        const drum = DRUM_OF_INSTRUMENT[hit.instrument]
        if (!drum) return []
        const start = b * TICKS_PER_BAR + chord.start
        const end = start + itemTicks({ duration: chord.duration, dotted: false, triplet: false })
        return [{ drum, notation: hit.notation, start, end, heard: start }]
      }),
    ),
  )

  const noTriplets = triplet.map(() => false)
  const parts = (['hands', 'feet'] as const).map((limb) => {
    const holdsExercise = limb === exerciseLimb
    const beats = holdsExercise ? triplet : noTriplets
    const sounds = [
      ...(holdsExercise ? exercise : []),
      ...grooveSounds.filter((s) => LIMB[s.drum] === limb).map((s) => onGrid(s, beats)),
    ]
    return writePart(sounds, beats, holdsExercise, total)
  })

  return bars.map((_, b) => {
    const inBar = (events: StaffEvent[]) =>
      events
        .filter((e) => Math.floor(e.start / TICKS_PER_BAR) === b)
        .map((e) => ({ ...e, start: e.start - b * TICKS_PER_BAR }))
    return { hands: inBar(parts[0]), feet: inBar(parts[1]) }
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
function writePart(sounds: Sound[], triplet: readonly boolean[], withRests: boolean, total: number): StaffEvent[] {
  const events: StaffEvent[] = []
  const starts = [...new Set(sounds.map((s) => s.start))].sort((a, b) => a - b)
  const silence = (from: number, to: number) => {
    for (const { start, value } of spellSpan(from, to, false, triplet)) {
      events.push({ kind: withRests ? 'rest' : 'space', start, ...value })
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
