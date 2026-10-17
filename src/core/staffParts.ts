// The staff parts: the exercise and its groove layer written by limb, as drum-set charts are (ADRs
// 0002, 0004 and 0005). Everything played with the hands (the snare row among it) is one part, stems
// up; everything played with the feet (the kick row among it) is the other, stems down, unless the
// feet only ever play with the hands in a bar, or never do (a linear fill, ADR 0011): then the bar
// is one voice and the feet hang on the hands' stems. Hits at the same tick share a stem.

import type { Bar, BassDrum, Duration, HihatFoot, Item, Limb, PatternId, Row } from './model'
import { ROWS, TICKS_PER_BEAT, barBeats, barTicks, itemTicks, noteId } from './model'
import type { GrooveHit, GrooveNotation } from './groove'
import { bassDrumHits, hihatFootHits, hitsByTick, patternHits } from './groove'
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

/** Ticks into a beat of the &, of a triplet eighth, and of the let (a triplet beat's last position). */
const AND = TICKS_PER_BEAT / 2
const TRIPLET_EIGHTH = TICKS_PER_BEAT / 3
const LET = 2 * TRIPLET_EIGHTH

/** The beat a tick falls in, across the whole exercise. */
const beatOf = (tick: number) => Math.floor(tick / TICKS_PER_BEAT)

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

/** A rest, written where a part that has notes in the bar, or holds the exercise, is silent. */
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
  /** One of the hi-hat foot setting's hits: written under the fill, not counted in the voicing (ADR 0012). */
  ostinato?: boolean
}

/**
 * The exercise and its groove layer as the notation writes them, bar by bar: a hands part (stems
 * up) and a feet part (stems down) of chords, rests and space. The snare row is in the hands part
 * and the kick row in the feet part. The groove layer is the pattern, the `bassDrum` setting and
 * the `hihatFoot` setting (ADR 0010).
 *
 * - A bar where the hands and the feet (the kick row or the groove) both play, and the feet either
 *   only ever play together with the hands or never do (a linear fill such as RLKK), is one voice:
 *   the feet's notes join the hands' chords and the feet part is empty. Otherwise the bar is two
 *   voices.
 * - Under a pattern the hi-hat foot is part of the groove, and counts like any other foot hit.
 *   With no pattern it is an ostinato under the line, and doesn't count in that choice, which is
 *   made as with the setting off (ADR 0012). In a bar of one voice, or of the hands alone, they join the hands' chords if every
 *   one lands on a struck chord; otherwise they are a feet part of their own under the hands (the
 *   rows staying as they were), or, in a bar of two voices, join the feet part.
 * - Hits at the same tick in a part share a chord. A chord holds until the part's next chord, or
 *   until all its notes' holds have ended if that is sooner. A groove note holds to the end of its
 *   beat.
 * - An exercise note held past its part's next chord ends there, untied. Its exact hold and ties
 *   are written only where nothing else in the part strikes before it ends.
 * - A part rests wherever it is silent if it has a note in the bar or holds the exercise: the hands
 *   part does, unless only the kick row has notes, when the feet part does (as a bass drum line
 *   was written before it had a snare row). Otherwise a part has space there. Rests and notes are
 *   spelled as the speller spells them.
 * - Where the exercise and the groove strike the same drum at once, the exercise's note is written.
 * - In a part's triplet beat (one its row writes as a triplet group), a groove hit off the triplet
 *   grid is written on the next triplet position.
 * - With `swung` (the swing feel on), a sixteenth-grid beat whose hits, from every row and the
 *   groove, are on the & and perhaps the downbeat, with none on the e or the a, is written as
 *   played: on the triplet grid, the & on its last position (ADR 0006). Holds go to the nearest
 *   triplet position, but a note on its downbeat holds one triplet position when its part strikes
 *   on the let, as Groove Scribe writes it (ride, rest, ride). Each part writes it as a triplet
 *   group only if it has a note there off the downbeat.
 * - In `compound` time nothing is swung: each beat is already three eighths (ADR 0015).
 */
