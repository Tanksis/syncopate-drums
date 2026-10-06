import { PanelHeading } from '@/components/PanelHeading'

const settingGroups = ['Groove', 'Sticking', 'Exercise', 'Editor', 'Volume']

export function SettingsSidebar() {
  return (
    <aside
      aria-label="Settings"
      className="flex flex-col gap-3.5 overflow-auto border-l border-line bg-panel p-3"
    >
      {settingGroups.map((group) => (
        <section key={group} className="flex flex-col gap-1.5">
          <PanelHeading>{group}</PanelHeading>
        </section>
      ))}
    </aside>
  )
}
