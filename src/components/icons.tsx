import type { ReactNode } from 'react'

/** A 16 × 16 line icon, stroked in the text colour so it follows hover, disabled and the theme. */
function Icon({ strokeWidth = 1.5, children }: { strokeWidth?: number; children: ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
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

/** A curved arrow back: undo. */
export const UndoIcon = () => (
  <Icon>
    <path d="M5.6 2.4L2.4 5.6l3.2 3.2M2.4 5.6h7.2a4 4 0 0 1 0 8H8" />
  </Icon>
)

/** A curved arrow on: redo. */
export const RedoIcon = () => (
  <Icon>
    <path d="M10.4 2.4l3.2 3.2-3.2 3.2M13.6 5.6H6.4a4 4 0 0 0 0 8H8" />
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

/** Three lines: a menu, the phone's list of exercises. */
export const MenuIcon = () => (
  <Icon>
    <path d="M2.5 4h11M2.5 8h11M2.5 12h11" />
  </Icon>
)

/** A question mark, drawn thinner than the other icons: help. */
export const HelpIcon = () => (
  <Icon strokeWidth={1.25}>
    <path d="M5 5.25a3 3 0 1 1 4.3 2.7C8.5 8.33 8 8.95 8 9.8v.7" />
    <circle cx="8" cy="13.25" r=".55" fill="currentColor" stroke="none" />
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

/** A speaker sounding: a layer that plays. */
export const SpeakerIcon = () => (
  <Icon>
    <path d="M2.5 6h2.5l3.5-3v10L5 10H2.5zM11 5.5a3.5 3.5 0 0 1 0 5M12.8 3.5a6 6 0 0 1 0 9" />
  </Icon>
)

/** A speaker crossed out: a muted layer. */
export const SpeakerMutedIcon = () => (
  <Icon>
    <path d="M2.5 6h2.5l3.5-3v10L5 10H2.5zM11 6l3.5 4M14.5 6L11 10" />
  </Icon>
)

/** A pencil: rename. */
export const PencilIcon = () => (
  <Icon>
    <path d="M10.5 2.5l3 3L6 13H3v-3z" />
    <path d="M9 4l3 3" />
  </Icon>
)

/** A tick: done. */
export const CheckIcon = () => (
  <Icon>
    <path d="M3 8.5l3.2 3.2L13 4.8" />
  </Icon>
)

/** A note on a staff: the Practice screen. */
export const PracticeIcon = () => (
  <Icon>
    <path d="M1.5 4h13M1.5 6.5h13M1.5 9h13M1.5 11.5h13M7.4 9V3" />
    <circle cx="6" cy="9" r="1.4" fill="currentColor" />
  </Icon>
)

/** A metronome with its arm swung over: the Metronome screen. */
export const MetronomeIcon = () => (
  <Icon>
    <path d="M5.5 1.5h5l3 13h-11zM8 11.5l3-7" />
  </Icon>
)

/** The metronome crossed out: the click off. */
export const MetronomeOffIcon = () => (
  <Icon>
    <path d="M5.5 1.5h5l3 13h-11zM8 11.5l3-7M1.5 1.5l13 13" />
  </Icon>
)
