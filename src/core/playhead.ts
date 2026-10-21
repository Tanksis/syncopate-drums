/** A point the playhead passes through in a bar: where a written event starts, or the bar's end. */
export interface PlayheadAnchor {
  tick: number
  x: number
}

/** The x of the playhead at a tick in a bar, from the bar's anchors in tick order. */
export function playheadX(anchors: readonly PlayheadAnchor[], tick: number): number {
  const after = anchors.findIndex((a) => a.tick >= tick)
  if (after === -1) return anchors[anchors.length - 1].x
  const [from, to] = [anchors[after - 1], anchors[after]]
  if (!from || to.tick === tick) return to.x
  return from.x + ((to.x - from.x) * (tick - from.tick)) / (to.tick - from.tick)
}
