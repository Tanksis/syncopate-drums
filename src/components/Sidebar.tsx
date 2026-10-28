import type { ReactNode } from 'react'
import { DoneButton } from './DoneButton'
import { PanelHeading } from './PanelHeading'
import { keepFocus } from './keepFocus'
import { slideTransition, useSlide } from './useSlide'
import { useSwipe } from './useSwipe'

/** Which side of the app a sidebar is on, which way its chevrons point. */
export type Side = 'left' | 'right'

/** Points away from the middle to collapse, towards it to open. */
const CHEVRON: Record<Side, { collapse: string; open: string }> = {
  left: { collapse: '‹', open: '›' },
  right: { collapse: '›', open: '‹' },
}

/** A sidebar's or a section's small chevron button. */
export const chevronButtonClass =
  'flex size-5 shrink-0 cursor-pointer items-center justify-center rounded border-0 bg-transparent text-base/none text-mute hover:bg-hover hover:text-ink'

/**
 * A sidebar's heading, with the chevron that collapses the sidebar to its rail, or, shown
 * `fullScreen` on a phone, the tick that closes it. `sidebarName` names the sidebar in the
 * chevron's label where the heading names only what's under it. `title` takes the heading's place
 * (a switch between what the sidebar lists), `name` still naming the sidebar.
 */
export function SidebarHeading({
  name,
  sidebarName = name,
  side,
  fullScreen = false,
  title,
  onCollapse,
}: {
  name: string
  sidebarName?: string
  side: Side
  fullScreen?: boolean
  title?: ReactNode
  onCollapse: () => void
}) {
  // Its panel's padding is 10 px across and 12 down, so this lines the title up with Settings'.
  if (fullScreen) return <FullScreenHeading name={name} title={title} onClose={onCollapse} className="px-1.5 pt-0.5 pb-0.5" />
  return (
    <div className={`flex gap-2 ${title ? 'items-center' : 'items-start justify-between'}`}>
      {title ?? <PanelHeading>{name}</PanelHeading>}
      <button
        type="button"
        aria-label={`Collapse ${sidebarName.toLowerCase()}`}
        title={`Collapse ${sidebarName.toLowerCase()}`}
        // Keep focus off the button, so Space still pauses.
        onMouseDown={keepFocus}
        onClick={onCollapse}
        className={`${title ? '' : '-mt-1'} ${chevronButtonClass}`}
      >
        <span aria-hidden>{CHEVRON[side].collapse}</span>
      </button>
    </div>
  )
}

/**
 * A phone's full-screen panel's title, as large as a sheet's, or `title` in its place as for
 * `SidebarHeading`, and the tick that closes the panel.
 */
export function FullScreenHeading({ name, title, onClose, className = '' }: { name: string; title?: ReactNode; onClose: () => void; className?: string }) {
  return (
    <div className={`flex items-center justify-between gap-2 ${className}`}>
      {title ?? <h2 className="m-0 font-display text-2xl font-semibold">{name}</h2>}
      <DoneButton label={`Close ${name.toLowerCase()}`} onClick={onClose} />
    </div>
  )
}

/**
 * A collapsed sidebar: a thin rail with the chevron that opens it and its name written down it.
 * `expanded` while the sidebar shows over the notation from it.
 */
export function SidebarRail({ name, side, expanded, onOpen }: { name: string; side: Side; expanded: boolean; onOpen: () => void }) {
  return (
    <div className={`flex w-8 flex-col items-center bg-panel py-2 ${side === 'left' ? 'border-r' : 'border-l'} border-line`}>
      <button
        type="button"
        aria-label={`Open ${name.toLowerCase()}`}
        aria-expanded={expanded}
        title={`Open ${name.toLowerCase()}`}
        onMouseDown={keepFocus}
        onClick={onOpen}
        className="flex cursor-pointer flex-col items-center gap-2 rounded border-0 bg-transparent px-1 py-1 text-mute hover:bg-hover hover:text-ink"
      >
        <span aria-hidden className="text-base/none">
          {CHEVRON[side].open}
        </span>
        <span className="text-[11px] font-bold tracking-wider [font-variant-caps:var(--heading-caps)] [text-transform:var(--heading-case)] [writing-mode:vertical-rl]">{name}</span>
      </button>
    </div>
  )
}

/** A sidebar shown over the notation from its rail in a narrow window, with a shadow, under the header (its container is `relative`). */
export function SidebarOverlay({ side, children }: { side: Side; children: ReactNode }) {
  return <div className={`absolute inset-y-0 z-30 flex shadow-xl shadow-shade/10 ${side === 'left' ? 'left-8' : 'right-8'}`}>{children}</div>
}

/**
 * A sidebar over the whole screen, on a phone, that slides in from its side while `open` and back
 * out when it closes. A swipe back towards its side follows the finger and closes it (`onClose`).
 * `pull` is how far, in px, a swipe on the screen under it has pulled it in so far: it follows that
 * finger too, before it opens.
 */
export function SidebarFullScreen({
  side,
  open,
  pull,
  onClose,
  children,
}: {
  side: Side
  open: boolean
  pull: number
  onClose: () => void
  children: ReactNode
}) {
  const swipe = useSwipe(side === 'left' ? { left: onClose } : { right: onClose })
  const slide = useSlide(open, pull !== 0)
  if (!slide.present) return null
  // Off the screen past its side, or in place; a finger moves it from there, but never past either.
  const closed = side === 'left' ? '-100%' : '100%'
  const transform = slide.atOpen
    ? `translateX(${side === 'left' ? Math.min(0, swipe.offset.x) : Math.max(0, swipe.offset.x)}px)`
    : side === 'left'
      ? `translateX(min(0px, calc(${closed} + ${Math.max(0, pull)}px)))`
      : `translateX(max(0px, calc(${closed} + ${Math.min(0, pull)}px)))`
  return (
    <div
      {...swipe.props}
      aria-hidden={!open || undefined}
      style={{ transform }}
      className={`fixed inset-0 z-30 flex touch-pan-y bg-panel pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] shadow-xl shadow-shade/15 ${
        swipe.swiping || pull !== 0 ? '' : slideTransition
      } ${open ? '' : 'pointer-events-none'}`}
    >
      {children}
    </div>
  )
}
