import { useAppStore } from '@/app/store'
import type { BeatView, GridPosition } from '@/core'
import { REST_FIGURE, beatViews, inLoopRange } from '@/core'

/**
 * The bars and beats of the exercise, the main editor. Each beat box shows its grid positions: a
 * hit, a hold bar for a note still sounding, or an empty dot. Clicking a position turns a hit on or
 * off; clicking elsewhere on a beat moves the cursor to it. A beat's 3/16 toggle, or a right-click
 * on its box, switches it between the triplet and the sixteenth grid. The cursor, the bar selection
 * and a set loop range are shaded, and a bar's ✕ (shown on hover) deletes it.
 */
export function BeatStrip() {
  const bars = useAppStore((s) => s.editor.exercise.bars)
  const pendingGrid = useAppStore((s) => s.editor.pendingGrid)
  const cursor = useAppStore((s) => s.editor.cursor)
  const selection = useAppStore((s) => s.editor.selection)
  const loopRange = useAppStore((s) => s.editor.exercise.practice.loopRange)
  const dispatch = useAppStore((s) => s.dispatch)
  const views = beatViews(bars, pendingGrid)
  /** The beat after this one, if any, to run a hold bar on into it. */
  const nextBeat = (b: number, beat: number): BeatView | undefined =>
    beat < views[b].length - 1 ? views[b][beat + 1] : views[b + 1]?.[0]

  return (
    // The strip's right-click switches grids, so the browser's menu stays shut over it.
    <div aria-label="Beat strip" className="flex flex-wrap gap-2" onContextMenu={(e) => e.preventDefault()}>
      {views.map((beats, b) => {
        const selected = selection !== null && b >= selection.first && b <= selection.last
        const looped = inLoopRange(loopRange, b)
        return (
          <div
            key={b}
            aria-selected={selected || undefined}
            title={looped ? 'In the loop range' : undefined}
            // A selected bar in the loop range keeps the loop shading inside the selection's border.
            className={`group relative flex items-center gap-0.5 rounded-lg border px-1 pt-1 pb-3 ${
              selected ? 'border-accent' : looped ? 'border-loop-line' : 'border-line'
            } ${looped ? 'bg-loop' : selected ? 'bg-sky-100' : 'bg-card'}`}
          >
            <span className="w-5 text-center font-mono text-[11px] text-mute">{b + 1}</span>
            {beats.map((view, beat) => {
              const current = cursor.bar === b && cursor.beat === beat
              const tiedOn = nextBeat(b, beat)?.positions[0] === 'hold'
              const switchGrid = () => dispatch({ type: 'setBeatGrid', bar: b, beat, triplet: !view.triplet })
              return (
                <div
                  key={beat}
                  aria-label={`Bar ${b + 1}, beat ${beat + 1}`}
                  aria-current={current || undefined}
                  title={[view.tiedInto && 'tied into', view.cutShort && 'cut short'].filter(Boolean).join(', ') || undefined}
                  onClick={() => dispatch({ type: 'moveTo', bar: b, beat })}
                  onContextMenu={switchGrid}
                  className={`relative flex h-9 w-16 cursor-pointer items-stretch rounded-md border border-stone-300 bg-card ${
                    current ? 'outline-3 -outline-offset-2 outline-accent' : ''
                  }`}
                >
                  {view.tiedInto && <span className="absolute -top-2 -left-2 text-sm text-accent">⌒</span>}
                  {view.figure && view.figure !== REST_FIGURE && (
                    <span className="pointer-events-none absolute top-0 right-0.5 font-mono text-[9px]/[1] text-mute">
                      {view.figure.key.toUpperCase()}
                    </span>
                  )}
                  {view.positions.map((position, i) => (
                    <PositionCell
                      key={i}
                      label={`Bar ${b + 1}, beat ${beat + 1}, position ${i + 1}: ${position}`}
                      position={position}
                      holdsOn={i < view.positions.length - 1 ? view.positions[i + 1] === 'hold' : tiedOn}
                      onClick={() => dispatch({ type: 'toggleGridPosition', bar: b, beat, position: i })}
                    />
                  ))}
                  <button
                    type="button"
                    aria-label={`Bar ${b + 1}, beat ${beat + 1}: ${view.triplet ? 'triplet' : 'sixteenth'} grid`}
                    title={`On the ${view.triplet ? 'triplet' : 'sixteenth'} grid: switch to ${view.triplet ? 'sixteenths' : 'triplets'} (or right-click the beat)`}
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.stopPropagation()
                      switchGrid()
                    }}
                    className={`absolute -bottom-2 left-1/2 min-w-4 -translate-x-1/2 cursor-pointer rounded border bg-card px-0.5 font-mono text-[9px]/[11px] hover:border-accent hover:text-accent ${
                      view.triplet ? 'border-accent text-accent' : 'border-line text-mute'
                    }`}
                  >
                    {view.triplet ? '3' : '16'}
                  </button>
                </div>
              )
            })}
            <button
              type="button"
              title={`Delete bar ${b + 1} (Ctrl+Backspace)`}
              aria-label={`Delete bar ${b + 1}`}
              tabIndex={-1}
              // Keep focus off the button, so Space and Enter go to the editor rather than clicking it.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => dispatch({ type: 'deleteBar', bar: b })}
              className="absolute -top-2 -right-2 hidden size-5 cursor-pointer items-center justify-center rounded-full border border-line bg-card text-[10px] text-mute group-hover:flex hover:border-accent hover:text-accent"
            >
              ✕
            </button>
          </div>
        )
      })}
    </div>
  )
}

/**
 * One grid position: a hit's dot, a plain dot when empty, and the hold bar running in from the
 * left where the note sounds on here and out to the right where it sounds on after.
 */
function PositionCell({
  label,
  position,
  holdsOn,
  onClick,
}: {
  label: string
  position: GridPosition
  /** The note here (struck or held) still sounds at the next position, so the bar runs on. */
  holdsOn: boolean
  onClick: () => void
}) {
  const sounding = position !== 'empty'
  return (
    <button
      type="button"
      aria-label={label}
      tabIndex={-1}
      // Keep focus off the position, so Space and Enter go to the editor rather than clicking it.
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="group/pos relative flex flex-1 cursor-pointer items-center justify-center"
    >
      {position === 'hold' && <span className="absolute top-1/2 left-0 h-1 w-1/2 -translate-y-1/2 bg-ink/70" />}
      {sounding && holdsOn && <span className="absolute top-1/2 right-0 h-1 w-1/2 -translate-y-1/2 bg-ink/70" />}
      {position === 'hit' ? (
        <span className="relative size-2.5 rounded-full bg-ink group-hover/pos:bg-accent" />
      ) : position === 'empty' ? (
        <span className="relative size-1 rounded-full bg-stone-400 group-hover/pos:size-2 group-hover/pos:bg-accent" />
      ) : (
        <span className="relative size-2 rounded-full group-hover/pos:bg-accent/60" />
      )}
    </button>
  )
}
