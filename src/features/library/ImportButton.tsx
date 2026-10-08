import type { ChangeEvent } from 'react'
import { useRef, useState } from 'react'
import { useAppStore } from '@/app/store'
import { Dialog, DialogButton } from '@/components/Dialog'
import { keepFocus } from '@/components/keepFocus'
import type { ImportChoice, ParsedImport } from '@/core'
import { importConflicts, parseImport } from '@/core'
import { exerciseCount } from './exerciseCount'

/** A file's exercises and the folders they're in, as read. */
type ReadImport = Extract<ParsedImport, { ok: true }>

/**
 * Import: picks a JSON file and adds its exercises to the library. When some are already there it
 * asks once, with the count, whether to replace, keep both or skip them; a refused file says why.
 * `onImported` hears how many exercises were stored.
 */
export function ImportButton({ className, onImported }: { className: string; onImported: (count: number) => void }) {
  const importExercises = useAppStore((s) => s.importExercises)
  const picker = useRef<HTMLInputElement>(null)
  /** An import waiting on the conflict choice. */
  const [conflicting, setConflicting] = useState<(ReadImport & { conflictCount: number }) | null>(null)
  const [refusal, setRefusal] = useState<string | null>(null)

  const finish = ({ exercises, folders }: ReadImport, choice: ImportChoice) => {
    setConflicting(null)
    onImported(importExercises(exercises, folders, choice))
  }

  const read = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Cleared, so picking the same file again still imports it.
    e.target.value = ''
    if (!file) return
    const parsed = parseImport(await file.text())
    if (!parsed.ok) return setRefusal(parsed.reason)
    const ids = useAppStore.getState().library.map((existing) => existing.id)
    const conflictCount = importConflicts(parsed.exercises, ids)
    // With nothing in the library already, every choice imports the same.
    if (conflictCount === 0) finish(parsed, 'skip')
    else setConflicting({ ...parsed, conflictCount })
  }

  return (
    <>
      <button
        type="button"
        title="Add exercises from an exported file"
        // Keeps focus off the button, so Space still enters a rest rather than clicking it again.
        onMouseDown={keepFocus}
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
          title={`${exerciseCount(conflicting.conflictCount)} already in the library`}
          onCancel={() => setConflicting(null)}
          buttons={
            <>
              <DialogButton autoFocus onClick={() => setConflicting(null)}>
                Cancel
              </DialogButton>
              <DialogButton onClick={() => finish(conflicting, 'skip')}>Skip</DialogButton>
              <DialogButton onClick={() => finish(conflicting, 'keepBoth')}>Keep both</DialogButton>
              <DialogButton danger onClick={() => finish(conflicting, 'replace')}>
                Replace
              </DialogButton>
            </>
          }
        >
          {conflicting.conflictCount === 1 ? 'It' : 'They'} can replace the {conflicting.conflictCount === 1 ? 'copy' : 'copies'} you
          have, be kept as {conflicting.conflictCount === 1 ? 'a copy' : 'copies'} alongside, or be skipped.
          {conflicting.exercises.length - conflicting.conflictCount === 1 && ' The other exercise is imported either way.'}
          {conflicting.exercises.length - conflicting.conflictCount > 1 &&
            ` The other ${conflicting.exercises.length - conflicting.conflictCount} exercises are imported either way.`}
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
