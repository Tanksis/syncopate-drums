import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/app/store'
import { Button } from '@/components/Button'
import { isBuiltIn, isRudiment } from '@/core'

/** How long the notice stays highlighted after a built-in exercise refuses an edit. */
const HIGHLIGHT_MS = 700

/**
 * With an example or a rudiment open, says that it's read-only (ADR 0008, 0018) and offers Copy to
 * Library. Each edit it refuses (a click on a cell, Backspace) highlights the notice briefly, so the
 * drummer can see why nothing changed.
 */
export function ExampleNotice() {
  const id = useAppStore((s) => s.editor.exercise.id)
  const refusedEdits = useAppStore((s) => s.refusedEdits)
  const copyToLibrary = useAppStore((s) => s.duplicateOpenExercise)
  const [highlighted, setHighlighted] = useState(false)
  const seen = useRef(refusedEdits)

  useEffect(() => {
    if (refusedEdits === seen.current) return
    seen.current = refusedEdits
    setHighlighted(true)
    const timer = setTimeout(() => setHighlighted(false), HIGHLIGHT_MS)
    return () => clearTimeout(timer)
  }, [refusedEdits])

  if (!isBuiltIn(id)) return null
  const kind = isRudiment(id) ? 'rudiment' : 'example'
  return (
    <div
      className={`flex items-center gap-3 border-b px-4 py-1.5 transition-colors duration-300 ${
        highlighted ? 'border-loop-line bg-loop text-ink' : 'border-line bg-panel text-mute'
      }`}
    >
      <p role="status" className="m-0 flex-1">
        <span className="font-semibold text-ink">{kind === 'rudiment' ? 'Rudiment' : 'Example'}: read-only.</span> Copy to Library to edit it.
      </p>
      <Button title={`Make an editable copy of this ${kind}`} onClick={copyToLibrary}>
        Copy to Library
      </Button>
    </div>
  )
}
