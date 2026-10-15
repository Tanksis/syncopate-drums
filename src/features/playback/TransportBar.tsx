import { useAppStore } from '@/app/store'
import { Button } from '@/components/Button'
import { CheckIcon } from '@/components/icons'
import { keepFocus } from '@/components/keepFocus'
import { fieldClass } from '@/components/ValueField'
import { BpmStep } from './BpmStep'
import { BpmInput } from './TransportControls'
import { togglePause } from './transport'
import { usePlaybackKeys } from './usePlaybackKeys'

/** Play: a round button, big enough for a thumb, that a long press doesn't select or call out. */
const roundButtonClass =
  'flex shrink-0 cursor-pointer touch-manipulation select-none items-center justify-center rounded-full border font-semibold [-webkit-touch-callout:none]'

/** The − and + beside the BPM. */
const stepClass = 'size-11 rounded-full border-edge bg-panel text-xl/none font-semibold active:border-accent active:text-accent'

/**
 * The phone layout's transport, over the tab bar within reach of a thumb: play/pause, the tempo
 * with − and + buttons that repeat while held, and Edit, given `onEdit`, to open the editor sheet.
 * While the sheet is open, given `onDone`, a tick takes Edit's place to close it. On an example,
 * given `onCopy`, Copy takes Edit's place to make an editable copy.
 */
export function TransportBar({ onEdit, onDone, onCopy }: { onEdit?: () => void; onDone?: () => void; onCopy?: () => void }) {
  usePlaybackKeys()
  const playing = useAppStore((s) => s.playing)
  return (
    <div
      aria-label="Transport"
      role="toolbar"
      className="flex shrink-0 items-center gap-3 border-t border-line bg-card px-3 py-2"
    >
      <button
        type="button"
        aria-label={playing ? 'Pause' : 'Play'}
        // Keep focus off the buttons, so Space pauses rather than clicking them.
        onMouseDown={keepFocus}
        onClick={togglePause}
        className={`${roundButtonClass} size-12 border-play-button-edge bg-play-button text-lg/none text-on-play-button active:opacity-80`}
      >
        <span aria-hidden>{playing ? '❚❚' : '▶'}</span>
      </button>
      <div className="flex items-center gap-2">
        <BpmStep step={-1} className={stepClass}>
          <span aria-hidden>−</span>
        </BpmStep>
        <label className="flex flex-col items-center">
          {/* 16 px or more, so iOS doesn't zoom in when it's focused. */}
          <BpmInput className={`${fieldClass} w-16 [appearance:textfield] px-1 py-1 text-center text-base font-semibold [&::-webkit-inner-spin-button]:appearance-none`} />
          <span className="text-[11px] text-mute">BPM</span>
        </label>
        <BpmStep step={1} className={stepClass}>
          <span aria-hidden>+</span>
        </BpmStep>
      </div>
      {onCopy ? (
        <SlotButton aria-label="Copy to Library" onClick={onCopy}>
          Copy
        </SlotButton>
      ) : onDone ? (
        <Button variant="primary" size="lg" icon aria-label="Done editing" title="Done editing" onClick={onDone} className="ml-auto">
          <span aria-hidden className="flex [&>svg]:size-5.5">
            <CheckIcon />
          </span>
        </Button>
      ) : (
        onEdit && <SlotButton onClick={onEdit}>Edit</SlotButton>
      )}
    </div>
  )
}

/** The button at the right of the bar: Edit, or Copy on an example. (Done is a tick.) */
function SlotButton(props: { 'aria-label'?: string; onClick: () => void; children: string }) {
  return (
    <Button size="lg" {...props} className="ml-auto active:border-accent active:text-accent" />
  )
}
