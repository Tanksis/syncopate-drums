import { PanelHeading } from '@/components/PanelHeading'

export function LibrarySidebar() {
  return (
    <aside
      aria-label="Exercise library"
      className="flex min-h-0 flex-col gap-2 border-r border-line bg-panel px-2.5 py-3"
    >
      <PanelHeading>Exercises</PanelHeading>
    </aside>
  )
}
