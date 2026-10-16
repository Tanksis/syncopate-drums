import { useAppStore } from '@/app/store'
import { SidebarHeading } from '@/components/Sidebar'
import { MetronomeRhythm } from '@/features/metronome/MetronomePage'
import { PracticeSettings, GeneralSettings } from '@/features/settings/SettingsSidebar'

/**
 * The desktop's settings sidebar, at the same width and in the same state on both screens. Its top
 * is the screen's own settings, headed Practice settings or Metronome settings: Practice's groove and
 * sticking, or the Metronome's time signature and subdivision; it scrolls when it must. Under it, pinned
 * to the foot, General: the settings that carry over between the screens. `playbackGroup` as for
 * `PracticeSettings`.
 */
export function SettingsSidebar({ onCollapse, playbackGroup }: { onCollapse: () => void; playbackGroup: boolean }) {
  const onMetronome = useAppStore((s) => s.device.screen === 'metronome')
  return (
    <aside aria-label="Settings" className="flex min-h-0 w-[250px] flex-col border-l border-line bg-panel">
      <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-auto p-3">
        <SidebarHeading name={onMetronome ? 'Metronome settings' : 'Practice settings'} sidebarName="Settings" side="right" onCollapse={onCollapse} />
        {onMetronome ? <MetronomeRhythm /> : <PracticeSettings playbackGroup={playbackGroup} />}
      </div>
      <GeneralSettings />
    </aside>
  )
}
