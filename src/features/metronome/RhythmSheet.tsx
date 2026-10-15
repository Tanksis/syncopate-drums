import type { ReactNode } from 'react'
import { useAppStore } from '@/app/store'
import { Button } from '@/components/Button'
import { Sheet } from '@/components/Sheet'
import { keepFocus } from '@/components/keepFocus'
import { MAX_BEATS, NOTE_VALUES, SUBDIVISIONS, subdivisionOf, withTimeSignature } from '@/core'
import { MetronomeVolume } from './MetronomeVolume'
import { SubdivisionPicture } from './SubdivisionPicture'

/**
 * The phone's Rhythm sheet: the time signature between its beats and note-value steppers (a change
 * resets the blocks), the subdivision's pictures, and the subdivision volume.
 */
export function RhythmSheet({ onDone }: { onDone: () => void }) {
  return (
    <Sheet title="Rhythm" onDone={onDone}>
      <TimeSignature />
      <SubdivisionGrid />
      <MetronomeVolume setting="subdivisionVolume" label="Subdivision volume" />
    </Sheet>
  )
}

/** The time signature, with the beats' stepper on its left and the note value's on its right. */
function TimeSignature() {
  const metronome = useAppStore((s) => s.device.metronome)
  const setMetronome = useAppStore((s) => s.setMetronome)
  const { beats, noteValue } = metronome
  const noteIndex = NOTE_VALUES.indexOf(noteValue)
  const change = (nextBeats: number, nextNoteValue = noteValue) => setMetronome(withTimeSignature(metronome, nextBeats, nextNoteValue))
  return (
    <div className="flex flex-col gap-2">
      <span className="font-semibold">Time signature</span>
      <div className="grid grid-cols-3 items-center rounded-2xl border border-line bg-card p-3">
        <Stepper
          label="Beats"
          more={{ name: 'More beats', disabled: beats >= MAX_BEATS, onClick: () => change(beats + 1) }}
          fewer={{ name: 'Fewer beats', disabled: beats <= 1, onClick: () => change(beats - 1) }}
        />
        <div
          role="img"
          aria-label={`Time signature ${beats}/${noteValue}`}
          className="flex flex-col items-center font-sans text-5xl/[0.95] font-bold tabular-nums"
        >
          <span>{beats}</span>
          <span>{noteValue}</span>
        </div>
        <Stepper
          label="Note"
          more={{ name: 'Shorter note value', disabled: noteIndex === NOTE_VALUES.length - 1, onClick: () => change(beats, NOTE_VALUES[noteIndex + 1]) }}
          fewer={{ name: 'Longer note value', disabled: noteIndex === 0, onClick: () => change(beats, NOTE_VALUES[noteIndex - 1]) }}
        />
      </div>
    </div>
  )
}

interface Step {
  name: string
  disabled: boolean
  onClick: () => void
}

/** + over its label over −. */
function Stepper({ label, more, fewer }: { label: string; more: Step; fewer: Step }) {
  const step = (s: Step, glyph: ReactNode) => (
    <Button size="lg" aria-label={s.name} disabled={s.disabled} onClick={s.onClick} className="w-12 rounded-xl border-edge text-xl">
      <span aria-hidden>{glyph}</span>
    </Button>
  )
  return (
    <div className="flex flex-col items-center gap-1">
      {step(more, '+')}
      <span className="text-xs text-mute">{label}</span>
      {step(fewer, '−')}
    </div>
  )
}

/** The 12 subdivisions' pictures, the chosen one marked and named above them. */
function SubdivisionGrid() {
  const subdivision = useAppStore((s) => s.device.metronome.subdivision)
  const setMetronome = useAppStore((s) => s.setMetronome)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-semibold">Subdivision</span>
        <span className="text-[13px] text-mute">{subdivisionOf(subdivision).name}</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {SUBDIVISIONS.map(({ id }) => (
          <button
            key={id}
            type="button"
            aria-pressed={id === subdivision}
            onMouseDown={keepFocus}
            onClick={() => setMetronome({ subdivision: id })}
            className="flex h-14 cursor-pointer touch-manipulation items-center justify-center rounded-xl border border-line bg-card text-ink aria-pressed:border-2 aria-pressed:border-accent aria-pressed:bg-accent-tint"
          >
            <SubdivisionPicture id={id} />
          </button>
        ))}
      </div>
    </div>
  )
}
