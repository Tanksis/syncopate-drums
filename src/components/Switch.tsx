import { keepFocus } from './keepFocus'

/**
 * An on/off setting: a track and knob, lit in the accent when on, with its label beside it; the
 * whole of it is the button. `labelHidden` leaves the label to screen readers and the `title`, where
 * a row has no room for it. A mouse click keeps focus where it was (`keepFocus`).
 */
export function Switch({
  label,
  checked,
  onChange,
  title,
  labelHidden = false,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  title?: string
  labelHidden?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={labelHidden ? label : undefined}
      title={title}
      onMouseDown={keepFocus}
      onClick={() => onChange(!checked)}
      className="group inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-md whitespace-nowrap"
    >
      <span
        aria-hidden
        className="relative h-5 w-9 shrink-0 rounded-full border border-edge bg-bg transition-colors group-aria-checked:border-accent group-aria-checked:bg-accent"
      >
        <span className="absolute top-0.5 left-0.5 size-3.5 rounded-full border border-edge bg-card transition-transform group-aria-checked:translate-x-4 group-aria-checked:border-on-accent group-aria-checked:bg-on-accent" />
      </span>
      {!labelHidden && label}
    </button>
  )
}
