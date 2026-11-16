import { Button } from '@/components/Button'
import { CloseIcon } from '@/components/icons'
import type { KeyHelpGroup } from './keyHelp'
import { KEY_HELP } from './keyHelp'

/** The editor's keys; `?` shows and hides it. */
export function CheatSheet({ onClose }: { onClose: () => void }) {
  return (
    <section aria-label="Keys" className="relative rounded-lg border border-line bg-card p-3 text-xs">
      <Button variant="ghost" icon title="Close (?)" aria-label="Close the key sheet" onClick={onClose} className="absolute top-1.5 right-2">
        <CloseIcon />
      </Button>
      <KeyGroups groups={KEY_HELP} level={2} />
    </section>
  )
}

/**
 * Groups of keys, each under its title, in as many columns as fit; the key sheet's and the Help page's.
 * `level` is the titles' heading level: h2 in the key sheet, under the app's h1; h4 in Help's Keys.
 */
export function KeyGroups({ groups, level }: { groups: KeyHelpGroup[]; level: 2 | 4 }) {
  const Heading = `h${level}` as const
  return (
    <div className="columns-[15rem] gap-6">
      {groups.map((group) => (
        <div key={group.title} className="mb-3 break-inside-avoid">
          <Heading className="m-0 mb-1 font-semibold">{group.title}</Heading>
          {/* One key column for every group, so the descriptions line up across them; a longer key wraps. */}
          <dl className="m-0 grid grid-cols-[6.5rem_1fr] gap-x-3 gap-y-0.5">
            {group.keys.map(([keys, does]) => (
              <div key={keys} className="contents">
                <dt className="font-mono text-ink">{keys}</dt>
                <dd className="m-0 text-pretty text-mute">{does}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  )
}
