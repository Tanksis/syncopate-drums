import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { useAppStore } from '@/app/store'
import { keepFocus } from '@/components/keepFocus'
import { inLoopRange, isExample } from '@/core'

/**
 * A tab for each bar, the cursor's lit, the selection and loop range shaded as on the beat strip's
 * bar: a click goes to that bar, which the beat strip then shows (without taking a selection
 * along), as do ‹ and ›. The + adds a bar of rests at the end and goes to it; an example, which
 * can't be changed, has none. `large` tabs, on a phone, are big enough for a finger and stay on one
 * line: the numbered tabs scroll sideways between ‹ and ›, keeping the cursor's tab in view.
 */
export function BarTabs({ large = false }: { large?: boolean }) {
  const barCount = useAppStore((s) => s.editor.exercise.bars.length)
  const example = useAppStore((s) => isExample(s.editor.exercise.id))
  const current = useAppStore((s) => s.editor.cursor.bar)
  const selection = useAppStore((s) => s.editor.selection)
  const loopRange = useAppStore((s) => s.editor.exercise.practice.loopRange)
  const dispatch = useAppStore((s) => s.dispatch)
  const isSelected = (bar: number) => selection !== null && bar >= selection.first && bar <= selection.last
  const goTo = (bar: number) => dispatch({ type: 'moveTo', bar, beat: 0 })
  const currentTab = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (large) currentTab.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [large, current, barCount])
  const tab = `cursor-pointer border font-semibold ${large ? 'h-9 min-w-9 rounded-lg px-2 text-sm' : 'min-w-7 rounded-md px-1.5 py-0.5 text-xs'}`
  return (
    <div aria-label="Bars" className={`flex items-center gap-1 ${large ? 'min-w-0' : 'flex-wrap'}`}>
      {!large && <span className="mr-1 text-xs text-mute">Bar</span>}
      <StepButton large={large} label="Previous bar" disabled={current === 0} onClick={() => goTo(current - 1)}>
        ‹
      </StepButton>
      <Scroller sideways={large}>
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
              ref={bar === current ? currentTab : undefined}
              type="button"
              aria-label={`Go to bar ${bar + 1}`}
              aria-current={bar === current || undefined}
              title={`Bar ${bar + 1}`}
              tabIndex={-1}
              // Keep focus off the button, so the editor's keys still work after a click.
              onMouseDown={keepFocus}
              onClick={() => goTo(bar)}
              className={`${tab} shrink-0 ${look}`}
            >
              {bar + 1}
            </button>
          )
        })}
      </Scroller>
      <StepButton large={large} label="Next bar" disabled={current === barCount - 1} onClick={() => goTo(current + 1)}>
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
          className={`${tab} shrink-0 border-dashed border-line bg-card text-mute hover:text-accent`}
        >
          +
        </button>
      )}
    </div>
  )
}

/** The numbered tabs: in a sideways-scrolling line where `sideways`, or left in the row's wrap. */
function Scroller({ sideways, children }: { sideways: boolean; children: ReactNode }) {
  if (!sideways) return children
  return <div className="flex min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none]">{children}</div>
}

/** ‹ or ›: to the bar before or after the cursor's. */
function StepButton({
  large,
  label,
  disabled,
  onClick,
  children,
}: {
  large: boolean
  label: string
  disabled: boolean
  onClick: () => void
  children: string
}) {
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
      className={`cursor-pointer rounded-md text-mute hover:text-accent disabled:cursor-default disabled:opacity-30 disabled:hover:text-mute ${
        large ? 'h-9 min-w-7 shrink-0 text-xl/none' : 'px-1 text-sm/none'
      }`}
    >
      {children}
    </button>
  )
}
