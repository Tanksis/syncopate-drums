import type { ButtonHTMLAttributes } from 'react'
import { keepFocus } from './keepFocus'

/**
 * `primary` does what a screen or dialog is for, `secondary` is any other button, `ghost` a quiet one
 * with no border, and `danger` changes something for good.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

/** `sm` sits in a row of text, `md` is a dialog's or toolbar's, `lg` is big enough for a finger. */
export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'border-accent bg-accent text-on-accent enabled:hover:opacity-90',
  secondary: 'border-edge bg-card text-ink enabled:hover:border-accent enabled:hover:text-accent aria-expanded:border-accent aria-expanded:text-accent',
  ghost: 'border-transparent bg-transparent text-mute enabled:hover:bg-line enabled:hover:text-ink aria-expanded:bg-line aria-expanded:text-ink',
  danger: 'border-danger bg-danger text-on-accent enabled:hover:opacity-90',
}

const SIZE: Record<ButtonSize, string> = {
  sm: 'px-2 py-0.5',
  md: 'px-3 py-1',
  lg: 'h-11 px-3.5 touch-manipulation',
}

/** A square button holding only an icon or a glyph. */
const ICON_SIZE: Record<ButtonSize, string> = {
  sm: 'size-5 text-sm/none',
  md: 'size-8 text-base/none',
  lg: 'size-11 text-xl/none touch-manipulation',
}

/** The classes of a kit button, for a button the kit doesn't render itself (a menu's). */
export function buttonClass({
  variant = 'secondary',
  size = 'sm',
  icon = false,
}: { variant?: ButtonVariant; size?: ButtonSize; icon?: boolean } = {}) {
  return `inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md border font-semibold whitespace-nowrap disabled:cursor-default disabled:opacity-40 ${VARIANT[variant]} ${
    icon ? ICON_SIZE[size] : SIZE[size]
  }`
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Square, for an icon or a glyph; give it an `aria-label`. */
  icon?: boolean
}

/**
 * The app's button. A mouse click keeps focus where it was (`keepFocus`), so Space and Enter still
 * go to the app; the keyboard can still Tab to it. `className` adds to the kit's look (a width, a
 * margin); a class that overrides one of the kit's needs Tailwind's `!` (`text-danger!`).
 */
export function Button({ variant, size, icon, className = '', type = 'button', onMouseDown = keepFocus, ...props }: ButtonProps) {
  return <button type={type} onMouseDown={onMouseDown} className={`${buttonClass({ variant, size, icon })} ${className}`} {...props} />
}
