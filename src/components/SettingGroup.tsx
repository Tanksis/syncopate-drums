import type { ReactNode } from 'react'

/**
 * A settings group: a hairline over its heading and its rows, which the first group in its section
 * goes without. `aside` sits at the heading's right, on its baseline.
 */
export function SettingGroup({ title, aside, children }: { title: string; aside?: ReactNode; children?: ReactNode }) {
  const heading = <GroupHeading>{title}</GroupHeading>
  return (
    <section className="flex flex-col gap-2 border-t border-line pt-3 first-of-type:border-t-0 first-of-type:pt-0">
      {aside ? (
        <div className="flex items-baseline justify-between gap-2">
          {heading}
          {aside}
        </div>
      ) : (
        heading
      )}
      {children}
    </section>
  )
}

/** A settings group's heading, in the ink colour and larger than `PanelHeading`'s section labels. */
function GroupHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-1 font-display text-[13px] font-bold tracking-wider [font-variant-caps:var(--heading-caps)] [text-transform:var(--heading-case)] text-ink">
      {children}
    </h3>
  )
}
