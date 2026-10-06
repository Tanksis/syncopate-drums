// The beat figures of the grid editor's palette and the keys that pick them.

/**
 * A one-beat rhythm, defined by where its hits fall: `x` is a hit, `.` no hit, one character
 * per sixteenth. Each hit holds until the next hit or the end of the beat.
 */
export interface Figure {
  /** The key that enters it, as `KeyboardEvent.key` reports it unshifted. */
  key: string
  hits: string
  /** Keyboard row: 0 = number row, 2 = bottom row. Row 1 (home row) holds the triplets. */
  row: 0 | 1 | 2
}

export const FIGURES: readonly Figure[] = [
  ['1', 'x...'], ['2', 'x.x.'], ['3', '..x.'], ['4', 'xxxx'], ['5', 'x.xx'],
  ['6', 'xxx.'], ['7', 'x..x'], ['8', 'xx.x'], ['9', '.xxx'], ['0', '..xx'],
  ['z', '.x..'], ['x', '...x'], ['c', '.xx.'], ['v', '.x.x'], ['b', 'xx..'],
].map(([key, hits]): Figure => ({ key, hits, row: /\d/.test(key) ? 0 : 2 }))

/** Space: a beat with no hits. */
export const REST_FIGURE: Figure = { key: ' ', hits: '....', row: 2 }

export function figureOfHits(hits: string): Figure | undefined {
  return hits === REST_FIGURE.hits ? REST_FIGURE : FIGURES.find((f) => f.hits === hits)
}
