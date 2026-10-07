// The notation renderer: draws an exercise straight from the model with VexFlow (no MusicXML in
// between). We do the line wrapping ourselves: 4 bars per line, fewer on a narrow window, and a
// short last line keeps the bar width and stays left aligned.

import { Beam, Dot, Formatter, Fraction, Renderer, Stave, StaveNote, StaveTie, Tuplet, Voice } from 'vexflow/bravura'
import type { Cursor, Duration, Exercise, GrooveChord, Item, LoopRange, NoteSticking, PlacedItem, Voice as DrumVoice } from '@/core'
import { TICKS_PER_BEAT, grooveChords, inLoopRange, placeItems, restBar, setBeat, sticking } from '@/core'

// Mirror the accent, a light tint of it and the loop range's ink and shade from the design tokens in styles/index.css.
const ACCENT_COLOUR = '#2563eb'
const CURRENT_BAR_SHADE = '#eff6ff'
const LOOP_COLOUR = '#b45309'
const LOOP_SHADE = '#fde68a'
/** Height of the loop band drawn behind the bar numbers of the looped bars. */
const LOOP_BAND_HEIGHT = 12

const BARS_PER_LINE = 4
const MIN_BAR_WIDTH = 190
/** Room for the clef (and, on the first line, the time signature) before the first bar's notes. */
const CLEF_WIDTH = 70
const MARGIN = 10
const STAVE_TOP = 10

/** The SVG is drawn in Bravura and Academico, which VexFlow loads as web fonts. */
export const notationFontsReady: Promise<unknown> = Promise.all([
  document.fonts.load('30px Bravura'),
  document.fonts.load('12px Academico'),
])

const VEX_DURATION: Record<Duration, string> = { quarter: 'q', eighth: '8', sixteenth: '16' }

function vexDuration(item: Item): string {
  return VEX_DURATION[item.duration] + (item.dotted ? 'd' : '') + (item.kind === 'rest' ? 'r' : '')
}

/** Where each voice's notes sit on the percussion staff: snare on the third space, bass drum on the first. */
const VOICE_KEY: Record<DrumVoice, string> = { snare: 'c/5', bass: 'f/4' }
/** The same, as a stave line counted down from the top line. */
const VOICE_LINE: Record<DrumVoice, number> = { snare: 1.5, bass: 3.5 }
/** Stave lines from a notehead down past its stem and a tuplet's "3" to the sticking row. */
const HAND_ROW_DROP = 8
/** Stave lines a stave leaves above its top line, for the bar number. */
const SPACE_ABOVE_STAVE = 4
/** More stave lines above for the groove's stems, which reach about this far above the top line. */
const GROOVE_SPACE = 3
const STAVE_LINE_GAP = 10
/** Pixels of clickable space around a printed hand. */
const HAND_HIT_PAD = 3
/** Pixels of clickable space around a bar number, which is printed small. */
const BAR_NUMBER_HIT_PAD = 6

/** The stave line the sticking is printed on, one row for the whole line so the hands read across. */
const handRowLine = (voice: DrumVoice) => VOICE_LINE[voice] + HAND_ROW_DROP

/**
 * Each line of music is tall enough for the sticking row under the voice's stems and tuplets, and
 * for the groove's stems, if any, under the bar numbers.
 */
const lineHeight = (voice: DrumVoice, spaceAbove: number) => (spaceAbove + handRowLine(voice) + 1) * STAVE_LINE_GAP

function staveNote(item: Item, highlight: boolean, voice: DrumVoice = 'snare'): StaveNote {
  const note = new StaveNote({
    keys: [item.kind === 'rest' ? 'b/4' : VOICE_KEY[voice]],
    duration: vexDuration(item),
    stemDirection: -1,
    clef: 'percussion',
  })
  if (item.dotted) Dot.buildAndAttach([note], { all: true })
  if (highlight) note.setStyle({ fillStyle: ACCENT_COLOUR, strokeStyle: ACCENT_COLOUR })
  return note
}

/** A groove chord, stems up, with x noteheads where its hits have them. */
function grooveNote(chord: GrooveChord): StaveNote {
  return new StaveNote({
    keys: chord.hits.map(({ notation }) => notation.key + (notation.notehead === 'x' ? '/x2' : '')),
    duration: VEX_DURATION[chord.duration],
    stemDirection: 1,
    clef: 'percussion',
  })
}

/** Notes grouped by the beat they start in, each group knowing whether it is a triplet group. */
function byBeat(starts: readonly { start: number; triplet: boolean }[], notes: StaveNote[]) {
  const groups = new Map<number, { notes: StaveNote[]; triplet: boolean }>()
  starts.forEach(({ start, triplet }, i) => {
    const beat = Math.floor(start / TICKS_PER_BEAT)
    const group = groups.get(beat) ?? { notes: [], triplet }
    group.notes.push(notes[i])
    groups.set(beat, group)
  })
  return [...groups.values()]
}

/**
 * Formats and draws one bar's (or one beat's) notes on a stave, beamed by the beat, with the
 * groove's chords as a second voice above them. Each triplet group gets its tuplet "3", with a
 * bracket when not all of its notes are beamed.
 */
