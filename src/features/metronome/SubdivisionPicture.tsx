import { useLayoutEffect, useRef } from 'react'
import { Beam, Dot, Formatter, Fraction, Renderer, Stave, StaveNote, Tuplet, Voice } from 'vexflow/bravura'
import type { Duration, SubdivisionId } from '@/core'
import { SUBDIVISIONS, subdivisionNotation } from '@/core'
import { notationFontsReady } from '@/features/notation/staff'

const VEX_DURATION: Record<Duration, string> = { quarter: 'q', eighth: '8', sixteenth: '16' }

/** The picture's size in px, and how much smaller than the staff it draws. */
const WIDTH = 64
const HEIGHT = 46
const SCALE = 0.62
/** Where, in VexFlow's units, the picture's middle sits: between a triplet's "3" and the rests' feet. */
const MIDDLE_Y = 40
/** The room the notes are spread over, in VexFlow's units. */
const NOTES_WIDTH = 46

/** Draws one beat of a subdivision on a stave that isn't drawn, so the glyphs are the notation's without its lines. */
function drawPicture(el: HTMLDivElement, id: SubdivisionId) {
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

  // Centred across on what was drawn, and at a fixed height, so every picture's glyphs are one size and sit level.
  const svg = el.querySelector('svg')!
  const box = svg.getBBox()
  const w = WIDTH / SCALE
  const h = HEIGHT / SCALE
  svg.setAttribute('viewBox', `${box.x + box.width / 2 - w / 2} ${MIDDLE_Y - h / 2} ${w} ${h}`)
  svg.setAttribute('width', String(WIDTH))
  svg.setAttribute('height', String(HEIGHT))
  // VexFlow draws in black; the picture takes its button's text colour.
  for (const attr of ['fill', 'stroke']) {
    for (const node of el.querySelectorAll(`[${attr}="black"], [${attr}="#000000"]`)) node.setAttribute(attr, 'currentColor')
  }
}

/**
 * A subdivision drawn as one beat of notation with VexFlow, so its glyphs match the staff's, but
 * with no staff lines. It is named by the subdivision's name. The Rhythm sheet and the desktop
 * panel share it.
 */
export function SubdivisionPicture({ id }: { id: SubdivisionId }) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    let current = true
    notationFontsReady.then(() => current && drawPicture(ref.current!, id)).catch((error: unknown) => console.error(error))
    return () => {
      current = false
    }
  }, [id])
  return (
    <div
      ref={ref}
      role="img"
      aria-label={SUBDIVISIONS.find((s) => s.id === id)!.name}
      className="pointer-events-none flex items-center justify-center"
      style={{ width: WIDTH, height: HEIGHT }}
    />
  )
}
