import { useAppStore } from '@/app/store'
import { keepFocus } from '@/components/keepFocus'
import { inLoopRange } from '@/core'

/**
 * A tab for each bar, the cursor's lit, the selection and loop range shaded as on the beat strip's
 * bar: a click goes to that bar, which the beat strip then shows. The + adds a bar of rests at the
 * end and goes to it.
 */
export function BarTabs() {
  const bars = useAppStore((s) => s.editor.exercise.bars.length)
  const current = useAppStore((s) => s.editor.cursor.bar)
  const selection = useAppStore((s) => s.editor.selection)
  const loopRange = useAppStore((s) => s.editor.exercise.practice.loopRange)
  const dispatch = useAppStore((s) => s.dispatch)
  const isSelected = (bar: number) => selection !== null && bar >= selection.first && bar <= selection.last
  const tab = 'min-w-7 cursor-pointer rounded-md border px-1.5 py-0.5 text-xs font-semibold'
  return (
    <div aria-label="Bars" className="flex flex-wrap items-center gap-1">
      <span className="mr-1 text-xs text-mute">Bar</span>
      {Array.from({ length: bars }, (_, bar) => {
        const look =
          bar === current
            ? 'border-accent bg-accent text-white'
            : isSelected(bar)
              ? 'border-accent bg-sky-100 text-ink'
              : inLoopRange(loopRange, bar)
                ? 'border-loop-line bg-loop text-loop-ink'
                : 'border-line bg-card text-mute hover:text-accent'
        return (
          <button
            key={bar}
            type="button"
            aria-label={`Go to bar ${bar + 1}`}
            aria-current={bar === current || undefined}
            title={`Bar ${bar + 1}`}
            tabIndex={-1}
            // Keep focus off the button, so the editor's keys still work after a click.
            onMouseDown={keepFocus}
            onClick={() => dispatch({ type: 'goToBar', bar })}
            className={`${tab} ${look}`}
          >
            {bar + 1}
          </button>
        )
      })}
      <button
        type="button"
        aria-label="Add a bar at the end"
        title="Add a bar at the end (Ctrl+Enter adds one after the cursor bar)"
        tabIndex={-1}
        onMouseDown={keepFocus}
        onClick={() => {
          dispatch({ type: 'goToBar', bar: bars - 1 })
          dispatch({ type: 'addBar' })
        }}
        className={`${tab} border-dashed border-line bg-card text-mute hover:text-accent`}
      >
        +
      </button>
    </div>
  )
}
