import type { ReactNode } from 'react'
import { PanelHeading } from './PanelHeading'
import { keepFocus } from './keepFocus'

/** Which side of the app a sidebar is on, which way its chevrons point. */
export type Side = 'left' | 'right'

/** Points away from the middle to collapse, towards it to open. */
const CHEVRON: Record<Side, { collapse: string; open: string }> = {
  left: { collapse: '‹', open: '›' },
  right: { collapse: '›', open: '‹' },
}

const chevronButtonClass =
  'flex size-5 shrink-0 cursor-pointer items-center justify-center rounded border-0 bg-transparent text-base/none text-mute hover:bg-line hover:text-ink'

/** A sidebar's heading, with the chevron that collapses the sidebar to its rail. */
export function SidebarHeading({ name, side, onCollapse }: { name: string; side: Side; onCollapse: () => void }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <PanelHeading>{name}</PanelHeading>
      <button
        type="button"
        aria-label={`Collapse ${name.toLowerCase()}`}
        title={`Collapse ${name.toLowerCase()}`}
        // Keep focus off the button, so Space still pauses.
        onMouseDown={keepFocus}
        onClick={onCollapse}
        className={`-mt-1 ${chevronButtonClass}`}
      >
        <span aria-hidden>{CHEVRON[side].collapse}</span>
      </button>
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
        className="flex cursor-pointer flex-col items-center gap-2 rounded border-0 bg-transparent px-1 py-1 text-mute hover:bg-line hover:text-ink"
      >
        <span aria-hidden className="text-base/none">
          {CHEVRON[side].open}
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wider [writing-mode:vertical-rl]">{name}</span>
      </button>
    </div>
  )
}

/** A sidebar shown over the notation from its rail in a narrow window, with a shadow. */
export function SidebarOverlay({ side, children }: { side: Side; children: ReactNode }) {
  return <div className={`fixed inset-y-0 z-30 flex shadow-xl ${side === 'left' ? 'left-8' : 'right-8'}`}>{children}</div>
}
