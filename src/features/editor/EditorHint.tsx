import { useState } from 'react'
import { useAppStore } from '@/app/store'
import { hasHits, isBuiltIn } from '@/core'

/**
 * A tinted line over the beat cards while the drummer's own exercise has no hits, saying how to add
 * one. Never on a built-in exercise. It goes with the first hit but keeps its room, empty, while the
 * exercise stays open, so the beat cards and the notation don't jump; an exercise opened with hits
 * has no room for it. `tap` says "Tap" for a touch screen.
 */
export function EditorHint({ tap = false }: { tap?: boolean }) {
  const id = useAppStore((s) => s.editor.exercise.id)
  const shown = useAppStore((s) => !hasHits(s.editor.exercise) && !isBuiltIn(s.editor.exercise.id))
  // The exercise the hint has been shown on, whose room it keeps.
  const [shownOn, setShownOn] = useState<string | null>(null)
  if (shown && shownOn !== id) setShownOn(id)
  if (!shown && shownOn !== id) return null
  return (
    <p aria-hidden={!shown || undefined} className={`m-0 flex items-baseline gap-2 rounded-md bg-accent-tint px-3 py-1.5 text-sm ${shown ? '' : 'invisible'}`}>
      <span aria-hidden className="text-accent">
        ↓
      </span>
      {tap ? 'Tap' : 'Click'} a square to add a hit: the top row is the snare, the bottom row the kick.
    </p>
  )
}
