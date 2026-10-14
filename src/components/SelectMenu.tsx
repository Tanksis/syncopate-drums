import { ChevronIcon } from './icons'
import { Menu } from './Menu'

/** One choice in a select menu. */
export interface SelectOption<T> {
  value: T
  label: string
  /** A few words after the label in the open menu, saying what the choice means. */
  hint?: string
}

/**
 * A button showing the current choice, which opens a `Menu` of all of them with the current one
 * ticked: a select that the keyboard reaches as the kit's menus are. A long name is cut short on the
 * button and shows whole in the menu and on hover. A `large` one is big enough for a finger.
 */
export function SelectMenu<T extends string>({
  label,
  options,
  value,
  onChange,
  large = false,
}: {
  label: string
  options: readonly SelectOption<T>[]
  value: T
  onChange: (value: T) => void
  large?: boolean
}) {
  const current = options.find((option) => option.value === value)
  return (
    <Menu
      label={`${label}: ${current?.label ?? ''}`}
      large={large}
      items={options.map((option) => ({
        label: option.label,
        hint: option.hint,
        checked: option.value === value,
        onSelect: () => onChange(option.value),
      }))}
      icon={
        <>
          <span className="truncate">{current?.label}</span>
          <span className="shrink-0 text-mute">
            <ChevronIcon />
          </span>
        </>
      }
      buttonClassName={`flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-1 rounded-md border border-edge bg-card text-left text-ink hover:border-accent aria-expanded:border-accent ${
        large ? 'h-11 px-3 touch-manipulation' : 'px-2 py-0.5'
      }`}
    />
  )
}
