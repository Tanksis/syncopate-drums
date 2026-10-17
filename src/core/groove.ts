// The groove layer: a pattern played and drawn above the exercise, the same in every bar, and the
// feet under it, the bass drum and the hi-hat foot, each a setting of its own (ADR 0010).

import type { BassDrum, Exercise, HihatFoot, Meter, PatternId, PracticeSettings, TimeSignature } from './model'
import { HIHAT_FOOT_SETTINGS, TICKS_PER_BEAT, TRIPLET_SWING, meter, swingOn } from './model'
import type { Instrument } from './schedule'

/** Where a groove hit is drawn on the percussion staff: the key VexFlow places it at, and its notehead. */
export interface GrooveNotation {
  key: string
  notehead: 'x' | 'normal'
}

/** One hit of the groove layer, at a tick in the bar. */
export interface GrooveHit {
  tick: number
  instrument: Instrument
  /** How hard it is played, 0–1: 1 is the instrument's usual level. */
  velocity: number
  notation: GrooveNotation
}

/** The styles the Pattern picker groups the patterns by. */
export type PatternFamily = 'Jazz' | 'Rock & pop' | 'Afro-Cuban' | 'Blues'

export interface Pattern {
  id: PatternId
  /** None has no family. */
  family: PatternFamily | null
  name: string
  /** One line saying what it plays. */
  description: string
  /** What it plays over a bar, one character per eighth: `x` a hit, `.` none; empty for None. */
  strip: string
  /** Whether it has a place in a bar of this meter. */
  fits: (meter: Meter) => boolean
  /** Every bar's hits, in tick order, in a bar of this many beats. */
  hits: (beats: number) => GrooveHit[]
}

const RIDE: GrooveNotation = { key: 'f/5', notehead: 'x' }
const HIHAT: GrooveNotation = { key: 'g/5', notehead: 'x' }
const HIHAT_FOOT: GrooveNotation = { key: 'd/4', notehead: 'x' }
const BASS_DRUM: GrooveNotation = { key: 'f/4', notehead: 'normal' }

/** The tick of a beat, or of the & of it. */
const at = (beat: number, eighth = 0) => beat * TICKS_PER_BEAT + eighth * (TICKS_PER_BEAT / 2)

/** The bar's beats, from 0. */
const beatsOfBar = (beats: number) => Array.from({ length: beats }, (_, beat) => beat)

/** The jazz ride pattern, louder on 2 and 4. Beats 2 and 4 have the & (in 3/4 and 2/4, beat 2 only). */
function ride(beats: number): GrooveHit[] {
  return beatsOfBar(beats).flatMap((beat): GrooveHit[] => {
    const hit = (eighth: number, velocity: number): GrooveHit => ({ tick: at(beat, eighth), instrument: 'ride', velocity, notation: RIDE })
    return beat % 2 === 0 ? [hit(0, 0.85)] : [hit(0, 1), hit(1, 0.7)]
  })
}

/** Eighths on the closed hi-hat, the beats louder than the &s and 1 and 3 loudest. */
function hihatEighths(beats: number): GrooveHit[] {
  return beatsOfBar(beats).flatMap((beat): GrooveHit[] => [
    { tick: at(beat), instrument: 'hihatClosed', velocity: beat % 2 === 0 ? 1 : 0.85, notation: HIHAT },
    { tick: at(beat, 1), instrument: 'hihatClosed', velocity: 0.7, notation: HIHAT },
  ])
}

const simple = (m: Meter) => !m.compound

const PATTERNS: readonly Pattern[] = [
  { id: 'off', family: null, name: 'None', description: 'Just the click and your exercise.', strip: '', fits: () => true, hits: () => [] },
  { id: 'ride', family: 'Jazz', name: 'Ride', description: 'The swing ride: 1, 2 &, 3, 4 &.', strip: 'x.xxx.xx', fits: simple, hits: ride },
  {
    id: 'hihatEighths',
    family: 'Rock & pop',
    name: 'Hi-hat 8ths',
    description: 'Eighths on the closed hi-hat.',
    strip: 'xxxxxxxx',
    fits: simple,
    hits: hihatEighths,
  },
]

/** The pattern with this id; an id this version of the app doesn't know plays none. */
export function patternById(id: PatternId): Pattern {
  return PATTERNS.find((p) => p.id === id) ?? PATTERNS[0]
}

export const PATTERN_IDS: readonly PatternId[] = PATTERNS.map((p) => p.id)

/** The patterns that fit a time signature, grouped by family in picker order: None, on its own, first. */
export function patternsFor(timeSignature: TimeSignature): { family: PatternFamily | null; patterns: Pattern[] }[] {
  const m = meter(timeSignature)
  const groups: { family: PatternFamily | null; patterns: Pattern[] }[] = []
  for (const p of PATTERNS.filter((p) => p.fits(m))) {
    const group = groups.find((g) => g.family === p.family)
    if (group) group.patterns.push(p)
    else groups.push({ family: p.family, patterns: [p] })
  }
  return groups
}

/** A pattern's hits in every bar of a meter, in tick order; none where it doesn't fit. */
export function patternHits(id: PatternId, m: Meter): GrooveHit[] {
  const p = patternById(id)
  return p.fits(m) ? p.hits(m.beats) : []
}

