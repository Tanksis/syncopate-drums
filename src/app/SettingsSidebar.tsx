import { useAppStore } from '@/app/store'
import { SidebarHeading } from '@/components/Sidebar'
import { MetronomeRhythm } from '@/features/metronome/MetronomePage'
import { PracticeSettings, SharedGroups, SharedSettings } from '@/features/settings/SettingsSidebar'
import { AllScreensLabel, useSidebarVariant } from '@/features/settings/GrooveSettingsPrototype'

/**
 * The desktop's settings sidebar, at the same width and in the same state on both screens. Its top
 * is the screen's own settings, headed with the screen's name: Practice's groove and sticking, or the
 * Metronome's time signature and subdivision; it scrolls when it must. Under it, pinned to the foot,
 * the settings that carry over between the screens. `playbackGroup` as for `PracticeSettings`.
 */
export function SettingsSidebar({ onCollapse, playbackGroup }: { onCollapse: () => void; playbackGroup: boolean }) {
  const onMetronome = useAppStore((s) => s.device.screen === 'metronome')
  const variant = useSidebarVariant()
  // PROTOTYPE: one name (Settings, as on the rail and the header's button), one collapse, one scroll.
  if (variant === 'one')
    return (
      <aside aria-label="Settings" className="flex min-h-0 w-[250px] flex-col border-l border-line bg-panel">
        <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-auto p-3">
          <SidebarHeading name="Settings" side="right" onCollapse={onCollapse} />
          {onMetronome ? <MetronomeRhythm /> : <PracticeSettings playbackGroup={playbackGroup} />}
          <AllScreensLabel />
          <SharedGroups />
        </div>
      </aside>
    )
  return (
    <aside aria-label="Settings" className="flex min-h-0 w-[250px] flex-col border-l border-line bg-panel">
      <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-auto p-3">
        <SidebarHeading name={onMetronome ? 'Metronome' : 'Practice'} sidebarName="Settings" side="right" onCollapse={onCollapse} />
        {onMetronome ? <MetronomeRhythm /> : <PracticeSettings playbackGroup={playbackGroup} />}
      </div>
      <SharedSettings />
    </aside>
  )
}
