import { Button } from './Button'
import { CheckIcon } from './icons'

/**
 * The phone's tick, which closes what it sits in: a sheet, the editor, or a screen over the app. `label`
 * says what it closes. A `quiet` tick is drawn in the accent on no fill, to sit in a row of icon buttons.
 */
export function DoneButton({
  label,
  onClick,
  quiet = false,
  className = '',
}: {
  label: string
  onClick: () => void
  quiet?: boolean
  className?: string
}) {
  return (
    <Button
      variant={quiet ? 'ghost' : 'primary'}
      size="lg"
      icon
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`${quiet ? 'text-accent! active:bg-hover' : ''} ${className}`}
    >
      <span aria-hidden className={`flex ${quiet ? '[&>svg]:size-6' : '[&>svg]:size-5.5'}`}>
        <CheckIcon />
      </span>
    </Button>
  )
}