export function staffParts(
  bars: readonly Bar[],
  pattern: PatternId,
  {
    swung = false,
    hihatFoot = 'off',
    bassDrum = 'off',
    compound = false,
  }: { swung?: boolean; hihatFoot?: HihatFoot; bassDrum?: BassDrum; compound?: boolean } = {},
): StaffBar[] {
  const beatsPerBar = barBeats(bars)
  const ticksPerBar = barTicks(beatsPerBar)
  const total = bars.length * ticksPerBar

  // Each row's struck notes, each held through its tied continuations, and its triplet beats.
  const [snare, kick] = ROWS.map((row) => {
    const sounds: Sound[] = []
    const triplet = Array.from({ length: total / TICKS_PER_BEAT }, () => false)
    for (const p of placeItems(bars, row)) {
      const start = p.bar * ticksPerBar + p.start
      if (p.item.kind !== 'note') continue
      if (p.item.triplet) triplet[Math.floor(start / TICKS_PER_BEAT)] = true
      const end = start + itemTicks(p.item)
      if (p.continuation && sounds.length) sounds.at(-1)!.end = end
      else sounds.push({ drum: ROW_DRUM[row], notation: ROW_NOTATION[row], start, end, heard: start, noteId: noteId(row, p.bar, p.start) })
    }
    return { sounds, triplet }
  })
  const triplet = snare.triplet.map((t, beat) => t || kick.triplet[beat])

  const grooveStruck = (byTick: Map<number, GrooveHit[]>, ostinato: boolean): Sound[] =>
    bars.flatMap((_, b) =>
      [...byTick].flatMap(([tick, hits]) =>
        hits.flatMap((hit): Sound[] => {
          const drum = DRUM_OF_INSTRUMENT[hit.instrument]
          if (!drum) return []
          const start = b * ticksPerBar + tick
          const end = start - (start % TICKS_PER_BEAT) + TICKS_PER_BEAT
          // The flag is left off other sounds, so they stay as they were.
          return [{ drum, notation: hit.notation, start, end, heard: start, ...(ostinato ? { ostinato } : {}) }]
        }),
      ),
    )
  // The pattern and the bass drum, and the hi-hat foot: with a pattern, part of its groove; with
  // none, an ostinato under the line, kept apart (ADR 0012).
  const barMeter = { beats: beatsPerBar, compound }
  const foot = hihatFootHits(hihatFoot, beatsPerBar)
  const ostinato = pattern === 'off'
  const layer = [...patternHits(pattern, barMeter), ...bassDrumHits(bassDrum, beatsPerBar), ...(ostinato ? [] : foot)]
  const layerHits = grooveStruck(hitsByTick(layer), false)
  const settingHits = ostinato ? grooveStruck(hitsByTick(foot), true) : []

  const lines = [...snare.sounds, ...kick.sounds]
  const swungBeat = swung && !compound ? swungBeats([...lines, ...layerHits, ...settingHits], triplet) : triplet.map(() => false)
  const exercise = lines.map((s) => respell(s, swungBeat))
  const layerSounds = layerHits.map((s) => respell(s, swungBeat))
  const grooveSounds = [...layerSounds, ...settingHits.map((s) => respell(s, swungBeat))]

  const barOf = (s: Sound) => Math.floor(s.start / ticksPerBar)
  // Each bar's voicing, chosen as if the setting were off (ADR 0012), from every sound on the grid of
  // the hands part as it would be in a bar of one voice, which holds the exercise.
  const asIfOff = [...exercise, ...layerSounds.map((s) => onGrid(s, triplet))]
  const drawn = [...exercise, ...grooveSounds.map((s) => onGrid(s, triplet))]
  const voicing = bars.map((_, b) => {
    const inBar = asIfOff.filter((s) => barOf(s) === b)
    const handStarts = new Set(inBar.filter((s) => LIMB[s.drum] === 'hands').map((s) => s.start))
    const feet = inBar.filter((s) => LIMB[s.drum] === 'feet')
    // The feet only ever play with the hands, or never do: a linear fill.
    const withHands = feet.filter((s) => handStarts.has(s.start)).length
    const oneVoice = feet.length > 0 && handStarts.size > 0 && (withHands === feet.length || withHands === 0)
    // The setting's hits join the hands' chords in a bar of one voice, or of hands alone, if every
    // one lands on a struck chord.
    // Off the triplet grid, as heard: a foot on the & of a triplet beat lands on no chord.
    const ostinato = grooveSounds.filter((s) => s.ostinato && barOf(s) === b)
    const chords = new Set(drawn.filter((s) => barOf(s) === b && !s.ostinato && (oneVoice || LIMB[s.drum] === 'hands')).map((s) => s.start))
    const joins = ostinato.length > 0 && (oneVoice || feet.length === 0) && ostinato.every((s) => chords.has(s.start))
    return { oneVoice, joins, feetPart: !joins && (!oneVoice || ostinato.length > 0) }
  })
  const limbOf = (s: Sound): Limb => {
    const { oneVoice, joins } = voicing[barOf(s)]
    if (s.ostinato) return joins ? 'hands' : 'feet'
    return oneVoice ? 'hands' : LIMB[s.drum]
  }
  const barOfBeat = (beat: number) => Math.floor((beat * TICKS_PER_BEAT) / ticksPerBar)

  // Each part's sounds and triplet beats: in a bar of one voice the hands part holds both rows, and
  // a feet part under it holds only the setting's hits, on the sixteenth grid.
  const [hands, feet] = (['hands', 'feet'] as const).map((limb) => {
    const own = limb === 'hands' ? snare : kick
    const tripletBeats = triplet.map((t, beat) => {
      const { oneVoice, feetPart } = voicing[barOfBeat(beat)]
      if (limb === 'hands') return oneVoice || !feetPart ? t : own.triplet[beat]
      return oneVoice ? false : own.triplet[beat]
    })
    const struck = [
      ...exercise.filter((s) => limbOf(s) === limb),
      ...grooveSounds.filter((s) => limbOf(s) === limb).map((s) => onGrid(s, tripletBeats)),
    ]
    // A swung downbeat leaves the middle of the triplet silent where its part strikes on the let.
    const lets = new Set(struck.map((s) => s.start).filter((t) => swungBeat[beatOf(t)] && t % TICKS_PER_BEAT === LET))
    const sounds = struck.map((s) => (lets.has(s.start + LET) ? { ...s, end: Math.min(s.end, s.start + TRIPLET_EIGHTH) } : s))
    // A swung beat is a triplet group in a part only where the part has a note off the downbeat; so is
    // a compound beat, whose eighths are always on the triplet grid, even one only the groove strikes inside.
    const offBeat = new Set(
      sounds.flatMap((s) => [s.start, s.end]).filter((tick) => tick % TICKS_PER_BEAT !== 0).map(beatOf),
    )
    const beats = tripletBeats.map((t, beat) => t || ((swungBeat[beat] || compound) && offBeat.has(beat)))
    return { beats, sounds, inBar: (b: number) => sounds.some((s) => barOf(s) === b) }
  })
  /** The part that rests wherever it is silent, in a bar of two voices. */
  const holdsExercise: Limb = snare.sounds.length === 0 && kick.sounds.length > 0 ? 'feet' : 'hands'
  const parts = [
    writePart(hands.sounds, hands.beats, bars.map((_, b) => hands.inBar(b) || holdsExercise === 'hands'), total, ticksPerBar, compound),
    writePart(feet.sounds, feet.beats, bars.map((_, b) => feet.inBar(b) || holdsExercise === 'feet'), total, ticksPerBar, compound),
  ]

  return bars.map((_, b) => {
    const inBar = (events: StaffEvent[]) =>
      events
        .filter((e) => Math.floor(e.start / ticksPerBar) === b)
        .map((e) => ({ ...e, start: e.start - b * ticksPerBar }))
    return { hands: inBar(parts[0]), feet: voicing[b].feetPart ? inBar(parts[1]) : [] }
  })
}

