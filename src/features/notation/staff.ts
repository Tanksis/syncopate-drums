// The notation renderer: draws an exercise straight from the model with VexFlow (no MusicXML in
// between). We do the line wrapping ourselves: 4 bars per line, fewer on a narrow window, and a
// short last line keeps the bar width and stays left aligned.

import { Beam, Dot, Formatter, Fraction, Renderer, Stave, StaveNote, StaveTie, Tuplet, Voice } from 'vexflow/bravura'
import type { Cursor, Exercise, Item, PlacedItem } from '@/core'
import { TICKS_PER_BEAT, placeItems, restBar, setBeat } from '@/core'

// Mirrors the accent and a light tint of it from the design tokens in styles/index.css.
const CURSOR_COLOUR = '#2563eb'
const CURRENT_BAR_SHADE = '#eff6ff'

const BARS_PER_LINE = 4
const MIN_BAR_WIDTH = 190
/** Room for the clef (and, on the first line, the time signature) before the first bar's notes. */
const CLEF_WIDTH = 70
const MARGIN = 10
const LINE_HEIGHT = 110
const STAVE_TOP = 10

/** The SVG is drawn in Bravura and Academico, which VexFlow loads as web fonts. */
export const notationFontsReady: Promise<unknown> = Promise.all([
  document.fonts.load('30px Bravura'),
  document.fonts.load('12px Academico'),
])

function vexDuration(item: Item): string {
  const base = { quarter: 'q', eighth: '8', sixteenth: '16' }[item.duration]
  return base + (item.dotted ? 'd' : '') + (item.kind === 'rest' ? 'r' : '')
}

function staveNote(item: Item, highlight: boolean): StaveNote {
  const note = new StaveNote({
    keys: [item.kind === 'rest' ? 'b/4' : 'c/5'],
    duration: vexDuration(item),
    stemDirection: -1,
    clef: 'percussion',
  })
  if (item.dotted) Dot.buildAndAttach([note], { all: true })
  if (highlight) note.setStyle({ fillStyle: CURSOR_COLOUR, strokeStyle: CURSOR_COLOUR })
  return note
}

/**
 * Formats and draws one bar's (or one beat's) notes on a stave, beamed by the beat. Each triplet
 * group gets its tuplet "3", with a bracket when not all of its notes are beamed.
 */
function drawNotes(stave: Stave, placed: readonly PlacedItem[], notes: StaveNote[], beats: number, width: number) {
  const ctx = stave.getContext()
  const byBeat = new Map<number, { notes: StaveNote[]; triplet: boolean }>()
  placed.forEach((p, i) => {
    const beat = Math.floor(p.start / TICKS_PER_BEAT)
    const group = byBeat.get(beat) ?? { notes: [], triplet: p.item.triplet }
    group.notes.push(notes[i])
    byBeat.set(beat, group)
  })
  const groups = [...byBeat.values()]
  // Tuplets first: they scale their notes' ticks, which the beams and the formatter read.
  const tuplets = groups
    .filter((g) => g.triplet)
    .map((g) => new Tuplet(g.notes, { numNotes: 3, notesOccupied: 2, location: Tuplet.LOCATION_BOTTOM }))
  const voice = new Voice({ numBeats: beats, beatValue: 4 }).setStrict(false).addTickables(notes)
  // Beamed beat by beat: VexFlow's own grouping loses count of the beats after a triplet group.
  const beams = groups.flatMap((g) =>
    Beam.generateBeams(g.notes, { groups: [new Fraction(1, 4)], stemDirection: -1 }),
  )
  tuplets.forEach((t) => t.setBracketed(t.getNotes().some((n) => !n.hasBeam())))
  new Formatter().joinVoices([voice]).format([voice], width)
  voice.draw(ctx, stave)
  beams.forEach((beam) => beam.setContext(ctx).draw())
  tuplets.forEach((tuplet) => tuplet.setContext(ctx).draw())
}

/** Where the cursor's line was drawn, so the view can scroll it into view. */
export interface CursorLine {
  top: number
  bottom: number
}

