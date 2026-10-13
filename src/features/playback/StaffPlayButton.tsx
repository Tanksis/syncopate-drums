import { useAppStore } from '@/app/store'
import { keepFocus } from '@/components/keepFocus'
import { togglePlayback } from './transport'

/**
 * The desktop play/stop button: round, pinned at the top left of the notation area by bar 1.
 * It plays from the count-in, as Ctrl+Space does.
 */
export function StaffPlayButton() {
  const playing = useAppStore((s) => s.playing)
  return (
    <button
      type="button"
      aria-label={playing ? 'Stop' : 'Play'}
      title="Play from the count-in / stop (Ctrl+Space). Space pauses and resumes."
      // Keep focus off the button, so Space pauses rather than clicking it.
      onMouseDown={keepFocus}
      onClick={togglePlayback}
      className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-accent bg-accent text-sm/none text-on-accent shadow-sm shadow-shade hover:opacity-85"
    >
      <span aria-hidden>{playing ? '■' : '▶'}</span>
    </button>
  )
}
