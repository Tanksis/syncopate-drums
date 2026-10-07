// The groove presets: predefined groove layers played and drawn above the exercise, the same in
// every bar.

import type { Duration, GroovePresetId } from './model'
import { TICKS_PER_BEAT } from './model'
import type { Instrument } from './schedule'

/** Where a groove hit is drawn on the percussion staff: the key VexFlow places it at, and its notehead. */
export interface GrooveNotation {
  key: string
  notehead: 'x' | 'normal'
}

/** One hit of a groove preset, at a tick in the bar. */
export interface GrooveHit {
  tick: number
  instrument: Instrument
  /** How hard it is played, 0–1: 1 is the instrument's usual level. */
  velocity: number
  notation: GrooveNotation
}

export interface GroovePreset {
  id: GroovePresetId
  name: string
  /** Every bar's hits, in tick order. */
  hits: GrooveHit[]
}

const RIDE: GrooveNotation = { key: 'f/5', notehead: 'x' }
const HIHAT: GrooveNotation = { key: 'g/5', notehead: 'x' }
const HIHAT_FOOT: GrooveNotation = { key: 'd/4', notehead: 'x' }
const BASS_DRUM: GrooveNotation = { key: 'f/4', notehead: 'normal' }

/** The tick of a beat, or of the & of it. */
const at = (beat: number, eighth = 0) => beat * TICKS_PER_BEAT + eighth * (TICKS_PER_BEAT / 2)

/** The jazz ride pattern, louder on 2 and 4, with the hi-hat foot on 2 and 4, and optionally a feathered bass drum on every beat. */
function jazzRide({ feathered }: { feathered: boolean }): GrooveHit[] {
  return [0, 1, 2, 3].flatMap((beat): GrooveHit[] => {
    const ride = (eighth: number, velocity: number): GrooveHit =>
      ({ tick: at(beat, eighth), instrument: 'ride', velocity, notation: RIDE })
    const feather: GrooveHit[] = feathered
      ? [{ tick: at(beat), instrument: 'kickFeathered', velocity: 1, notation: BASS_DRUM }]
      : []
    if (beat % 2 === 0) return [ride(0, 0.85), ...feather]
    return [
      ride(0, 1),
      { tick: at(beat), instrument: 'hihatPedal', velocity: 1, notation: HIHAT_FOOT },
      ...feather,
      ride(1, 0.7),
    ]
  })
}

/** Eighths on the closed hi-hat, the beats louder than the &s and 1 and 3 loudest. */
function hihatEighths(): GrooveHit[] {
  return [0, 1, 2, 3].flatMap((beat): GrooveHit[] => [
    { tick: at(beat), instrument: 'hihatClosed', velocity: beat % 2 === 0 ? 1 : 0.85, notation: HIHAT },
    { tick: at(beat, 1), instrument: 'hihatClosed', velocity: 0.7, notation: HIHAT },
  ])
}

export const GROOVE_PRESETS: readonly GroovePreset[] = [
  { id: 'off', name: 'Off', hits: [] },
  { id: 'jazz', name: 'Jazz ride + hi-hat 2 & 4', hits: jazzRide({ feathered: false }) },
  { id: 'jazzFeathered', name: 'Jazz ride + hi-hat 2 & 4 + feathered bass drum', hits: jazzRide({ feathered: true }) },
  { id: 'hihatEighths', name: 'Straight eighths on hi-hat', hits: hihatEighths() },
]

/** The preset with this id; an id this version of the app doesn't know plays no groove. */
export function groovePreset(id: GroovePresetId): GroovePreset {
  return GROOVE_PRESETS.find((p) => p.id === id) ?? GROOVE_PRESETS[0]
}

/** The hits struck together at one tick, drawn as one chord. */
export interface GrooveChord {
  start: number
  duration: Duration
  hits: GrooveHit[]
}

const DURATION_OF_TICKS: Record<number, Duration> = {
  [TICKS_PER_BEAT]: 'quarter',
  [TICKS_PER_BEAT / 2]: 'eighth',
  [TICKS_PER_BEAT / 4]: 'sixteenth',
}

/** The preset's hits by the tick they are struck at, in tick order. */
export function grooveHitsByTick(id: GroovePresetId): Map<number, GrooveHit[]> {
  const byTick = new Map<number, GrooveHit[]>()
  for (const hit of groovePreset(id).hits) byTick.set(hit.tick, [...(byTick.get(hit.tick) ?? []), hit])
  return byTick
}

/**
 * A bar of the groove preset as the notation draws it: a chord at each tick with hits, held until
 * the next chord or the end of its beat. Every preset starts each beat with a hit and holds each
 * chord for a quarter, an eighth or a sixteenth.
 */
export function grooveChords(id: GroovePresetId): GrooveChord[] {
  const byTick = grooveHitsByTick(id)
  const starts = [...byTick.keys()]
  return starts.map((start, i) => {
    const beatEnd = (Math.floor(start / TICKS_PER_BEAT) + 1) * TICKS_PER_BEAT
    const end = Math.min(starts[i + 1] ?? beatEnd, beatEnd)
    return { start, duration: DURATION_OF_TICKS[end - start], hits: byTick.get(start)! }
  })
}