/** Draws the whole exercise into `el`, replacing what was there, at the given width. */
export function drawExercise(el: HTMLElement, exercise: Exercise, cursor: Cursor, width: number): CursorLine {
  el.replaceChildren()
  const { bars } = exercise
  const available = width - 2 * MARGIN - CLEF_WIDTH
  const barsPerLine = Math.max(1, Math.min(BARS_PER_LINE, Math.floor(available / MIN_BAR_WIDTH)))
  const barWidth = Math.floor(available / barsPerLine)
  const lines = Math.ceil(bars.length / barsPerLine)

  const renderer = new Renderer(el as HTMLDivElement, Renderer.Backends.SVG)
  renderer.resize(width, lines * LINE_HEIGHT + STAVE_TOP)
  const ctx = renderer.getContext()
  const placed = placeItems(bars)
  // Every drawn note in exercise order, with its line, for drawing the ties once all bars are formatted.
  const drawn: { note: StaveNote; line: number }[] = []

  bars.forEach((_, b) => {
    const line = Math.floor(b / barsPerLine)
    const column = b % barsPerLine
    const x = MARGIN + (column === 0 ? 0 : CLEF_WIDTH + column * barWidth)
    const w = barWidth + (column === 0 ? CLEF_WIDTH : 0)
    const y = STAVE_TOP + line * LINE_HEIGHT

    const stave = new Stave(x, y, w).setMeasure(b + 1)
    if (column === 0) stave.addClef('percussion')
    if (b === 0) stave.addTimeSignature('4/4')
    if (b === cursor.bar) {
      ctx.save()
      ctx.setFillStyle(CURRENT_BAR_SHADE)
      ctx.fillRect(x, stave.getYForLine(-1), w, stave.getYForLine(5) - stave.getYForLine(-1))
      ctx.restore()
    }
    stave.setContext(ctx).draw()

    const inBar = placed.filter((p) => p.bar === b)
    const notes = inBar.map((p) =>
      staveNote(p.item, b === cursor.bar && Math.floor(p.start / TICKS_PER_BEAT) === cursor.beat),
    )
    drawNotes(stave, inBar, notes, 4, Math.max(30, x + w - stave.getNoteStartX() - 18))
    notes.forEach((note) => drawn.push({ note, line }))
  })

  // A tie that runs over a line break is drawn as two halves: out of one line and into the next.
  placed.forEach((_, i) => {
    if (!placed[i + 1]?.continuation) return
    const from = drawn[i]
    const to = drawn[i + 1]
    const ties =
      from.line === to.line
        ? [new StaveTie({ firstNote: from.note, lastNote: to.note, firstIndexes: [0], lastIndexes: [0] })]
        : [
            new StaveTie({ firstNote: from.note, lastNote: null, firstIndexes: [0], lastIndexes: [0] }),
            incomingTie(to.note),
          ]
    ties.forEach((tie) => tie.setContext(ctx).draw())
  })

  const top = Math.floor(cursor.bar / barsPerLine) * LINE_HEIGHT
  return { top, bottom: top + LINE_HEIGHT + STAVE_TOP }
}

/** The second half of a tie split by a line break: it starts back by the clef, not at the note. */
function incomingTie(note: StaveNote): StaveTie {
  const tie = new StaveTie({ firstNote: null, lastNote: note, firstIndexes: [0], lastIndexes: [0] })
  tie.renderOptions.firstXShift = -12
  return tie
}

/** Draws one beat figure on its own, shrunk to fit a palette tile. */
export function drawFigure(el: HTMLElement, hits: string, width: number, height: number) {
  el.replaceChildren()
  const scale = 0.55
  const placed = placeItems(setBeat([restBar()], 0, 0, hits)).filter((p) => p.start < TICKS_PER_BEAT)
  const renderer = new Renderer(el as HTMLDivElement, Renderer.Backends.SVG)
  renderer.resize(width, height)
  const ctx = renderer.getContext()
  ctx.scale(scale, scale)
  const stave = new Stave(0, -22, width / scale).setContext(ctx)
  stave.draw()
  drawNotes(stave, placed, placed.map((p) => staveNote(p.item, false)), 1, width / scale - 30)
}
