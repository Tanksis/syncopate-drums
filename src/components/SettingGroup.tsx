import type { ReactNode } from 'react'
import { createContext, useContext } from 'react'
import { headingFace } from './PanelHeading'

/**
 * The level of a settings group's heading: h3, under its sidebar's or sheet's h2, or h2 where the
 * group is a panel's only content and heads it, as in the header's popovers.
 */
export const GroupHeadingLevel = createContext<2 | 3>(3)

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
  const Heading = `h${useContext(GroupHeadingLevel)}` as const
  return (
    <Heading className={`mb-1 ${headingFace} text-[13px] text-ink`}>
      {children}
    </Heading>
  )
}
