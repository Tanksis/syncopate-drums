// The groove presets: predefined groove layers played and drawn above the exercise, the same in
// every bar, and the hi-hat foot setting layered with them (ADR 0010).

import type { GroovePresetId, HihatFoot, TimeSignature } from './model'
import { HIHAT_FOOT_SETTINGS, TICKS_PER_BEAT } from './model'
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
  /** Every bar's hits, in tick order, in a bar of this many beats. */
  hits: (beats: number) => GrooveHit[]
}

const RIDE: GrooveNotation = { key: 'f/5', notehead: 'x' }
const HIHAT: GrooveNotation = { key: 'g/5', notehead: 'x' }
const HIHAT_FOOT: GrooveNotation = { key: 'd/4', notehead: 'x' }
const BASS_DRUM: GrooveNotation = { key: 'f/4', notehead: 'normal' }

/** The tick of a beat, or of the & of it. */
const at = (beat: number, eighth = 0) => beat * TICKS_PER_BEAT + eighth * (TICKS_PER_BEAT / 2)

const hihatFootHit = (tick: number): GrooveHit => ({ tick, instrument: 'hihatPedal', velocity: 1, notation: HIHAT_FOOT })

/** The bar's beats, from 0. */
const beatsOfBar = (beats: number) => Array.from({ length: beats }, (_, beat) => beat)

/**
 * The jazz ride pattern, louder on 2 and 4, with the hi-hat foot on 2 and 4, and optionally a
 * feathered bass drum on every beat. Beats 2 and 4 have the & (in 3/4 and 2/4, beat 2 only).
 */
function jazzRide(beats: number, { feathered }: { feathered: boolean }): GrooveHit[] {
  return beatsOfBar(beats).flatMap((beat): GrooveHit[] => {
    const ride = (eighth: number, velocity: number): GrooveHit =>
      ({ tick: at(beat, eighth), instrument: 'ride', velocity, notation: RIDE })
    const feather: GrooveHit[] = feathered
      ? [{ tick: at(beat), instrument: 'kickFeathered', velocity: 1, notation: BASS_DRUM }]
      : []
    if (beat % 2 === 0) return [ride(0, 0.85), ...feather]
    return [
      ride(0, 1),
      hihatFootHit(at(beat)),
      ...feather,
      ride(1, 0.7),
    ]
  })
}

/** Eighths on the closed hi-hat, the beats louder than the &s and 1 and 3 loudest. */
function hihatEighths(beats: number): GrooveHit[] {
  return beatsOfBar(beats).flatMap((beat): GrooveHit[] => [
    { tick: at(beat), instrument: 'hihatClosed', velocity: beat % 2 === 0 ? 1 : 0.85, notation: HIHAT },
    { tick: at(beat, 1), instrument: 'hihatClosed', velocity: 0.7, notation: HIHAT },
  ])
}

export const GROOVE_PRESETS: readonly GroovePreset[] = [
  { id: 'off', name: 'Off', hits: () => [] },
  { id: 'jazz', name: 'Jazz ride + hi-hat 2 & 4', hits: (beats) => jazzRide(beats, { feathered: false }) },
  {
    id: 'jazzFeathered',
    name: 'Jazz ride + hi-hat 2 & 4 + feathered bass drum',
    hits: (beats) => jazzRide(beats, { feathered: true }),
  },
  { id: 'hihatEighths', name: 'Straight eighths on hi-hat', hits: hihatEighths },
]

/** The preset with this id; an id this version of the app doesn't know plays no groove. */
export function groovePreset(id: GroovePresetId): GroovePreset {
  return GROOVE_PRESETS.find((p) => p.id === id) ?? GROOVE_PRESETS[0]
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

/** The hi-hat foot settings that fit a time signature: 2 & 4 only in 4/4. */
export function hihatFootOptions(timeSignature: TimeSignature): HihatFoot[] {
  return HIHAT_FOOT_SETTINGS.filter((foot) => foot !== 'twoAndFour' || timeSignature === '4/4')
}

/**
 * The groove layer's hits by the tick they are struck at, in tick order, in a bar of `beats`: the
 * preset's, and with the hi-hat foot setting on, its hits in place of the preset's own hi-hat foot.
 */
export function grooveHitsByTick(id: GroovePresetId, hihatFoot: HihatFoot = 'off', beats = 4): Map<number, GrooveHit[]> {
  const preset = groovePreset(id).hits(beats)
  const foot = hihatFootTicks(hihatFoot, beats).map(hihatFootHit)
  const hits = hihatFoot === 'off' ? preset : [...preset.filter((hit) => hit.instrument !== 'hihatPedal'), ...foot]
  const byTick = new Map<number, GrooveHit[]>()
  for (const hit of [...hits].sort((a, b) => a.tick - b.tick)) byTick.set(hit.tick, [...(byTick.get(hit.tick) ?? []), hit])
  return byTick
}
