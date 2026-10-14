import type { ReactNode } from 'react'

/** A 16 × 16 line icon, stroked in the text colour so it follows hover, disabled and the theme. */
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

/** A plus sign. */
export const PlusIcon = () => (
  <Icon>
    <path d="M8 3v10M3 8h10" />
  </Icon>
)

/** Two overlapping sheets. */
export const DuplicateIcon = () => (
  <Icon>
    <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
    <path d="M10.5 3.5V3A1.5 1.5 0 0 0 9 1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.5" />
  </Icon>
)

/** A bin. */
export const TrashIcon = () => (
  <Icon>
    <path d="M2.5 4h11M6.5 4V2.5h3V4M4 4l.7 9a1 1 0 0 0 1 .9h4.6a1 1 0 0 0 1-.9L12 4M6.75 6.5v5M9.25 6.5v5" />
  </Icon>
)

/** Three dots in a row. */
export const MoreIcon = () => (
  <Icon>
    <circle cx="3.5" cy="8" r="0.9" fill="currentColor" />
    <circle cx="8" cy="8" r="0.9" fill="currentColor" />
    <circle cx="12.5" cy="8" r="0.9" fill="currentColor" />
  </Icon>
)

/** A chevron pointing down; rotate it for the other ways. */
export const ChevronIcon = () => (
  <Icon>
    <path d="M4 6l4 4 4-4" />
  </Icon>
)

/** A minus sign. */
export const MinusIcon = () => (
  <Icon>
    <path d="M3 8h10" />
  </Icon>
)

/** Two arrows chasing each other round: a loop. */
export const LoopIcon = () => (
  <Icon>
    <path d="M3 9V7a3 3 0 0 1 3-3h7M11 2l2 2-2 2M13 7v2a3 3 0 0 1-3 3H3M5 14l-2-2 2-2" />
  </Icon>
)

/** Two sliders: settings. */
export const SettingsIcon = () => (
  <Icon>
    <path d="M2 5h12M2 11h12" />
    <circle cx="6" cy="5" r="1.8" fill="currentColor" />
    <circle cx="10.5" cy="11" r="1.8" fill="currentColor" />
  </Icon>
)
