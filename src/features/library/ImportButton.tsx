import type { ChangeEvent, MouseEvent } from 'react'
import { useRef, useState } from 'react'
import { useAppStore } from '@/app/store'
import { Dialog, DialogButton } from '@/components/Dialog'
import type { Exercise, ImportChoice } from '@/core'
import { importConflicts, parseImport } from '@/core'
import { exerciseCount } from './exerciseCount'

/**
 * Import: picks a JSON file and adds its exercises to the library. When some are already there it
 * asks once, with the count, whether to replace, keep both or skip them; a refused file says why.
 * `onImported` hears how many exercises were stored.
 */
export function ImportButton({ className, onImported }: { className: string; onImported: (count: number) => void }) {
  const importExercises = useAppStore((s) => s.importExercises)
  const picker = useRef<HTMLInputElement>(null)
  /** An import waiting on the conflict choice. */
  const [conflicting, setConflicting] = useState<{ exercises: Exercise[]; count: number } | null>(null)
  const [refusal, setRefusal] = useState<string | null>(null)

  const finish = (exercises: Exercise[], choice: ImportChoice) => {
    setConflicting(null)
    onImported(importExercises(exercises, choice))
  }

  const read = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Cleared, so picking the same file again still imports it.
    e.target.value = ''
    if (!file) return
    const parsed = parseImport(await file.text())
    if (!parsed.ok) return setRefusal(parsed.reason)
    const ids = useAppStore.getState().library.map((existing) => existing.id)
    const count = importConflicts(parsed.exercises, ids)
    if (count === 0) finish(parsed.exercises, 'skip')
    else setConflicting({ exercises: parsed.exercises, count })
  }

  return (
    <>
      <button
        type="button"
        title="Add exercises from an exported file"
        // Keeps focus off the button, so Space still enters a rest rather than clicking it again.
        onMouseDown={(e: MouseEvent) => e.preventDefault()}
        onClick={() => picker.current?.click()}
        className={className}
      >
        Import
      </button>
      <input
        ref={picker}
        type="file"
        accept=".json,application/json"
        aria-label="Exercise file to import"
        onChange={read}
        className="hidden"
      />
      {conflicting && (
        <Dialog
          title={`${exerciseCount(conflicting.count)} already in the library`}
          onCancel={() => setConflicting(null)}
          buttons={
            <>
              <DialogButton autoFocus onClick={() => setConflicting(null)}>
                Cancel
              </DialogButton>
              <DialogButton onClick={() => finish(conflicting.exercises, 'skip')}>Skip</DialogButton>
              <DialogButton onClick={() => finish(conflicting.exercises, 'keepBoth')}>Keep both</DialogButton>
              <DialogButton danger onClick={() => finish(conflicting.exercises, 'replace')}>
                Replace
              </DialogButton>
            </>
          }
        >
          {conflicting.count === 1 ? 'It' : 'They'} can replace the {conflicting.count === 1 ? 'copy' : 'copies'} you
          have, be kept as {conflicting.count === 1 ? 'a copy' : 'copies'} alongside, or be skipped.
          {conflicting.exercises.length - conflicting.count === 1 && ' The other exercise is imported either way.'}
          {conflicting.exercises.length - conflicting.count > 1 &&
            ` The other ${conflicting.exercises.length - conflicting.count} exercises are imported either way.`}
        </Dialog>
      )}
      {refusal && (
        <Dialog
          title="Couldn't import the file"
          onCancel={() => setRefusal(null)}
          buttons={
            <DialogButton autoFocus onClick={() => setRefusal(null)}>
              OK
            </DialogButton>
          }
        >
          {refusal}
        </Dialog>
      )}
    </>
  )
}
