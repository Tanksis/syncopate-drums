import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/app/store'
import { isExample } from '@/core'

/** How long the notice stays highlighted after an example refuses an edit. */
const HIGHLIGHT_MS = 700

/**
 * With an example open, says that it's read-only (ADR 0008). Each edit the example refuses (a click
 * on a cell, a figure key) highlights the notice briefly, so the drummer can see why nothing changed.
 */
export function ExampleNotice() {
  const open = useAppStore((s) => isExample(s.editor.exercise.id))
  const refusedEdits = useAppStore((s) => s.refusedEdits)
  const [highlighted, setHighlighted] = useState(false)
  const seen = useRef(refusedEdits)

  useEffect(() => {
    if (refusedEdits === seen.current) return
    seen.current = refusedEdits
    setHighlighted(true)
    const timer = setTimeout(() => setHighlighted(false), HIGHLIGHT_MS)
    return () => clearTimeout(timer)
  }, [refusedEdits])

  if (!open) return null
  return (
    <p
      role="status"
      className={`m-0 border-b px-4 py-1.5 transition-colors duration-300 ${
        highlighted ? 'border-loop-line bg-loop text-ink' : 'border-line bg-panel text-mute'
      }`}
    >
      <span className="font-semibold text-ink">Example: read-only.</span> Its notes and sticking can’t be changed, and
      tempo, loop, groove and swing changes aren’t kept.
    </p>
  )
}
