import type { ReactNode } from 'react'
import { useState } from 'react'
import { cleanRunsOf, useAppStore } from '@/app/store'
import { Button } from '@/components/Button'
import { CheckIcon } from '@/components/icons'
import { Popover } from '@/components/Popover'
import { Sheet } from '@/components/Sheet'
import type { CleanRun } from '@/core'
import { bestCleanBpm, newestFirst } from '@/core'

const PANEL_TITLE = 'Clean runs'

/** The open exercise's clean runs. */
const useOpenCleanRuns = () => useAppStore((s) => cleanRunsOf(s, s.editor.exercise))

/** A clean run's day, as the history lists it: "28 Oct 2026". */
const dayOf = (run: CleanRun) => new Date(run.at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

/** The ✓ is the accent's once the exercise has a clean run, the same size either way. */
const tickClass = (logged: boolean) => (logged ? 'text-accent' : '')

/** The exercise bar's ✓, opening the clean runs under it. */
export function CleanRunsPopover() {
  const logged = useOpenCleanRuns().length > 0
  return (
    <Popover label={PANEL_TITLE} title="Clean runs: log a tempo you played it cleanly at" icon={<span className={tickClass(logged)}><CheckIcon /></span>}>
      <CleanRunsPanel />
    </Popover>
  )
}

/**
 * The phone's clean runs, in a sheet opened by the button `children` draws, given what opens it and
 * the ✓ to show, the accent's once the exercise has a clean run.
 */
export function CleanRunsSheet({ children }: { children: (open: () => void, tick: ReactNode) => ReactNode }) {
  const [open, setOpen] = useState(false)
  const logged = useOpenCleanRuns().length > 0
  return (
    <>
      {children(
        () => setOpen(true),
        <span className={tickClass(logged)}>
          <CheckIcon />
        </span>,
      )}
      {open && (
        <Sheet title={PANEL_TITLE} onDone={() => setOpen(false)}>
          <CleanRunsPanel large />
        </Sheet>
      )}
    </>
  )
}

/**
 * Logs a clean run at the tempo now, and lists the runs logged, newest first, the best marked, each
 * with × to drop one logged by mistake. `large` for a finger.
 */
function CleanRunsPanel({ large = false }: { large?: boolean }) {
  const runs = useOpenCleanRuns()
  const bpm = useAppStore((s) => s.editor.exercise.practice.bpm)
  const logCleanRun = useAppStore((s) => s.logCleanRun)
  const removeCleanRun = useAppStore((s) => s.removeCleanRun)
  const best = bestCleanBpm(runs)
  return (
    <div className={`flex flex-col gap-2 ${large ? 'w-full' : 'w-64 text-sm'}`}>
      <Button variant="primary" size={large ? 'lg' : 'md'} onClick={logCleanRun} className="gap-2">
        <CheckIcon />
        Played it clean at {bpm} BPM
      </Button>
      {runs.length === 0 ? (
        <p className="m-0 text-mute">Played it through without a slip? Log the tempo, and see how it climbs.</p>
      ) : (
        <ul aria-label="Clean runs, newest first" className="m-0 flex max-h-60 list-none flex-col overflow-auto p-0">
          {newestFirst(runs).map((run) => (
            <li key={run.at} className={`flex items-center gap-2 border-t border-line first:border-t-0 ${large ? 'py-1.5' : 'py-0.5'}`}>
              <span className="w-16 font-semibold tabular-nums">{run.bpm} BPM</span>
              <span className="flex-1 text-mute">{dayOf(run)}</span>
              {run.bpm === best && <span className="text-xs font-semibold text-accent">best</span>}
              <Button variant="ghost" size={large ? 'lg' : 'sm'} icon aria-label={`Remove the clean run at ${run.bpm} BPM on ${dayOf(run)}`} title="Remove" onClick={() => removeCleanRun(run.at)}>
                ×
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** ✓ and the best clean BPM, beside an exercise in a list; nothing before its first clean run. */
export function BestCleanBpm({ runs }: { runs: readonly CleanRun[] | undefined }) {
  const best = bestCleanBpm(runs)
  if (best === undefined) return null
  return (
    <span title={`Played cleanly at up to ${best} BPM`} className="shrink-0 text-xs font-semibold whitespace-nowrap text-accent tabular-nums">
      ✓ {best}
    </span>
  )
}
