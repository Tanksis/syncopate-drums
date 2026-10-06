// The exercise core: every rule that can be stated without I/O.
// No React, DOM, Web Audio or IndexedDB imports belong here (see tsconfig.core.json).

/** Exercises are in 4/4. */
export const BEATS_PER_BAR = 4

/** Ticks are derived, never stored: 12 per beat fits both the sixteenth and the triplet grid. */
export const TICKS_PER_BEAT = 12

export const TICKS_PER_BAR = BEATS_PER_BAR * TICKS_PER_BEAT

export const MIN_BPM = 30
export const MAX_BPM = 300

/** Keeps a typed or dragged tempo inside the supported 30–300 BPM range, as a whole number. */
export function clampBpm(bpm: number): number {
  if (Number.isNaN(bpm)) return MIN_BPM
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)))
}
