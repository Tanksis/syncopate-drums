// Strokes that vary as a drummer's do: each from a band of nearby recordings, picked at random.

/**
 * Which of a band's `count` files a stroke plays, from `random` (0 to under 1): any but the one
 * just played (`last`), each equally likely.
 */
export function pickStroke(count: number, last: number | undefined, random: number): number {
  if (last === undefined || count === 1) return Math.floor(random * count)
  // A pick among the others, then stepped over the last one.
  const pick = Math.floor(random * (count - 1))
  return pick < last ? pick : pick + 1
}

/** How far, in dB, a stroke's level may stray either way from its band's. */
const STROKE_SPREAD_DB = 1

/** The gain that varies a stroke's level, from `random` (0 to 1): up to STROKE_SPREAD_DB softer or louder. */
export function strokeGain(random: number): number {
  return 10 ** (((random * 2 - 1) * STROKE_SPREAD_DB) / 20)
}
