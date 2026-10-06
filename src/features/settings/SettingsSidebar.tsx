import type { ReactNode } from 'react'
import { useAppStore } from '@/app/store'
import { PanelHeading } from '@/components/PanelHeading'
import type { ExerciseSettings } from '@/core'

export function SettingsSidebar() {
  return (
    <aside
      aria-label="Settings"
      className="flex flex-col gap-3.5 overflow-auto border-l border-line bg-panel p-3"
    >
      <SettingGroup title="Groove" />
      <SettingGroup title="Sticking">
        <Choice label="Mode" setting="sticking" options={['natural', 'alternate', 'off']} />
        <Choice label="Lead hand" setting="leadHand" options={['R', 'L']} />
      </SettingGroup>
      <SettingGroup title="Exercise">
        <Choice label="Voice" setting="voice" options={['snare', 'bass']} names={{ bass: 'bass drum' }} />
      </SettingGroup>
      <SettingGroup title="Editor" />
      <SettingGroup title="Volume" />
    </aside>
  )
}

function SettingGroup({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <PanelHeading>{title}</PanelHeading>
      {children}
    </section>
  )
}

/** A row of buttons choosing one value of an exercise setting; each change is an undoable edit. */
function Choice<K extends keyof ExerciseSettings>({
  label,
  setting,
  options,
  names = {},
}: {
  label: string
  setting: K
  options: ExerciseSettings[K][]
  names?: Partial<Record<ExerciseSettings[K], string>>
}) {
  const value = useAppStore((s) => s.editor.exercise[setting])
  const dispatch = useAppStore((s) => s.dispatch)
  return (
    <div role="group" aria-label={label} className="flex items-center justify-between gap-2">
      <span className="text-mute">{label}</span>
      <div className="flex overflow-hidden rounded-md border border-line">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={option === value}
            // Keep focus off the button, so the editor's keys still work after a click.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => dispatch({ type: 'setExerciseSettings', settings: { [setting]: option } })}
            className="cursor-pointer border-l border-line bg-card px-2 py-0.5 first:border-l-0 hover:text-accent aria-pressed:bg-accent aria-pressed:text-white aria-pressed:hover:text-white"
          >
            {names[option] ?? option}
          </button>
        ))}
      </div>
    </div>
  )
}
