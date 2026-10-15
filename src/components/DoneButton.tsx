import { Button } from './Button'
import { CheckIcon } from './icons'

/** The phone's tick, which closes what it sits in: a sheet, the editor, or a screen over the app. `label` says what it closes. */
export function DoneButton({ label, onClick, className = '' }: { label: string; onClick: () => void; className?: string }) {
  return (
    <Button variant="primary" size="lg" icon aria-label={label} title={label} onClick={onClick} className={className}>
      <span aria-hidden className="flex [&>svg]:size-5.5">
        <CheckIcon />
      </span>
    </Button>
  )
}