function drawNotes(
  stave: Stave,
  placed: readonly PlacedItem[],
  notes: StaveNote[],
  beats: number,
  width: number,
  groove: readonly GrooveChord[] = [],
) {
  const ctx = stave.getContext()
  const groups = byBeat(placed.map((p) => ({ start: p.start, triplet: p.item.triplet })), notes)
  // Tuplets first: they scale their notes' ticks, which the beams and the formatter read.
  const tuplets = groups
    .filter((g) => g.triplet)
    .map((g) => new Tuplet(g.notes, { numNotes: 3, notesOccupied: 2, location: Tuplet.LOCATION_BOTTOM }))
  const voiceOf = (tickables: StaveNote[]) =>
    new Voice({ numBeats: beats, beatValue: 4 }).setStrict(false).addTickables(tickables)
  const grooveNotes = groove.map(grooveNote)
  const grooveGroups = byBeat(groove.map((c) => ({ start: c.start, triplet: false })), grooveNotes)
  const voices = grooveNotes.length ? [voiceOf(notes), voiceOf(grooveNotes)] : [voiceOf(notes)]
  // Beamed beat by beat: VexFlow's own grouping loses count of the beats after a triplet group.
  const beam = (stemDirection: number) => (g: { notes: StaveNote[] }) =>
    Beam.generateBeams(g.notes, { groups: [new Fraction(1, 4)], stemDirection })
  const beams = [...groups.flatMap(beam(-1)), ...grooveGroups.flatMap(beam(1))]
  tuplets.forEach((t) => t.setBracketed(t.getNotes().some((n) => !n.hasBeam())))
  const restLines = notes.map((n) => n.getKeyLine(0))
  new Formatter().joinVoices(voices).format(voices, width)
  // A groove chord's stem crosses the whole staff, and VexFlow nudges a rest beside it just a line
  // down, onto the hi-hat foot. Set it back, beside the chord instead, as VexFlow does with notes.
  notes.forEach((note, i) => {
    if (!note.isRest() || note.getKeyLine(0) === restLines[i]) return
    const chord = grooveNotes[groove.findIndex((c) => c.start === placed[i].start)]
    note.setKeyLine(0, restLines[i]).setXShift((chord?.getVoiceShiftWidth() ?? 0) + 2)
  })
  voices.forEach((v) => v.draw(ctx, stave))
  beams.forEach((b) => b.setContext(ctx).draw())
  tuplets.forEach((tuplet) => tuplet.setContext(ctx).draw())
}

/** Where a line of music was drawn, so the view can scroll it into view. */
export interface DrawnLine {
  top: number
  bottom: number
}

/** What was drawn: each struck note's SVG element by note id, and where each bar's line is. */
export interface Drawing {
  noteElements: Map<string, SVGElement>
  line: (bar: number) => DrawnLine
}

/**
 * Draws the whole exercise into `el`, replacing what was there, at the given width. Each note's
 * SVG element carries `data-bar` and `data-beat`, the beat it sits in; each bar number carries
 * `data-loop-bar`, its bar. With no cursor, no beat or bar is highlighted.
 */