/** The beats written swung: each sixteenth-grid beat with a hit on the & and none on the e or the a. */
function swungBeats(sounds: readonly Sound[], triplet: readonly boolean[]): boolean[] {
  return triplet.map((t, beat) => {
    if (t) return false
    const offsets = sounds.filter((s) => beatOf(s.start) === beat).map((s) => s.start % TICKS_PER_BEAT)
    return offsets.includes(AND) && offsets.every((o) => o % AND === 0)
  })
}

/** A tick moved onto the triplet grid in the given beats, by `round` (to the nearest, or the next). */
function toTripletGrid(tick: number, beats: readonly boolean[], round: (x: number) => number): number {
  const beatStart = tick - (tick % TICKS_PER_BEAT)
  return beats[beatOf(tick)] ? beatStart + round((tick - beatStart) / TRIPLET_EIGHTH) * TRIPLET_EIGHTH : tick
}

/** A sound in swung beats moved to the triplet grid: the & on the let, holds to the nearest position. */
function respell(sound: Sound, swungBeat: readonly boolean[]): Sound {
  const move = (tick: number) => toTripletGrid(tick, swungBeat, Math.round)
  const start = move(sound.start)
  if (start === sound.start && move(sound.end) === sound.end) return sound
  // A hold of one sixteenth after the & still lasts a triplet position.
  const end = swungBeat[beatOf(sound.start)] ? Math.max(move(sound.end), start + TRIPLET_EIGHTH) : move(sound.end)
  return { ...sound, start, end }
}

