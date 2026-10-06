import { useEffect, useRef } from 'react'
import { useAppStore } from '@/app/store'
import type { Figure } from '@/core'
import { FIGURES, REST_FIGURE, beatViews } from '@/core'
import { drawFigure, notationFontsReady } from '@/features/notation/staff'

const TILE_WIDTH = 64
const TILE_HEIGHT = 50

/** The beat figures laid out like the keyboard; clicking a tile enters its figure. */
export function Palette() {
  const dispatch = useAppStore((s) => s.dispatch)
  const current = useAppStore((s) => {
    const { exercise, cursor } = s.editor
    return beatViews(exercise.bars)[cursor.bar][cursor.beat].figure
  })

  const tile = (figure: Figure, wide = false) => (
    <button
      key={figure.key}
      type="button"
      title={figure.hits}
      // Keep focus off the tile, so Space enters a rest rather than clicking it again.
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => dispatch({ type: 'enterFigure', hits: figure.hits })}
      className={`relative cursor-pointer rounded-md border bg-card hover:border-accent ${
        figure === current ? 'border-accent bg-sky-100' : 'border-line'
      } ${wide ? 'px-3 text-xs text-mute' : ''}`}
      style={wide ? { height: TILE_HEIGHT } : { width: TILE_WIDTH, height: TILE_HEIGHT }}
    >
      {wide ? (
        'Space · rest'
      ) : (
        <>
          <span className="absolute top-0.5 left-1 font-mono text-[11px] font-semibold text-mute">{figure.key.toUpperCase()}</span>
          <FigureGlyph hits={figure.hits} />
        </>
      )}
    </button>
  )

  return (
    <div aria-label="Beat figure palette" className="flex flex-col gap-1.5">
      <div className="flex gap-1.5">{FIGURES.filter((f) => f.row === 0).map((f) => tile(f))}</div>
      {/* Row 1, the home row, holds the triplet figures (a later ticket). */}
      <div className="flex gap-1.5 pl-9">
        {FIGURES.filter((f) => f.row === 2).map((f) => tile(f))}
        {tile(REST_FIGURE, true)}
      </div>
    </div>
  )
}

function FigureGlyph({ hits }: { hits: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let live = true
    notationFontsReady.then(() => live && drawFigure(ref.current!, hits, TILE_WIDTH - 2, TILE_HEIGHT - 2))
    return () => {
      live = false
    }
  }, [hits])
  return <div ref={ref} className="pointer-events-none" />
}
