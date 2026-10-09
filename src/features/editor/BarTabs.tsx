import { useAppStore } from '@/app/store'
import { keepFocus } from '@/components/keepFocus'
import { inLoopRange, isExample } from '@/core'

/**
 * A tab for each bar, the cursor's lit, the selection and loop range shaded as on the beat strip's
 * bar: a click goes to that bar, which the beat strip then shows (without taking a selection
 * along), as do ‹ and ›. The + adds a bar of rests at the end and goes to it; an example, which
 * can't be changed, has none.
 */
export function BarTabs() {
  const barCount = useAppStore((s) => s.editor.exercise.bars.length)
  const example = useAppStore((s) => isExample(s.editor.exercise.id))
  const current = useAppStore((s) => s.editor.cursor.bar)
  const selection = useAppStore((s) => s.editor.selection)
  const loopRange = useAppStore((s) => s.editor.exercise.practice.loopRange)
  const dispatch = useAppStore((s) => s.dispatch)
  const isSelected = (bar: number) => selection !== null && bar >= selection.first && bar <= selection.last
  const goTo = (bar: number) => dispatch({ type: 'moveTo', bar, beat: 0 })
  const tab = 'min-w-7 cursor-pointer rounded-md border px-1.5 py-0.5 text-xs font-semibold'
  return (
    <div aria-label="Bars" className="flex flex-wrap items-center gap-1">
      <span className="mr-1 text-xs text-mute">Bar</span>
      <StepButton label="Previous bar" disabled={current === 0} onClick={() => goTo(current - 1)}>
        ‹
      </StepButton>
      {Array.from({ length: barCount }, (_, bar) => {
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
            onClick={() => goTo(bar)}
            className={`${tab} ${look}`}
          >
            {bar + 1}
          </button>
        )
      })}
      <StepButton label="Next bar" disabled={current === barCount - 1} onClick={() => goTo(current + 1)}>
        ›
      </StepButton>
      {!example && (
        <button
          type="button"
          aria-label="Add a bar at the end"
          title="Add a bar at the end (Ctrl+Enter adds one after the cursor bar)"
          tabIndex={-1}
          onMouseDown={keepFocus}
          onClick={() => {
            goTo(barCount - 1)
            dispatch({ type: 'addBar' })
          }}
          className={`${tab} border-dashed border-line bg-card text-mute hover:text-accent`}
        >
          +
        </button>
      )}
    </div>
  )
}

/** ‹ or ›: to the bar before or after the cursor's. */
function StepButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      tabIndex={-1}
      // Keep focus off the button, so the editor's keys still work after a click.
      onMouseDown={keepFocus}
      onClick={onClick}
      className="cursor-pointer rounded-md px-1 text-sm/none text-mute hover:text-accent disabled:cursor-default disabled:opacity-30 disabled:hover:text-mute"
    >
      {children}
    </button>
  )
}
