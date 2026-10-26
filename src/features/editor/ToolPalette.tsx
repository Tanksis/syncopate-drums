import type { Tool } from '@/app/store'
import { useAppStore } from '@/app/store'
import { Button } from '@/components/Button'
import { isBuiltIn } from '@/core'

/** The palette's tools in order, each with its glyph and name. */
const TOOLS: readonly { tool: Tool; glyph: string; name: string; title: string }[] = [
  { tool: 'hit', glyph: '●', name: 'Hit', title: 'Hit: tap a square to add or remove a hit' },
  { tool: 'accent', glyph: '>', name: 'Accent', title: 'Accent: tap a snare hit to accent it, or an empty snare square to add an accented hit' },
]

/**
 * The tool palette over the beat cards (ADR 0017): a row of pills, one held at a time. With Hit held
 * the grid works as it always has; with a mark held, tapping a snare square toggles that mark on its
 * note. It's disabled on a built-in exercise (an example or a rudiment). `large` gives the pills room for a finger, on the phone.
 */
export function ToolPalette({ large = false }: { large?: boolean }) {
  const held = useAppStore((s) => s.tool)
  const setTool = useAppStore((s) => s.setTool)
  const builtIn = useAppStore((s) => isBuiltIn(s.editor.exercise.id))
  return (
    <div role="toolbar" aria-label="Note tool" className="flex flex-wrap items-center gap-1.5">
      {TOOLS.map(({ tool, glyph, name, title }) => (
        <Button
          key={tool}
          variant={tool === held ? 'primary' : 'secondary'}
          size={large ? 'lg' : 'sm'}
          aria-pressed={tool === held}
          title={title}
          disabled={builtIn}
          tabIndex={-1}
          onClick={() => setTool(tool)}
          className="rounded-full! text-xs"
        >
          <span aria-hidden className="font-bold">
            {glyph}
          </span>
          {name}
        </Button>
      ))}
    </div>
  )
}