/** The feathered bass drum: softly on every beat, a dotted quarter in compound time. */
export function bassDrumHits(bassDrum: BassDrum, beats: number): GrooveHit[] {
  if (bassDrum === 'off') return []
  return beatsOfBar(beats).map((beat) => ({ tick: at(beat), instrument: 'kickFeathered', velocity: 1, notation: BASS_DRUM }))
}

/** The ticks each hi-hat foot setting plays on, in every bar of this many beats. */
function hihatFootTicks(hihatFoot: HihatFoot, beats: number): number[] {
  const bar = beatsOfBar(beats)
  switch (hihatFoot) {
    case 'off':
      return []
    case 'one':
      return [at(0)]
    case 'quarters':
      return bar.map((beat) => at(beat))
    case 'twoAndFour':
      return bar.filter((beat) => beat % 2 === 1).map((beat) => at(beat))
    case 'ands':
      return bar.map((beat) => at(beat, 1))
  }
}

/** The hi-hat foot setting's hits in every bar of this many beats. */
export function hihatFootHits(hihatFoot: HihatFoot, beats: number): GrooveHit[] {
  return hihatFootTicks(hihatFoot, beats).map((tick) => ({ tick, instrument: 'hihatPedal', velocity: 1, notation: HIHAT_FOOT }))
}

/**
 * The hi-hat foot settings that fit a time signature: 2 & 4 only in 4/4, and in compound time only
 * on 1 or on the beats, whose eighths have no &.
 */
export function hihatFootOptions(timeSignature: TimeSignature): HihatFoot[] {
  if (meter(timeSignature).compound) return ['off', 'one', 'quarters']
  return HIHAT_FOOT_SETTINGS.filter((foot) => foot !== 'twoAndFour' || timeSignature === '4/4')
}

/** A pattern as it plays in a time signature: none where the time signature doesn't offer it. */
export function fittedPattern(id: PatternId, timeSignature: TimeSignature): PatternId {
  const p = patternById(id)
  return p.id === id && p.fits(meter(timeSignature)) ? id : 'off'
}

/** A hi-hat foot setting as it plays in a time signature: off where the time signature doesn't offer it. */
export function fittedHihatFoot(hihatFoot: HihatFoot, timeSignature: TimeSignature): HihatFoot {
  return hihatFootOptions(timeSignature).includes(hihatFoot) ? hihatFoot : 'off'
}

/** Practice settings fitted to a time signature: a pattern or hi-hat foot it doesn't offer is turned off. */
export function fittedPractice(practice: PracticeSettings, timeSignature: TimeSignature): PracticeSettings {
  const fitted = fittedPattern(practice.pattern, timeSignature)
  const hihatFoot = fittedHihatFoot(practice.hihatFoot, timeSignature)
  return fitted === practice.pattern && hihatFoot === practice.hihatFoot ? practice : { ...practice, pattern: fitted, hihatFoot }
}

/** A setting picking a pattern may also change, so the picker can say so and offer to undo it. */
export type PatternSuggestion = 'swing' | 'hihatFoot'

/**
 * The exercise with a pattern, and what else the pick changed. Ride on a straight exercise also
 * sets triplet swing, since a jazz ride is never played straight (ADR 0007), and sets the hi-hat
 * foot to 2 & 4 when it is off and the meter offers 2 & 4. Any other swing amount or hi-hat foot is
 * left as the drummer set it, and the bass drum is never changed. The same pattern, or one the
 * time signature doesn't offer, is no change.
 */
export function withPattern(exercise: Exercise, id: PatternId): { exercise: Exercise; suggested: PatternSuggestion[] } {
  const { practice, timeSignature } = exercise
  if (id === practice.pattern || fittedPattern(id, timeSignature) !== id) return { exercise, suggested: [] }
  const suggested: PatternSuggestion[] = []
  let { swing, hihatFoot } = practice
  if (id === 'ride') {
    if (!swingOn(practice)) {
      swing = TRIPLET_SWING
      suggested.push('swing')
    }
    if (hihatFoot === 'off' && hihatFootOptions(timeSignature).includes('twoAndFour')) {
      hihatFoot = 'twoAndFour'
      suggested.push('hihatFoot')
    }
  }
  return { exercise: { ...exercise, practice: { ...practice, pattern: id, swing, hihatFoot } }, suggested }
}

/** The settings that make up the groove layer. */
export type GrooveSettings = Pick<PracticeSettings, 'pattern' | 'bassDrum' | 'hihatFoot'>

/**
 * The groove layer's hits by the tick they are struck at, in tick order, in every bar of a meter:
 * the pattern's, the bass drum's and the hi-hat foot's.
 */
export function grooveHitsByTick({ pattern: id, bassDrum, hihatFoot }: GrooveSettings, m: Meter): Map<number, GrooveHit[]> {
  return hitsByTick([...patternHits(id, m), ...bassDrumHits(bassDrum, m.beats), ...hihatFootHits(hihatFoot, m.beats)])
}

/** Hits by the tick they are struck at, in tick order. */
export function hitsByTick(hits: readonly GrooveHit[]): Map<number, GrooveHit[]> {
  const byTick = new Map<number, GrooveHit[]>()
  for (const hit of [...hits].sort((a, b) => a.tick - b.tick)) byTick.set(hit.tick, [...(byTick.get(hit.tick) ?? []), hit])
  return byTick
}
