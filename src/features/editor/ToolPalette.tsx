import type { Tool } from '@/app/store'
import { useAppStore } from '@/app/store'
import { Button } from '@/components/Button'
import type { Mark } from '@/core'
import { isBuiltIn } from '@/core'

/** Each mark's glyph, on its tool and in small print on a marked cell. */
export const MARK_GLYPH: Record<Mark, string> = { accent: '>', ghost: '( )', flam: '♪', drag: '♬', double: '/', buzz: 'z' }

/** The palette's tools in order, each with its glyph and name. */
const TOOLS: readonly { tool: Tool; glyph: string; name: string; title: string }[] = [
  { tool: 'hit', glyph: '●', name: 'Hit', title: 'Hit: tap a square to add or remove a hit' },
  { tool: 'accent', glyph: MARK_GLYPH.accent, name: 'Accent', title: 'Accent: tap a snare hit to accent it, or an empty snare square to add an accented hit' },
  { tool: 'ghost', glyph: MARK_GLYPH.ghost, name: 'Ghost', title: 'Ghost: tap a snare hit to play it soft, or an empty snare square to add a ghosted hit' },
  { tool: 'flam', glyph: MARK_GLYPH.flam, name: 'Flam', title: 'Flam: tap a snare hit to give it one grace note, or an empty snare square to add a flammed hit' },
  { tool: 'drag', glyph: MARK_GLYPH.drag, name: 'Drag', title: 'Drag: tap a snare hit to give it two grace notes, or an empty snare square to add a dragged hit' },
  { tool: 'double', glyph: MARK_GLYPH.double, name: 'Double', title: 'Double: tap a snare hit to play it as two strokes, or an empty snare square to add a doubled hit' },
  { tool: 'buzz', glyph: MARK_GLYPH.buzz, name: 'Buzz', title: 'Buzz: tap a snare hit to buzz it, or an empty snare square to add a buzzed hit' },
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
