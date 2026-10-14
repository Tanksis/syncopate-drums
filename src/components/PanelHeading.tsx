import type { ReactNode } from 'react'

/** The small upper-case label that heads a sidebar or a settings group. */
export function PanelHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-1.5 font-display text-[11px] font-bold tracking-wider [font-variant-caps:var(--heading-caps)] [text-transform:var(--heading-case)] text-mute">{children}</h3>
  )
}
