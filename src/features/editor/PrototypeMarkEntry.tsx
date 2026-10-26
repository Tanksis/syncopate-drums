// PROTOTYPE (note marks): the three ways of entering accents, flams/drags and roll strokes. Never merge.
//   A · Pick a note: tap a snare note in the notation; a popover of marks opens over it, and keys > f d / z toggle them.
//   B · Tool palette: pick a tool over the beat cards; tapping a cell with it toggles that mark (and adds the hit if empty).
//   C · Mark lanes: each beat card grows three thin lanes over the snare row (accent, grace, roll); tap to cycle.

import { useEffect } from 'react'
import { useAppStore } from '@/app/store'
import type { BeatView, GridPoint } from '@/core'
import type { Grace, MarkKind, Marks, Roll, Tool } from './prototypeMarks'
import { MARK_LABEL, marksOf, marksText, pick, setMark, setTool, snareNoteAt, toggleMark, toolNow, useMarks, usePicked, useTool } from './prototypeMarks'

const KEY_OF: Record<string, MarkKind> = { '>': 'accent', f: 'flam', d: 'drag', '/': 'double', z: 'buzz' }
const KEY_LABEL: Record<MarkKind, string> = { accent: '>', flam: 'F', drag: 'D', double: '/', buzz: 'Z' }

const isOn = (m: Marks, kind: MarkKind) => (kind === 'accent' ? !!m.accent : m.grace === kind || m.roll === kind)

function MarkButton({ kind, on, onClick, hint }: { kind: MarkKind; on: boolean; onClick: () => void; hint?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex min-w-11 cursor-pointer flex-col items-center rounded-md border px-2 py-1 text-xs ${on ? 'border-accent bg-accent text-on-accent' : 'border-line bg-card text-ink hover:border-accent'}`}
    >
      <span className="font-serif text-base/none font-bold">{MARK_LABEL[kind].glyph}</span>
      <span>{MARK_LABEL[kind].name}</span>
      {hint && <span className={`font-mono text-[10px] ${on ? 'text-on-accent' : 'text-mute'}`}>{KEY_LABEL[kind]}</span>}
    </button>
  )
}

/** A: the popover over the picked note, and its keys. */
export function MarkPopover() {
  const picked = usePicked()
  useMarks()
  useEffect(() => {
    if (!picked) return
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 'Escape') {
        e.stopPropagation()
        return pick(null)
      }
      const kind = KEY_OF[e.key.toLowerCase()] ?? KEY_OF[e.key]
      if (!kind) return
      e.preventDefault()
      e.stopPropagation()
      toggleMark(picked.id, kind)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [picked])
  if (!picked) return null
  const m = marksOf(picked.id)
  return (
    <div
      role="dialog"
      aria-label="Marks on this note"
      className="absolute z-30 flex -translate-x-1/2 -translate-y-full items-stretch gap-1 rounded-lg border border-line bg-panel p-1.5 shadow-card"
      style={{ left: picked.x, top: picked.y - 6 }}
    >
      <MarkButton kind="accent" on={isOn(m, 'accent')} onClick={() => toggleMark(picked.id, 'accent')} hint />
      <span className="w-px bg-line" />
      {(['flam', 'drag'] as const).map((k) => (
        <MarkButton key={k} kind={k} on={isOn(m, k)} onClick={() => toggleMark(picked.id, k)} hint />
      ))}
      <span className="w-px bg-line" />
      {(['double', 'buzz'] as const).map((k) => (
        <MarkButton key={k} kind={k} on={isOn(m, k)} onClick={() => toggleMark(picked.id, k)} hint />
      ))}
      <button type="button" aria-label="Close" onClick={() => pick(null)} className="cursor-pointer px-1 text-mute hover:text-accent">
        ✕
      </button>
    </div>
  )
}

const TOOLS: Tool[] = ['hit', 'accent', 'flam', 'drag', 'double', 'buzz']

/** B: the tool palette over the beat cards. */
export function MarkPalette() {
  const tool = useTool()
  return (
    <div role="toolbar" aria-label="Note tool" className="flex flex-wrap items-center gap-1">
      <span className="mr-1 text-xs text-mute">Tap cells to</span>
      {TOOLS.map((t) => (
        <button
          key={t}
          type="button"
          aria-pressed={tool === t}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setTool(t)}
          className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${tool === t ? 'border-accent bg-accent text-on-accent' : 'border-line bg-card text-ink hover:border-accent'}`}
        >
          <span className="font-serif text-sm/none font-bold">{t === 'hit' ? '●' : MARK_LABEL[t].glyph}</span>
          {t === 'hit' ? 'Hit' : MARK_LABEL[t].name}
        </button>
      ))}
    </div>
  )
}

