import { Button } from './Button'

/**
 * The phone's Done, which closes what it sits in: a sheet, the editor, or a screen over the app. `label`
 * says what it closes. It keeps the square of a finger-sized icon button, so it sits where the tick did
 * and nothing beside it moves. A `quiet` Done is drawn in the accent on no fill, to sit in a row of icon buttons.
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
      aria-label={`Done: ${label.charAt(0).toLowerCase()}${label.slice(1)}`}
      title={label}
      onClick={onClick}
      className={`text-sm/none! ${quiet ? 'text-accent! active:bg-hover' : ''} ${className}`}
    >
      Done
    </Button>
  )
}
