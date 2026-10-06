import { useAppStore } from '@/app/store'
import { REST_FIGURE, beatViews } from '@/core'

/** The bars and beats of the exercise, each beat showing its figure's key, with the cursor. */
export function BeatStrip() {
  const bars = useAppStore((s) => s.editor.exercise.bars)
  const cursor = useAppStore((s) => s.editor.cursor)

  return (
    <div aria-label="Beat strip" className="flex flex-wrap gap-2">
      {beatViews(bars).map((beats, b) => (
        <div key={b} className="flex items-center gap-0.5 rounded-lg border border-line bg-card p-1">
          <span className="w-5 text-center font-mono text-[11px] text-mute">{b + 1}</span>
          {beats.map((view, beat) => {
            const current = cursor.bar === b && cursor.beat === beat
            return (
              <div
                key={beat}
                aria-current={current || undefined}
                className={`flex h-9 w-10 flex-col items-center justify-center rounded-md border border-stone-300 bg-card font-mono text-[10px]/[1.1] ${
                  current ? 'outline-3 -outline-offset-2 outline-accent' : ''
                }`}
              >
                <b className="text-sm">{view.figure === REST_FIGURE ? '␣' : (view.figure?.key.toUpperCase() ?? '?')}</b>
                <span className="text-mute">{view.hits}</span>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