/** B: a tap on a cell with a mark tool held. True when it took the tap (the grid does nothing more). */
export function applyTool(point: GridPoint): boolean {
  const tool = toolNow()
  if (tool === 'hit' || point.row !== 'snare') return false
  const { editor, dispatch } = useAppStore.getState()
  let id = snareNoteAt(editor, point)
  if (!id) {
    dispatch({ type: 'toggleGridPosition', ...point })
    id = snareNoteAt(useAppStore.getState().editor, point)
  }
  if (id) toggleMark(id, tool)
  return true
}

const GRACE_CYCLE: (Grace | undefined)[] = [undefined, 'flam', 'drag']
const ROLL_CYCLE: (Roll | undefined)[] = [undefined, 'double', 'buzz']
const next = <T,>(cycle: T[], now: T) => cycle[(cycle.indexOf(now) + 1) % cycle.length]

/** C: a beat card's three mark lanes over its snare row, a slot per grid position. */
export function MarkLanes({ bar, beat, view }: { bar: number; beat: number; view: BeatView }) {
  useMarks()
  const editor = useAppStore((s) => s.editor)
  const ids = view.snare.positions.map((_, position) => snareNoteAt(editor, { row: 'snare', bar, beat, position }))
  const lane = (name: string, show: (m: Marks) => string, tap: (id: string, m: Marks) => void) => (
    <div className="flex items-center gap-1" aria-label={`${name} lane`}>
      {ids.map((id, i) => {
        const m = id ? marksOf(id) : {}
        const text = id ? show(m) : ''
        return (
          <button
            key={i}
            type="button"
            disabled={!id}
            title={id ? `${name}: tap to change` : 'No snare hit here'}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation()
              if (id) tap(id, m)
            }}
            className={`flex h-5 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-sm text-[11px]/none font-bold disabled:cursor-default ${
              !id ? 'opacity-0' : text ? 'bg-accent text-on-accent' : 'border border-dashed border-edge text-mute hover:border-accent'
            }`}
          >
            {text || '·'}
          </button>
        )
      })}
    </div>
  )
  return (
    <div className="flex flex-col gap-0.5">
      {lane('Accent', (m) => (m.accent ? '>' : ''), (id) => toggleMark(id, 'accent'))}
      {lane('Grace', (m) => (m.grace === 'flam' ? 'fl' : m.grace === 'drag' ? 'dr' : ''), (id, m) => setMark(id, 'grace', next(GRACE_CYCLE, m.grace)))}
      {lane('Roll', (m) => (m.roll === 'double' ? '/' : m.roll === 'buzz' ? 'z' : ''), (id, m) => setMark(id, 'roll', next(ROLL_CYCLE, m.roll)))}
    </div>
  )
}

/** Every variant: a cell's marks in small print under its disc. */
export function CellMarks({ id }: { id: string | null }) {
  useMarks()
  const text = id ? marksText(marksOf(id)) : ''
  if (!text) return null
  return <span className="pointer-events-none absolute bottom-0 left-0 right-0 text-center font-mono text-[9px]/none font-bold text-accent">{text}</span>
}
