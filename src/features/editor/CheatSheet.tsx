import { keepFocus } from '@/components/keepFocus'
import { KEY_HELP } from './keyHelp'

/** The editor's keys; `?` shows and hides it. */
export function CheatSheet({ onClose }: { onClose: () => void }) {
  return (
    <section aria-label="Keys" className="relative rounded-lg border border-line bg-card p-3 text-xs">
      <button
        type="button"
        title="Close (?)"
        aria-label="Close the key sheet"
        onMouseDown={keepFocus}
        onClick={onClose}
        className="absolute top-1.5 right-2 cursor-pointer text-mute hover:text-accent"
      >
        ✕
      </button>
      <div className="columns-[15rem] gap-6">
        {KEY_HELP.map((group) => (
          <div key={group.title} className="mb-3 break-inside-avoid">
            <h3 className="mb-1 font-semibold">{group.title}</h3>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
              {group.keys.map(([keys, does]) => (
                <div key={keys} className="contents">
                  <dt className="font-mono whitespace-nowrap text-ink">{keys}</dt>
                  <dd className="text-mute">{does}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  )
}
