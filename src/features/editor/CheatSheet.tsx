import { Button } from '@/components/Button'
import type { KeyHelpGroup } from './keyHelp'
import { KEY_HELP } from './keyHelp'

/** The editor's keys; `?` shows and hides it. */
export function CheatSheet({ onClose }: { onClose: () => void }) {
  return (
    <section aria-label="Keys" className="relative rounded-lg border border-line bg-card p-3 text-xs">
      <Button variant="ghost" icon title="Close (?)" aria-label="Close the key sheet" onClick={onClose} className="absolute top-1.5 right-2">
        ✕
      </Button>
      <KeyGroups groups={KEY_HELP} />
    </section>
  )
}

/** Groups of keys, each under its title, in as many columns as fit; the key sheet's and the Help page's. */
export function KeyGroups({ groups }: { groups: KeyHelpGroup[] }) {
  return (
    <div className="columns-[15rem] gap-6">
      {groups.map((group) => (
        <div key={group.title} className="mb-3 break-inside-avoid">
          <h3 className="m-0 mb-1 font-semibold">{group.title}</h3>
          <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
            {group.keys.map(([keys, does]) => (
              <div key={keys} className="contents">
                <dt className="font-mono whitespace-nowrap text-ink">{keys}</dt>
                <dd className="m-0 text-mute">{does}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  )
}
