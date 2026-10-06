import type { ReactNode } from 'react'

/** The small upper-case label that heads a sidebar or a settings group. */
export function PanelHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-mute">{children}</h3>
  )
}
