import { useAppStore } from '@/app/store'
import { REST_FIGURE, beatViews } from '@/core'

/**
 * The bars and beats of the exercise, each beat showing its figure's key, with the cursor and the
 * bar selection. Clicking a beat moves the cursor to it; a bar's ✕ (shown on hover) deletes it.
 */
export function BeatStrip() {
  const bars = useAppStore((s) => s.editor.exercise.bars)
  const cursor = useAppStore((s) => s.editor.cursor)
  const selection = useAppStore((s) => s.editor.selection)
  const dispatch = useAppStore((s) => s.dispatch)

  return (
    <div aria-label="Beat strip" className="flex flex-wrap gap-2">
      {beatViews(bars).map((beats, b) => {
        const selected = selection !== null && b >= selection.first && b <= selection.last
        return (
          <div
            key={b}
            aria-selected={selected || undefined}
            className={`group relative flex items-center gap-0.5 rounded-lg border p-1 ${
              selected ? 'border-accent bg-sky-100' : 'border-line bg-card'
            }`}
          >
            <span className="w-5 text-center font-mono text-[11px] text-mute">{b + 1}</span>
            {beats.map((view, beat) => {
              const current = cursor.bar === b && cursor.beat === beat
              return (
                <div
                  key={beat}
                  aria-current={current || undefined}
                  title={[view.tiedInto && 'tied into', view.cutShort && 'cut short'].filter(Boolean).join(', ') || undefined}
                  onClick={() => dispatch({ type: 'moveTo', bar: b, beat })}
                  className={`relative flex h-9 w-10 cursor-pointer flex-col items-center justify-center rounded-md border border-stone-300 bg-card font-mono text-[10px]/[1.1] ${
                    current ? 'outline-3 -outline-offset-2 outline-accent' : ''
                  }`}
                >
                  {view.tiedInto && <span className="absolute -top-2 -left-2 text-sm text-accent">⌒</span>}
                  <b className="text-sm">
                    {view.figure === REST_FIGURE ? '␣' : (view.figure?.key.toUpperCase() ?? '?')}
                    {view.cutShort && <span className="text-accent">.</span>}
                  </b>
                  <span className="text-mute">{view.hits}</span>
                </div>
              )
            })}
            <button
              type="button"
              title={`Delete bar ${b + 1} (Ctrl+Backspace)`}
              aria-label={`Delete bar ${b + 1}`}
              tabIndex={-1}
              // Keep focus off the button, so Space and Enter go to the editor rather than clicking it.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => dispatch({ type: 'deleteBar', bar: b })}
              className="absolute -top-2 -right-2 hidden size-5 cursor-pointer items-center justify-center rounded-full border border-line bg-card text-[10px] text-mute group-hover:flex hover:border-accent hover:text-accent"
            >
              ✕
            </button>
          </div>
        )
      })}
    </div>
  )
}