export function drawExercise(el: HTMLElement, exercise: Exercise, cursor: Cursor | null, width: number): Drawing {
  el.replaceChildren()
  const { bars } = exercise
  const available = width - 2 * MARGIN - CLEF_WIDTH
  const barsPerLine = Math.max(1, Math.min(BARS_PER_LINE, Math.floor(available / MIN_BAR_WIDTH)))
  const barWidth = Math.floor(available / barsPerLine)
  const lines = Math.ceil(bars.length / barsPerLine)
  const groove = grooveChords(exercise.practice.groove)
  const grooved = groove.length > 0
  const spaceAbove = SPACE_ABOVE_STAVE + (grooved ? GROOVE_SPACE : 0)
  /** The bar number's line above the stave, clear of the groove's stems. */
  const barNumberLine = grooved ? GROOVE_SPACE : 0
  const height = lineHeight(exercise.voice, spaceAbove)

  const renderer = new Renderer(el as HTMLDivElement, Renderer.Backends.SVG)
  renderer.resize(width, lines * height + STAVE_TOP)
  const ctx = renderer.getContext()
  const placed = placeItems(bars)
  const stickings = new Map(sticking(exercise).map((n) => [n.noteId, n]))
  // Every drawn note in exercise order, with its line, for drawing the ties once all bars are formatted.
  const drawn: { note: StaveNote; line: number }[] = []
  const struck = new Map<string, SVGElement>()

  bars.forEach((_, b) => {
    const line = Math.floor(b / barsPerLine)
    const column = b % barsPerLine
    const x = MARGIN + (column === 0 ? 0 : CLEF_WIDTH + column * barWidth)
    const w = barWidth + (column === 0 ? CLEF_WIDTH : 0)
    const y = STAVE_TOP + line * height

    const stave = new Stave(x, y, w, { spaceAboveStaffLn: spaceAbove })
    if (column === 0) stave.addClef('percussion')
    if (b === 0) stave.addTimeSignature('4/4')
    if (b === cursor?.bar) {
      ctx.save()
      ctx.setFillStyle(CURRENT_BAR_SHADE)
      ctx.fillRect(x, stave.getYForLine(-1), w, stave.getYForLine(5) - stave.getYForLine(-1))
      ctx.restore()
    }
    if (inLoopRange(exercise.practice.loopRange, b)) {
      // A band across the top of each looped bar, behind its number, so the range reads as one strip.
      const bandTop = stave.getYForTopText(barNumberLine) + 3 - LOOP_BAND_HEIGHT + 2
      ctx.save()
      ctx.setFillStyle(LOOP_SHADE)
      ctx.fillRect(x, bandTop, w, LOOP_BAND_HEIGHT)
      ctx.restore()
    }
    stave.setContext(ctx).draw()
    drawBarNumber(stave, b, exercise.practice.loopRange, barNumberLine)

    const inBar = placed.filter((p) => p.bar === b)
    const notes = inBar.map((p) =>
      staveNote(
        p.item,
        b === cursor?.bar && Math.floor(p.start / TICKS_PER_BEAT) === cursor.beat,
        exercise.voice,
      ),
    )
    drawNotes(stave, inBar, notes, 4, Math.max(30, x + w - stave.getNoteStartX() - 18), groove)
    notes.forEach((note, i) => {
      // Tagged with its beat, so a click on it can move the cursor there.
      const svg = note.getSVGElement()
      svg?.setAttribute('data-bar', String(b))
      svg?.setAttribute('data-beat', String(Math.floor(inBar[i].start / TICKS_PER_BEAT)))
      svg?.classList.add('cursor-pointer')
      drawn.push({ note, line })
      const noteId = `${b}:${inBar[i].start}`
      if (svg && inBar[i].item.kind === 'note' && !inBar[i].continuation) struck.set(noteId, svg)
      const noteSticking = stickings.get(noteId)
      if (noteSticking) drawHand(stave, note, noteSticking, handRowLine(exercise.voice))
    })
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

  const line = (bar: number) => {
    const top = Math.floor(bar / barsPerLine) * height
    return { top, bottom: top + height + STAVE_TOP }
  }
  return { noteElements: struck, line }
}

/**
 * Prints the bar's number above its start, as VexFlow would, in a group tagged with the bar so a
 * click can loop it, on the given text line above the stave. Bars in a set loop range are numbered
 * in bold, in the loop colour.
 */
function drawBarNumber(stave: Stave, bar: number, loopRange: LoopRange | null, line: number) {
  const ctx = stave.checkContext()
  const looped = inLoopRange(loopRange, bar)
  const group: SVGGElement = ctx.openGroup('bar-number')
  group.dataset.loopBar = String(bar)
  group.classList.add('cursor-pointer')
  const title = document.createElementNS('http://www.w3.org/2000/svg', 'title')
  title.textContent = `Loop bar ${bar + 1} (Shift+click to extend the loop)`
  group.append(title)
  ctx.save()
  ctx.setFont({ ...stave.fontInfo, weight: looped ? 'bold' : stave.fontInfo.weight })
  if (looped) ctx.setFillStyle(LOOP_COLOUR)
  const text = String(bar + 1)
  const width = ctx.measureText(text).width
  const height = Number.parseFloat(String(stave.fontInfo.size))
  const x = stave.getX() - width / 2
  const y = stave.getYForTopText(line) + 3
  ctx.fillText(text, x, y)
  const pad = BAR_NUMBER_HIT_PAD
  ctx.pointerRect(x - pad, y - height - pad, width + 2 * pad, height + 2 * pad)
  ctx.restore()
  ctx.closeGroup()
}

/**
 * Prints the shown R or L centred under a note, on the given stave line, in a group tagged with the
 * note's id so a click can flip it. An override is printed in the accent colour, with a hover hint.
 */
function drawHand(stave: Stave, note: StaveNote, { noteId, shown: hand, override }: NoteSticking, line: number) {
  if (!hand) return
  const ctx = stave.checkContext()
  const group: SVGGElement = ctx.openGroup('hand')
  group.dataset.noteId = noteId
  group.classList.add('cursor-pointer')
  if (override) {
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title')
    title.textContent = 'override, click to reset'
    group.append(title)
  }
  ctx.save()
  ctx.setFont('Academico', 12, 'bold')
  if (override) ctx.setFillStyle(ACCENT_COLOUR)
  const width = ctx.measureText(hand).width
  const x = (note.getNoteHeadBeginX() + note.getNoteHeadEndX()) / 2 - width / 2
  const y = stave.getYForLine(line)
  ctx.fillText(hand, x, y)
  // VexFlow's SVG ignores the pointer, so the hand needs its own invisible hit area to be clicked.
  ctx.pointerRect(x - HAND_HIT_PAD, y - 12 - HAND_HIT_PAD, width + 2 * HAND_HIT_PAD, 14 + 2 * HAND_HIT_PAD)
  ctx.restore()
  ctx.closeGroup()
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
