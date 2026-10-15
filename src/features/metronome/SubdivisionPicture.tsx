import { useLayoutEffect, useRef } from 'react'
import { Beam, Dot, Formatter, Fraction, Renderer, Stave, StaveNote, Tuplet, Voice } from 'vexflow/bravura'
import type { SubdivisionId } from '@/core'
import { subdivisionNotation, subdivisionOf } from '@/core'
import { VEX_DURATION, notationFontsReady, recolour } from '@/features/notation/staff'

/** The picture's size in px, and how much smaller than the staff it draws. */
const WIDTH = 64
const HEIGHT = 46
const SCALE = 0.62
/** Where, in VexFlow's units, the picture's middle sits: between a triplet's "3" and the rests' feet. */
const MIDDLE_Y = 40
/** The room the notes are spread over, in VexFlow's units. */
const NOTES_WIDTH = 46

/** Draws one beat of a subdivision on a stave that isn't drawn, so the glyphs are the notation's without its lines. */
function drawPicture(el: HTMLDivElement, id: SubdivisionId, size: number, inline: boolean) {
  el.replaceChildren()
  const { triplet, notes } = subdivisionNotation(id)
  const renderer = new Renderer(el, Renderer.Backends.SVG)
  const ctx = renderer.getContext()
  const stave = new Stave(0, 0, NOTES_WIDTH).setContext(ctx)
  const staveNotes = notes.map((n) => {
    const note = new StaveNote({
      keys: ['b/4'],
      duration: VEX_DURATION[n.duration] + (n.dotted ? 'd' : '') + (n.rest ? 'r' : ''),
      stemDirection: 1,
    })
    if (n.dotted) Dot.buildAndAttach([note], { all: true })
    return note
  })
  // The tuplet first: it scales its notes' ticks, which the beams and the formatter read.
  const tuplet = triplet ? new Tuplet(staveNotes, { numNotes: 3, notesOccupied: 2, location: Tuplet.LOCATION_TOP }) : undefined
  // A triplet's beam runs over a rest in its middle, as the staff writes it (ADR 0006).
  const beams = Beam.generateBeams(staveNotes, { groups: [new Fraction(1, 4)], stemDirection: 1, beamRests: triplet, beamMiddleOnly: true })
  tuplet?.setBracketed(staveNotes.some((n) => !n.hasBeam()))
  const voice = new Voice({ numBeats: 1, beatValue: 4 }).setStrict(false).addTickables(staveNotes)
  new Formatter().joinVoices([voice]).format([voice], NOTES_WIDTH)
  voice.draw(ctx, stave)
  beams.forEach((b) => b.setContext(ctx).draw())
  tuplet?.setContext(ctx).draw()

  // Centred across on what was drawn, and at a fixed height, so every picture's glyphs are one size and
  // sit level; `inline`, centred down on the notes too (from stem tip to notehead, as VexFlow boxes
  // them: a glyph's own box runs far above and below it), to sit level with the text beside it.
  const svg = el.querySelector('svg')!
  const box = svg.getBBox()
  const w = WIDTH / SCALE
  const h = HEIGHT / SCALE
  const top = Math.min(...staveNotes.map((n) => n.getBoundingBox().getY()))
  const bottom = Math.max(...staveNotes.map((n) => n.getBoundingBox().getY() + n.getBoundingBox().getH()))
  const middle = inline ? (top + bottom) / 2 : MIDDLE_Y
  svg.setAttribute('viewBox', `${box.x + box.width / 2 - w / 2} ${middle - h / 2} ${w} ${h}`)
  svg.setAttribute('width', String(WIDTH * size))
  svg.setAttribute('height', String(HEIGHT * size))
  // The picture takes its button's text colour.
  recolour(el, 'currentColor')
}

/**
 * A subdivision drawn as one beat of notation with VexFlow, so its glyphs match the staff's, but
 * with no staff lines. It is named by the subdivision's name. `size` scales it from the Rhythm sheet's.
 * An `inline` picture stands for a value written in bold beside it (the Metronome screen's "4/4"): it
 * is centred on its own glyphs, and drawn heavier to match the bold text.
 */
export function SubdivisionPicture({ id, size = 1, inline = false }: { id: SubdivisionId; size?: number; inline?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    let current = true
    notationFontsReady.then(() => current && drawPicture(ref.current!, id, size, inline)).catch((error: unknown) => console.error(error))
    return () => {
      current = false
    }
  }, [id, size, inline])
  return (
    <div
      ref={ref}
      role="img"
      aria-label={subdivisionOf(id).name}
      // A touch heavier: the stems and noteheads outlined in their colour, in the picture's units. The
      // beams are heavy already, and outlined they'd run together, as would a triplet's "3" with its
      // beam. Centred on its notes, a triplet's "3" stands above the picture's box, so it isn't clipped.
      className={`pointer-events-none flex items-center justify-center ${
        inline ? '[&_.vf-notehead_text]:[stroke-width:0.8px] [&_.vf-notehead_text,&_.vf-stem_path]:[stroke:currentColor] [&_.vf-stem_path]:[stroke-width:2.4px] [&_svg]:overflow-visible' : ''
      }`}
      style={{ width: WIDTH * size, height: HEIGHT * size }}
    />
  )
}
