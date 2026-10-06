import { useRef } from 'react'

/**
 * A text box for renaming in place. Enter or leaving the box keeps the typed name; Escape keeps
 * the old one. Either way `onDone` is called once, with the name to keep (`null` for Escape).
 */
export function NameInput({
  name,
  onDone,
  className = '',
}: {
  name: string
  onDone: (name: string | null) => void
  className?: string
}) {
  const done = useRef(false)
  const finish = (value: string | null) => {
    if (done.current) return
    done.current = true
    onDone(value)
  }
  return (
    <input
      aria-label="Exercise name"
      defaultValue={name}
      autoFocus
      onFocus={(e) => e.currentTarget.select()}
      onBlur={(e) => finish(e.currentTarget.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') finish(e.currentTarget.value)
        else if (e.key === 'Escape') finish(null)
      }}
      className={`min-w-0 rounded border border-accent bg-card px-1 outline-none ${className}`}
    />
  )
}
