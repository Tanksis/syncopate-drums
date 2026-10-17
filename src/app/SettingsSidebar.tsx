import { useAppStore } from '@/app/store'
import { SidebarHeading } from '@/components/Sidebar'
import { MetronomeRhythm } from '@/features/metronome/MetronomePage'
import { PracticeSettings } from '@/features/settings/SettingsSidebar'

/**
 * The desktop's settings sidebar, at the same width and in the same state on both screens: the
 * screen's own settings, headed Practice settings or Metronome settings: Practice's time, groove and
 * sticking, or the Metronome's time signature and subdivision. It scrolls when it must. The screen's
 * sound (the mix, or the metronome's click and volume) and the appearance are in the header's speaker
 * and Preferences. Its rows are the same at every window width.
 */
export function SettingsSidebar({ onCollapse }: { onCollapse: () => void }) {
  const onMetronome = useAppStore((s) => s.device.screen === 'metronome')
  return (
    <aside aria-label="Settings" className="flex min-h-0 w-[250px] flex-col border-l border-line bg-panel">
      {/* The scrollbar's room is kept, so its coming and going doesn't narrow the rows and move them; the
          padding beside it is less, so the rows sit nearly centred without it. */}
      <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-auto p-3 pr-1.5 [scrollbar-gutter:stable]">
        <SidebarHeading name={onMetronome ? 'Metronome settings' : 'Practice settings'} sidebarName="Settings" side="right" onCollapse={onCollapse} />
        {onMetronome ? <MetronomeRhythm /> : <PracticeSettings />}
      </div>
    </aside>
  )
}
