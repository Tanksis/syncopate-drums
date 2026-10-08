// How big to draw the notation: short exercises are scaled up to fill the notation area, never
// past MAX_NOTATION_SCALE and never onto more lines than at the usual size.

import type { Exercise } from './model'
import { ROWS } from './model'

/** The notation's layout at scale 1, in pixels. */
export const NOTATION_LAYOUT = {
  /** Bars on a line at most. */
  barsPerLine: 4,
  /** A bar is never drawn narrower than this; a narrow area gets fewer bars a line. */
  minBarWidth: 190,
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

/** Bars on a line at a scale: as many as fit the width, 1 to 4. */
function barsPerLineAt(width: number, scale: number): number {
  const { barsPerLine, minBarWidth, clefWidth, margin } = NOTATION_LAYOUT
  const available = width / scale - 2 * margin - clefWidth
  return Math.max(1, Math.min(barsPerLine, Math.floor(available / minBarWidth)))
}

/**
 * The scale (1 to 1.6, in steps of 0.05) and bars a line to draw an exercise of `bars` bars at,
 * in an area `width` by `height`, given one line's height at scale 1. The largest scale that needs
 * no more lines than scale 1 and fits the height; 1 if even scale 1 overflows the height.
 */
export function notationFit({ bars, width, height, lineHeight }: { bars: number; width: number; height: number; lineHeight: number }): {
  scale: number
  barsPerLine: number
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
  return { scale, barsPerLine: barsPerLineAt(width, scale) }
}

/** Whether any row of any bar has a note. */
export function hasHits(exercise: Exercise): boolean {
  return exercise.bars.some((bar) => ROWS.some((row) => bar[row].some((item) => item.kind === 'note')))
}
