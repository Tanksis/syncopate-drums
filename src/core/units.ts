// The units and ranges the exercise and the metronome share. A leaf module: it imports nothing, so
// model.ts and metronome.ts can both build on it without importing each other's values.

/** Ticks are derived, never stored: 12 per beat fits both the sixteenth and the triplet grid. */
export const TICKS_PER_BEAT = 12

export const MIN_BPM = 30
export const MAX_BPM = 300

/** The loudest a layer's volume goes: a little headroom above its usual level. */
export const MAX_VOLUME = 1.5

/** Keeps a typed or dragged tempo inside the supported range (30–300 BPM by default), as a whole number. */
export function clampBpm(bpm: number, min = MIN_BPM): number {
  if (Number.isNaN(bpm)) return min
  return Math.min(MAX_BPM, Math.max(min, Math.round(bpm)))
}
