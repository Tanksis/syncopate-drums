import { useAppStore } from '@/app/store'
import { Button } from '@/components/Button'
import { isExample } from '@/core'

/**
 * The first visit's welcome: a card over the notation's paper, the example dimmed behind it, saying
 * what the app does and offering New exercise or Browse examples. Either, or ✕, closes it for good on
 * this device (`welcomeDismissed`). It shows only over an example, which is where a first visit lands.
 * Its parent is the paper, positioned, so the card can cover it.
 */
export function WelcomeCard({ onBrowse }: { /** Shows the Examples list: opens the Library's sidebar or sheet. */ onBrowse: () => void }) {
  const shown = useAppStore((s) => !s.device.welcomeDismissed && isExample(s.editor.exercise.id))
  const createExercise = useAppStore((s) => s.createExercise)
  const setDeviceSettings = useAppStore((s) => s.setDeviceSettings)
  if (!shown) return null
  const dismiss = () => setDeviceSettings({ welcomeDismissed: true })
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-paper/70 p-4">
      <section aria-labelledby="welcome-title" className="relative flex max-w-md flex-col gap-3 rounded-card border border-line bg-card p-5 shadow-popover">
        <Button variant="ghost" icon aria-label="Close the welcome" onClick={dismiss} className="absolute top-2 right-2">
          ✕
        </Button>
        <h2 id="welcome-title" className="m-0 pr-8 font-display text-xl font-bold">
          Welcome to Syncopate!
        </h2>
        <p className="m-0 text-mute">
          Write a drum exercise on the grid, see it as notation with the sticking under it, and play along with a groove and a click. This is an example; make your own or try the others.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              dismiss()
              createExercise()
            }}
          >
            New exercise
          </Button>
          <Button
            size="lg"
            onClick={() => {
              dismiss()
              setDeviceSettings({ libraryTab: 'examples' })
              onBrowse()
            }}
          >
            Browse examples
          </Button>
        </div>
      </section>
    </div>
  )
}
