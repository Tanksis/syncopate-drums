import type { ReactNode } from 'react'

/** The small upper-case label that heads a sidebar or a section; a settings group's heading is `SettingGroup`'s. */
export function PanelHeading({ id, className = '', children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <h3 id={id} className={`mb-1.5 ${className} font-display text-[11px] font-bold tracking-wider [font-variant-caps:var(--heading-caps)] [text-transform:var(--heading-case)] text-mute`}>{children}</h3>
  )
}
