// The beat figures: the one-beat rhythms the speller writes with default holds. Once entered by
// keys from a palette; since ADR 0009 the grid is the only entry, and the keys are their names.

/**
 * A one-beat rhythm, defined by where its hits fall: `x` is a hit, `.` no hit, one character
 * per sixteenth, or per triplet eighth for the three-character triplet figures. Each hit holds
 * until the next hit or the end of the beat.
 */
export interface Figure {
  /** Its name: the key that once entered it. */
  key: string
  hits: string
}

export const FIGURES: readonly Figure[] = [
  ['1', 'x...'], ['2', 'x.x.'], ['3', '..x.'], ['4', 'xxxx'], ['5', 'x.xx'],
  ['6', 'xxx.'], ['7', 'x..x'], ['8', 'xx.x'], ['9', '.xxx'], ['0', '..xx'],
  ['a', 'xxx'], ['s', 'x.x'], ['d', 'xx.'], ['f', '.xx'], ['g', '.x.'], ['h', '..x'],
  ['z', '.x..'], ['x', '...x'], ['c', '.xx.'], ['v', '.x.x'], ['b', 'xx..'],
].map(([key, hits]): Figure => ({ key, hits }))

/** Three characters, one per triplet eighth, make a triplet figure. */
export function isTripletHits(hits: string): boolean {
  return hits.length === 3
}

/** `-`: a beat with no hits. */
export const REST_FIGURE: Figure = { key: '-', hits: '....' }

export function figureOfHits(hits: string): Figure | undefined {
  return hits === REST_FIGURE.hits ? REST_FIGURE : FIGURES.find((f) => f.hits === hits)
}
