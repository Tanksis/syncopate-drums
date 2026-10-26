import { useAppStore } from '@/app/store'
import { hasHits, isBuiltIn } from '@/core'

/**
 * A tinted line over the beat cards while the drummer's own exercise has no hits, saying how to add
 * one; it goes with the first hit. Never on a built-in exercise. `tap` says "Tap" for a touch screen.
 */
export function EditorHint({ tap = false }: { tap?: boolean }) {
  const shown = useAppStore((s) => !hasHits(s.editor.exercise) && !isBuiltIn(s.editor.exercise.id))
  if (!shown) return null
  return (
    <p className="m-0 flex items-baseline gap-2 rounded-md bg-accent-tint px-3 py-1.5 text-sm">
      <span aria-hidden className="text-accent">
        ↓
      </span>
      {tap ? 'Tap' : 'Click'} a square to add a hit: the top row is the snare, the bottom row the kick.
    </p>
  )
}
