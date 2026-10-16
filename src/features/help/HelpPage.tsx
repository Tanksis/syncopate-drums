import type { ReactNode } from 'react'
import { usePhoneWindow } from '@/app/useMediaQuery'
import { Button } from '@/components/Button'
import { headingFace } from '@/components/PanelHeading'
import { FullScreenHeading } from '@/components/Sidebar'
import { useModalDialog } from '@/components/useModalDialog'
import type { KeyHelpGroup } from '@/features/editor/keyHelp'
import { KEY_HELP } from '@/features/editor/keyHelp'
import { KeyGroups } from '@/features/editor/CheatSheet'
import { METRONOME_KEY_HELP } from '@/features/metronome/useMetronomeKeys'

/** Every key, the editor's and the Metronome page's. */
const KEYS: KeyHelpGroup[] = [...KEY_HELP, METRONOME_KEY_HELP]

/** The three steps to a first exercise, on a phone and on the desktop. */
const QUICK_START: { title: string; desktop: string; phone: string }[] = [
  {
    title: 'Make an exercise',
    desktop: 'In Exercises, on the left, open the Library tab, press + and choose New.',
    phone: 'Open ☰, then the Library tab, press + and choose New.',
  },
  {
    title: 'Enter the hits',
    desktop: 'Click the squares in the grid editor under the notation: the top row is the snare, the bottom row the kick. Drag a note along to change how long it’s written.',
    phone: 'Press Edit and tap the squares: the top row is the snare, the bottom row the kick. The tick closes the editor.',
  },
  {
    title: 'Press play',
    desktop: 'Press ▶ on the notation, or Ctrl+Space, and play along. Space pauses and resumes.',
    phone: 'Press ▶ in the bar at the foot of the screen, and play along.',
  },
]

/** The app's words, worded from `CONTEXT.md`. */
const WORDS: [word: string, meaning: string][] = [
  ['Exercise', 'A run of bars practised as one unit, such as one numbered line from a method book.'],
  ['Bar', 'One measure of an exercise. Exercises are in 4/4.'],
  ['Snare row', 'The notes played on the snare with the hands: the grid editor’s top row.'],
  ['Kick row', 'The notes played on the bass drum with the feet: the bottom row. Each beat is on sixteenths or triplets, for both rows.'],
  [
    'Sticking',
    'The hand, R or L, under each snare note, and K under a kick no hand plays with. Natural ties each hand to a place in the beat, so the hands keep moving through rests; Alternate swaps hands on every note; Off shows none. Click a hand on the staff to swap it.',
  ],
  ['Groove', 'Drum-set parts played and written with the exercise, such as a jazz ride with the hi-hat on 2 & 4, picked from the presets.'],
  ['Hi-hat foot', 'The hi-hat pedal played under every bar: on 1, quarters, 2 & 4 or the off-beats, with any groove or none.'],
  ['Swing', 'How long the first eighth of each beat is: 50% is straight, 66.7% triplet swing. It eases toward straight as the tempo rises, and written triplets never swing.'],
  ['Loop', 'The bars that repeat as you play, all of them unless you choose: click a bar number to loop it, Shift+click to extend.'],
  ['Count-in', 'One bar of click before the exercise starts, turned on and off with the Count-in chip.'],
]

/** The runtime dependencies in `package.json`, with their licences. */
const CREDITS: [name: string, does: string, license: string][] = [
  ['VexFlow', 'draws the notation', 'MIT'],
  ['React', 'the interface', 'MIT'],
  ['Zustand', 'the app’s state', 'MIT'],
  ['idb', 'storage on this device', 'ISC'],
  ['Fraunces, DM Sans, Geist and Geist Mono', 'the fonts, via Fontsource', 'SIL Open Font License'],
]

/**
 * Help and About: a quick start, the keys (not on a phone, which has none), the app's words, and
 * what the app is, where the exercises are kept, and the credits. A dialog-sized panel on the
 * desktop, which Escape, ✕ or a click outside closes; on a phone it fills the screen, closed by its tick.
 */
export function HelpPage({ onClose }: { onClose: () => void }) {
  const phone = usePhoneWindow()
  const modal = useModalDialog(onClose)
  return (
    <dialog
      {...modal}
      aria-label="Help"
      className={`border-line bg-panel p-0 text-ink backdrop:bg-shade/30 ${
        phone
          ? 'm-0 h-dvh max-h-none w-full max-w-none border-0 pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]'
          : 'm-auto h-[min(44rem,calc(100dvh-4rem))] w-[42rem] max-w-[calc(100vw-2rem)] rounded-lg border shadow-popover'
      }`}
    >
      <div className="flex h-full flex-col">
        {phone ? (
          <FullScreenHeading name="Help" onClose={onClose} className="px-4 pt-3.5 pb-2.5" />
        ) : (
          <div className="flex items-center justify-between gap-2 border-b border-line px-5 py-3">
            <h2 className="m-0 font-display text-xl font-bold">Help</h2>
            <Button variant="ghost" icon aria-label="Close help" title="Close (Esc)" onClick={onClose}>
              ✕
            </Button>
          </div>
        )}
        <div className={`flex min-h-0 flex-1 flex-col gap-6 overflow-auto ${phone ? 'px-4 pt-2 pb-6' : 'px-5 py-4'}`}>
          <Section title="Quick start">
            <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
              {QUICK_START.map((step, i) => (
                <li key={step.title} className="flex gap-3">
                  <span aria-hidden className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/10 font-bold text-accent">
                    {i + 1}
                  </span>
                  <p className="m-0">
                    <span className="font-semibold">{step.title}.</span> <span className="text-mute">{phone ? step.phone : step.desktop}</span>
                  </p>
                </li>
              ))}
            </ol>
          </Section>

          {!phone && (
            <Section title="Keys">
              <div className="text-xs">
                <KeyGroups groups={KEYS} />
              </div>
            </Section>
          )}

          <Section title="Words">
            <dl className="m-0 flex flex-col gap-2">
              {WORDS.map(([word, meaning]) => (
                <div key={word}>
                  <dt className="font-semibold">{word}</dt>
                  <dd className="m-0 text-mute">{meaning}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section title="About">
            <div className="flex flex-col gap-2">
              <p className="m-0">
                Syncopate! is a drum practice tool: write rhythm exercises, such as the lines of Ted Reed’s <i>Syncopation</i>, see the sticking under them,
                add a groove, and play along with a click.
              </p>
              <p className="m-0 text-mute">
                Your exercises stay on this device, in this browser; nothing is sent anywhere. To keep a copy or move them to another device, choose Export
                all from the Library’s ⋯ menu, and Import… there to bring them back.
              </p>
              <p className="m-0 text-mute">Made with these open-source parts:</p>
              <ul className="m-0 flex flex-col gap-0.5 pl-5 text-mute">
                {CREDITS.map(([name, does, license]) => (
                  <li key={name}>
                    <span className="text-ink">{name}</span>, {does} ({license})
                  </li>
                ))}
              </ul>
            </div>
          </Section>
        </div>
      </div>
    </dialog>
  )
}

/** One part of the page, under a heading in the theme's heading face. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-2.5">
      <h3 className={`m-0 text-[13px] text-ink ${headingFace}`}>{title}</h3>
      {children}
    </section>
  )
}
