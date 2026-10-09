import { useEffect, useRef } from 'react'
import { useAppStore } from '@/app/store'
import { keepFocus } from '@/components/keepFocus'
import type { EditCommand, Figure } from '@/core'
import { FIGURES, REST_FIGURE, editorBeatViews } from '@/core'
import { drawFigure, notationFontsReady } from '@/features/notation/staff'

const TILE_WIDTH = 64
const TILE_HEIGHT = 50

/** The beat figures laid out like the keyboard; clicking a tile enters its figure. */
export function Palette() {
  const dispatch = useAppStore((s) => s.dispatch)
  // The cursor's beat, in its row, as the editor shows it: on the pending grid, no sixteenth figure is lit.
  const current = useAppStore((s) => {
    const { cursor } = s.editor
    return editorBeatViews(s.editor)[cursor.bar][cursor.beat][cursor.row].figure
  })

  const tile = (figure: Figure, wide = false) => (
    <button
      key={figure.key}
      type="button"
      title={figure.hits}
      // Keep focus off the tile, so Space pauses rather than clicking it again.
      onMouseDown={keepFocus}
      onClick={() => dispatch({ type: 'enterFigure', hits: figure.hits })}
      className={`relative cursor-pointer rounded-md border bg-card hover:border-accent ${
        figure === current ? 'border-accent bg-sky-100' : 'border-line'
      } ${wide ? 'px-3 text-xs text-mute' : ''}`}
      style={wide ? { height: TILE_HEIGHT } : { width: TILE_WIDTH, height: TILE_HEIGHT }}
    >
      {wide ? (
        '- · rest'
      ) : (
        <>
          <span className="absolute top-0.5 left-1 font-mono text-[11px] font-semibold text-mute">{figure.key.toUpperCase()}</span>
          <FigureGlyph hits={figure.hits} />
        </>
      )}
    </button>
  )

  const toggle = (label: string, title: string, command: EditCommand) => (
    <button
      type="button"
      title={title}
      onMouseDown={keepFocus}
      onClick={() => dispatch(command)}
      className="cursor-pointer rounded-md border border-line bg-card px-3 text-xs text-mute hover:border-accent"
      style={{ height: TILE_HEIGHT }}
    >
      {label}
    </button>
  )

  return (
    <div aria-label="Beat figure palette" className="flex flex-col gap-1.5">
      <div className="flex gap-1.5">{FIGURES.filter((f) => f.row === 0).map((f) => tile(f))}</div>
      <div className="flex gap-1.5 pl-5">{FIGURES.filter((f) => f.row === 1).map((f) => tile(f))}</div>
      <div className="flex gap-1.5 pl-9">
        {FIGURES.filter((f) => f.row === 2).map((f) => tile(f))}
        {tile(REST_FIGURE, true)}
        {toggle('T · tie', 'Tie into the beat', { type: 'toggleTie' })}
        {toggle('. · cut short', 'End the beat’s last note early', { type: 'toggleCutShort' })}
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
