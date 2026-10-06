import { BeatStrip } from './BeatStrip'
import { Palette } from './Palette'
import { useEditorKeys } from './useEditorKeys'

export function GridEditor() {
  useEditorKeys()
  return (
    <section
      aria-label="Grid editor"
      className="flex max-h-[52vh] min-h-[30vh] flex-col gap-3 overflow-auto border-t border-line bg-panel px-4 py-2"
    >
      <BeatStrip />
      <Palette />
    </section>
  )
}
