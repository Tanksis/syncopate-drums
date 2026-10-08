// How big to draw the notation: short exercises are scaled up to fill the notation area, never
// past MAX_NOTATION_SCALE and never onto more lines than at the usual size.

/** The notation's layout at scale 1, in pixels. */
export const NOTATION_LAYOUT = {
  /** Bars on a line at most. */
  barsPerLine: 4,
  /** A bar is never drawn narrower than this; a narrow area gets fewer bars a line. */
  minBarWidth: 190,
  /** An exercise on one line spreads its bars across it, but never wider than this. */
  maxBarWidth: 475,
  /** Room for the clef (and, on the first line, the time signature) before the first bar's notes. */
  clefWidth: 70,
  /** Left and right of the staff. */
  margin: 10,
  /** Above the first line. */
  staveTop: 10,
} as const

export const MAX_NOTATION_SCALE = 1.6
/** The scale goes up in hundredths, by this many. */
const SCALE_STEP = 5

/** The width left for bars on a line at a scale, in the drawing's units. */
function availableAt(width: number, scale: number): number {
  const { clefWidth, margin } = NOTATION_LAYOUT
  return width / scale - 2 * margin - clefWidth
}

/** Bars on a line at a scale: as many as fit the width, 1 to 4. */
function barsPerLineAt(width: number, scale: number): number {
  const { barsPerLine, minBarWidth } = NOTATION_LAYOUT
  return Math.max(1, Math.min(barsPerLine, Math.floor(availableAt(width, scale) / minBarWidth)))
}

/**
 * The scale (1 to 1.6, in steps of 0.05) and bars a line to draw an exercise of `bars` bars at,
 * in an area `width` by `height`, given one line's height at scale 1. The largest scale that needs
 * no more lines than scale 1 and fits the height; 1 if even scale 1 overflows the height. Also the
 * width of a bar at scale 1, past the first bar's clef: an exercise on one line shares the line
 * (up to `maxBarWidth` a bar); a longer one gets a share of a full line a bar, so bars line up.
 */
export function notationFit({ bars, width, height, lineHeight }: { bars: number; width: number; height: number; lineHeight: number }): {
  scale: number
  barsPerLine: number
  barWidth: number
} {
  const linesAt = (scale: number) => Math.ceil(bars / barsPerLineAt(width, scale))
  const heightAt = (scale: number) => (linesAt(scale) * lineHeight + NOTATION_LAYOUT.staveTop) * scale
  const lines = linesAt(1)
  let hundredths = 100
  if (heightAt(1) <= height) {
    for (let h = 100 + SCALE_STEP; h <= MAX_NOTATION_SCALE * 100; h += SCALE_STEP) {
      const scale = h / 100
      if (linesAt(scale) <= lines && heightAt(scale) <= height) hundredths = h
    }
  }
  const scale = hundredths / 100
  const barsPerLine = barsPerLineAt(width, scale)
  const available = availableAt(width, scale)
  // On one line the bars share it; over more, every bar gets a share of a full line so they line up.
  const barWidth = Math.floor(
    bars <= barsPerLine ? Math.min(available / bars, NOTATION_LAYOUT.maxBarWidth) : available / barsPerLine,
  )
  return { scale, barsPerLine, barWidth }
}
