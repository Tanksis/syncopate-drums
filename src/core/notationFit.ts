// How big to draw the notation: short exercises are scaled up to fill the notation area, never
// past MAX_NOTATION_SCALE and never onto more lines than at the usual size. Busy music needs wider
// bars, and where even one bar a line is too narrow for it, the notation is drawn smaller.

import { TICKS_PER_BEAT } from './model'
import type { StaffBar } from './staffParts'

/** The notation's layout at scale 1, in pixels. */
export const NOTATION_LAYOUT = {
  /** Bars on a line at most. */
  barsPerLine: 4,
  /** A bar of one or two events a beat is never drawn narrower than this; a narrow area gets fewer bars a line. */
  minBarWidth: 190,
  /** A bar of three events a beat (triplets) is never narrower than this. */
  tripletBarWidth: 260,
  /** A bar of four or more events a beat (sixteenths) is never narrower than this. */
  sixteenthBarWidth: 330,
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
/** Where one bar a line is narrower than its minimum, the notation is drawn smaller, but no smaller than this. */
export const MIN_NOTATION_SCALE = 0.8
/** The scale goes up in hundredths, by this many. */
const SCALE_STEP = 5

/** The width left for bars on a line at a scale, in the drawing's units. */
function availableAt(width: number, scale: number): number {
  const { clefWidth, margin } = NOTATION_LAYOUT
  return width / scale - 2 * margin - clefWidth
}

/** Bars on a line at a scale: as many as fit the width at `minBarWidth` each, 1 to 4. */
function barsPerLineAt(width: number, scale: number, minBarWidth: number): number {
  return Math.max(1, Math.min(NOTATION_LAYOUT.barsPerLine, Math.floor(availableAt(width, scale) / minBarWidth)))
}

/**
 * The narrowest an exercise's bars may be drawn, set by its busiest beat: the most events (notes
 * and rests) in one beat of either part, anywhere in the exercise. One width for the whole exercise,
 * so its bars stay equal and line up.
 */
export function minBarWidthFor(parts: readonly StaffBar[]): number {
  let busiest = 0
  for (const bar of parts) {
    for (const part of [bar.hands, bar.feet]) {
      const perBeat = new Map<number, number>()
      for (const event of part) {
        if (event.kind === 'space') continue
        const beat = Math.floor(event.start / TICKS_PER_BEAT)
        const count = (perBeat.get(beat) ?? 0) + 1
        perBeat.set(beat, count)
        busiest = Math.max(busiest, count)
      }
    }
  }
  const { minBarWidth, tripletBarWidth, sixteenthBarWidth } = NOTATION_LAYOUT
  return busiest >= 4 ? sixteenthBarWidth : busiest === 3 ? tripletBarWidth : minBarWidth
}

/**
 * The scale (0.8 to 1.6, in steps of 0.05) and bars a line to draw an exercise of `bars` bars at,
 * in an area `width` by `height`, given one line's height at scale 1 and the narrowest a bar may be
 * (`minBarWidth`, 190 unless the music is busy). The largest scale that needs no more lines than
 * scale 1 and fits the height; 1 if even scale 1 overflows the height; below 1, the largest scale
 * at which one bar a line is `minBarWidth` wide (no lower than 0.8), if it isn't at 1. Also the
 * width of a bar in the drawing's units (before scaling), past the first bar's clef: an exercise on
 * one line shares the line (up to `maxBarWidth` a bar); a longer one gets a share of a full line a
 * bar, so bars line up.
 */
export function notationFit({
  bars,
  width,
  height,
  lineHeight,
  minBarWidth = NOTATION_LAYOUT.minBarWidth,
}: {
  bars: number
  width: number
  height: number
  lineHeight: number
  minBarWidth?: number
}): {
  scale: number
  barsPerLine: number
  barWidth: number
} {
  const linesAt = (scale: number) => Math.ceil(bars / barsPerLineAt(width, scale, minBarWidth))
  const heightAt = (scale: number) => (linesAt(scale) * lineHeight + NOTATION_LAYOUT.staveTop) * scale
  const lines = linesAt(1)
  let hundredths = 100
  if (availableAt(width, 1) < minBarWidth) {
    // Too narrow for even one bar: smaller, until it fits or reaches the floor.
    do hundredths -= SCALE_STEP
    while (hundredths > MIN_NOTATION_SCALE * 100 && availableAt(width, hundredths / 100) < minBarWidth)
  } else if (heightAt(1) <= height) {
    for (let h = 100 + SCALE_STEP; h <= MAX_NOTATION_SCALE * 100; h += SCALE_STEP) {
      const scale = h / 100
      if (linesAt(scale) <= lines && heightAt(scale) <= height) hundredths = h
    }
  }
  const scale = hundredths / 100
  const barsPerLine = barsPerLineAt(width, scale, minBarWidth)
  const available = availableAt(width, scale)
  // On one line the bars share it; over more, every bar gets a share of a full line so they line up.
  const barWidth = Math.floor(
    bars <= barsPerLine ? Math.min(available / bars, NOTATION_LAYOUT.maxBarWidth) : available / barsPerLine,
  )
  return { scale, barsPerLine, barWidth }
}
