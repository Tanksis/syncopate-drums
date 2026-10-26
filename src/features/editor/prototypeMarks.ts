// PROTOTYPE (note marks): accents, flams/drags and roll strokes on snare notes, held in memory only
// (never stored, never played). Three ways to enter them, switched by ?variant= (A, B, C). Never merge.

import { useSyncExternalStore } from 'react'
import type { EditorState, GridPoint } from '@/core'
import { TICKS_PER_BEAT, editorBeatViews, noteId } from '@/core'
import { slotTicks } from '@/core/speller'

export type Grace = 'flam' | 'drag'
export type Roll = 'double' | 'buzz'

export interface Marks {
  accent?: boolean
  grace?: Grace
  roll?: Roll
}

export type MarkKind = 'accent' | Grace | Roll

let marks = new Map<string, Marks>()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export const subscribe = (l: () => void) => (listeners.add(l), () => listeners.delete(l))
export const marksSnapshot = () => marks
export const marksOf = (id: string): Marks => marks.get(id) ?? {}

/** Toggles one mark on a note: an accent on or off; a flam or drag (one or the other); a double or buzz (one or the other). */
export function toggleMark(id: string, kind: MarkKind) {
  const m = { ...marksOf(id) }
  if (kind === 'accent') m.accent = !m.accent || undefined
  else if (kind === 'flam' || kind === 'drag') m.grace = m.grace === kind ? undefined : kind
  else m.roll = m.roll === kind ? undefined : kind
  marks = new Map(marks).set(id, m)
  emit()
}

/** Sets a lane's value outright (variant C cycles through a lane). */
export function setMark<K extends keyof Marks>(id: string, key: K, value: Marks[K]) {
  marks = new Map(marks).set(id, { ...marksOf(id), [key]: value })
  emit()
}

export const useMarks = () => useSyncExternalStore(subscribe, marksSnapshot)

/** The id of the snare note struck at a grid position, or null. */
export function snareNoteAt(state: EditorState, { row, bar, beat, position }: GridPoint): string | null {
  const view = editorBeatViews(state)[bar]?.[beat]
  if (row !== 'snare' || !view || view.snare.positions[position] !== 'hit') return null
  return noteId('snare', bar, beat * TICKS_PER_BEAT + slotTicks(view.triplet)[position])
}

/** The note picked in the notation (variant A), for its popover and keys. */
let picked: { id: string; x: number; y: number } | null = null
const pickListeners = new Set<() => void>()
export function pick(next: typeof picked) {
  picked = next
  pickListeners.forEach((l) => l())
}
export const usePicked = () =>
  useSyncExternalStore(
    (l) => (pickListeners.add(l), () => pickListeners.delete(l)),
    () => picked,
  )

/** The tool held in variant B's palette: 'hit' is the grid as it is today. */
export type Tool = 'hit' | MarkKind
let tool: Tool = 'hit'
const toolListeners = new Set<() => void>()
export function setTool(next: Tool) {
  tool = next
  toolListeners.forEach((l) => l())
}
export const toolNow = () => tool
export const useTool = () =>
  useSyncExternalStore(
    (l) => (toolListeners.add(l), () => toolListeners.delete(l)),
    () => tool,
  )

export const MARK_LABEL: Record<MarkKind, { glyph: string; name: string }> = {
  accent: { glyph: '>', name: 'Accent' },
  flam: { glyph: '♪̸', name: 'Flam' },
  drag: { glyph: '♬', name: 'Drag' },
  double: { glyph: '/', name: 'Double' },
  buzz: { glyph: 'z', name: 'Buzz' },
}

/** A short text of a note's marks, for its grid cell: e.g. "> fl /". */
export function marksText(m: Marks): string {
  return [m.accent && '>', m.grace === 'flam' && 'fl', m.grace === 'drag' && 'dr', m.roll === 'double' && '/', m.roll === 'buzz' && 'z'].filter(Boolean).join(' ')
}
