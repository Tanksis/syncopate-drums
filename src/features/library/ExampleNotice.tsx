import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/app/store'
import { keepFocus } from '@/components/keepFocus'
import { isExample } from '@/core'

/** How long the notice stays highlighted after an example refuses an edit. */
const HIGHLIGHT_MS = 700

/**
 * With an example open, says that it's read-only (ADR 0008) and offers Copy to Library. Each edit
 * the example refuses (a click on a cell, a figure key) highlights the notice briefly, so the
 * drummer can see why nothing changed.
 */
export function ExampleNotice() {
  const open = useAppStore((s) => isExample(s.editor.exercise.id))
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

  if (!open) return null
  return (
    <div
      className={`flex items-center gap-3 border-b px-4 py-1.5 transition-colors duration-300 ${
        highlighted ? 'border-loop-line bg-loop text-ink' : 'border-line bg-panel text-mute'
      }`}
    >
      <p role="status" className="m-0 flex-1">
        <span className="font-semibold text-ink">Example: read-only.</span> Copy to Library to edit it.
      </p>
      <button
        type="button"
        title="Make an editable copy of this example"
        onMouseDown={keepFocus}
        onClick={copyToLibrary}
        className="cursor-pointer rounded-md border border-line bg-card px-2 py-0.5 font-semibold text-ink hover:border-accent"
      >
        Copy to Library
      </button>
    </div>
  )
}
