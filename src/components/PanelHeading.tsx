import type { ReactNode } from 'react'

/** A heading's face: the display font, bold and spaced, in the theme's heading caps and case. */
export const headingFace = 'font-display font-bold tracking-wider [font-variant-caps:var(--heading-caps)] [text-transform:var(--heading-case)]'

/** The small upper-case label that heads a sidebar or a section. */
export function PanelHeading({ id, className = '', children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <h3 id={id} className={`mb-1.5 ${className} ${headingFace} text-[11px] text-mute`}>{children}</h3>
  )
}