/** A groove sound in a triplet beat, its start and end moved on to the next triplet position. */
function onGrid(sound: Sound, triplet: readonly boolean[]): Sound {
  const snap = (tick: number) => toTripletGrid(tick, triplet, Math.ceil)
  // A hold ending on a beat line belongs to the beat before it.
  const end = sound.end % TICKS_PER_BEAT === 0 ? sound.end : snap(sound.end)
  return { ...sound, start: snap(sound.start), end }
}

/** One part over the whole exercise, with starts in ticks of the whole exercise. */
function writePart(
  sounds: Sound[],
  triplet: readonly boolean[],
  rests: readonly boolean[],
  total: number,
  ticksPerBar: number,
  compound: boolean,
): StaffEvent[] {
  const events: StaffEvent[] = []
  const starts = [...new Set(sounds.map((s) => s.start))].sort((a, b) => a - b)
  const silence = (from: number, to: number) => {
    for (const { start, value } of spellSpan(from, to, false, triplet, ticksPerBar, compound)) {
      events.push({ kind: rests[Math.floor(start / ticksPerBar)] ? 'rest' : 'space', start, ...value })
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
    spellSpan(start, end, true, triplet, ticksPerBar, compound).forEach(({ start: at, value }, piece) => {
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
      const heard = piece === 0 ? [...struck.values()].map((s) => s.heard % ticksPerBar) : []
      const strikes = [...new Set(heard)].sort((a, b) => a - b)
      events.push({ kind: 'chord', start: at, ...value, notes, strikes })
    })
    t = end
  })
  if (t < total) silence(t, total)
  return events
}

/** The written values by their length in ticks, as a simple-time beat of 12 ticks counts them. */
const VALUE_BY_TICKS: Record<number, Pick<Item, 'duration' | 'dotted'>> = {
  3: { duration: 'sixteenth', dotted: false },
  6: { duration: 'eighth', dotted: false },
  9: { duration: 'eighth', dotted: true },
  12: { duration: 'quarter', dotted: false },
  18: { duration: 'quarter', dotted: true },
}

/**
 * How a value spelled on the triplet grid is written in compound time, where a beat is a dotted
 * quarter: half as long again, with no triplet "3". A triplet eighth is an eighth, a triplet
 * quarter a quarter, and a whole beat a dotted quarter (ADR 0015).
 */
export function compoundValue(value: Pick<Item, 'duration' | 'dotted' | 'triplet'>): Pick<Item, 'duration' | 'dotted'> {
  return VALUE_BY_TICKS[itemTicks(value) * 1.5] ?? value
}
