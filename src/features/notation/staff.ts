// The notation renderer: draws an exercise straight from the model with VexFlow (no MusicXML in
// between). We do the line wrapping ourselves: 4 bars per line, fewer on a narrow window, and a
// short last line keeps the bar width and stays left aligned. What to draw comes from the core's
// staff parts: the hands part stems up, the feet part stems down (ADR 0002).

import type { StemmableNote } from 'vexflow/bravura'
import { Beam, Dot, Formatter, Fraction, GhostNote, Renderer, Stave, StaveNote, StaveTie, Tuplet, Voice } from 'vexflow/bravura'
import type { Cursor, Drum, Duration, Exercise, Limb, LoopRange, NoteSticking, PlayPosition, StaffEvent, Voice as DrumVoice } from '@/core'
import { TICKS_PER_BEAT, VOICE_LIMB, inLoopRange, restBar, setBeat, staffParts, sticking } from '@/core'

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

/** Stave lines a stave leaves above its top line, for the bar number. */
const SPACE_ABOVE_STAVE = 4
/** More stave lines above for the hands part's stems, which reach about this far above the top line. */
const STEMS_UP_SPACE = 3
/** The stave line the sticking is printed on: under the hands part's stems... */
const HAND_ROW_HANDS = 6.5
/** ...or under the feet part's stems down, when it is drawn. */
const HAND_ROW_FEET = 9.5
/** ...or further down, under the bass drum line's stems and its tuplets. */
const HAND_ROW_BASS = 11.5
const STAVE_LINE_GAP = 10
/** Pixels of clickable space around a printed hand. */
const HAND_HIT_PAD = 3
/** Pixels of clickable space around a bar number, which is printed small. */
const BAR_NUMBER_HIT_PAD = 6

const STEM_DIRECTION: Record<Limb, 1 | -1> = { hands: 1, feet: -1 }
/** Where each part's rests sit: the middle line, or lower for the feet. */
const REST_KEY: Record<Limb, string> = { hands: 'b/4', feet: 'e/4' }

/** A part's event as drawn: a StaveNote, or a GhostNote for space. */
interface DrawnEvent {
  event: StaffEvent
  note: StemmableNote
}

/** The VexFlow note for one event of a part. Chord keys go bottom to top, the order ties index. */
function eventNote(event: StaffEvent, limb: Limb): StemmableNote {
  const duration = VEX_DURATION[event.duration] + (event.dotted ? 'd' : '')
  if (event.kind === 'space') return new GhostNote({ duration })
  const note = new StaveNote({
    keys: event.kind === 'rest' ? [REST_KEY[limb]] : event.notes.map((n) => n.key + (n.notehead === 'x' ? '/x2' : '')).reverse(),
    duration: duration + (event.kind === 'rest' ? 'r' : ''),
    stemDirection: STEM_DIRECTION[limb],
    clef: 'percussion',
  })
  if (event.dotted) Dot.buildAndAttach([note], { all: true })
  return note
}

/** The index of a drum's key in a chord's StaveNote, whose keys run bottom to top. */
const keyIndex = (event: StaffEvent, drum: Drum) =>
  event.kind === 'chord' ? event.notes.length - 1 - event.notes.findIndex((n) => n.drum === drum) : 0

/** A part's notes grouped by the beat they start in, each group knowing whether it is a triplet group. */
function byBeat(drawn: readonly DrawnEvent[]) {
  const groups = new Map<number, { notes: StemmableNote[]; triplet: boolean }>()
  for (const { event, note } of drawn) {
    const beat = Math.floor(event.start / TICKS_PER_BEAT)
    const group = groups.get(beat) ?? { notes: [], triplet: event.triplet }
    group.notes.push(note)
    groups.set(beat, group)
  }
  return [...groups.values()]
}

/** A part as drawn in one bar, or one beat. */
interface PartDrawing {
  limb: Limb
  drawn: DrawnEvent[]
}

/**
 * Formats and draws one bar's (or one beat's) parts on a stave together, each beamed by the beat.
 * Each triplet group gets its tuplet "3" on the stem side, with a bracket when not all of its
 * notes are beamed.
 */
function drawParts(stave: Stave, parts: readonly PartDrawing[], beats: number, width: number) {
  const ctx = stave.getContext()
  const groups = parts.map((p) => ({ limb: p.limb, groups: byBeat(p.drawn) }))
  // Tuplets first: they scale their notes' ticks, which the beams and the formatter read.
  const tuplets = groups.flatMap(({ limb, groups: g }) =>
    g
      .filter((group) => group.triplet)
      .map(
        (group) =>
          new Tuplet(group.notes, {
            numNotes: 3,
            notesOccupied: 2,
            location: limb === 'hands' ? Tuplet.LOCATION_TOP : Tuplet.LOCATION_BOTTOM,
          }),
      ),
  )
  // Beamed beat by beat: VexFlow's own grouping loses count of the beats after a triplet group.
  const beams = groups.flatMap(({ limb, groups: g }) =>
    g.flatMap((group) => {
      const notes = group.notes.filter((n): n is StaveNote => n instanceof StaveNote)
      return Beam.generateBeams(notes, { groups: [new Fraction(1, 4)], stemDirection: STEM_DIRECTION[limb] })
    }),
  )
  tuplets.forEach((t) => t.setBracketed(t.getNotes().some((n) => !(n as StaveNote).hasBeam?.())))
  const voices = parts.map((p) =>
    new Voice({ numBeats: beats, beatValue: 4 }).setStrict(false).addTickables(p.drawn.map((d) => d.note)),
  )
  new Formatter().joinVoices(voices).format(voices, width)
  voices.forEach((v) => v.draw(ctx, stave))
  beams.forEach((b) => b.setContext(ctx).draw())
  tuplets.forEach((tuplet) => tuplet.setContext(ctx).draw())
}

/** Where a line of music was drawn, so the view can scroll it into view. */
export interface DrawnLine {
  top: number
  bottom: number
}

/** Where the playhead line goes for a hit: across the staff, through the hit's noteheads. */
export interface PlayheadMark {
  x: number
  top: number
  bottom: number
}

/**
 * What was drawn: the SVG, where each bar's line is, and where the playhead line goes for a hit
 * at a position (undefined for a position with nothing struck on the staff).
 */
export interface Drawing {
  svg: SVGSVGElement | null
  line: (bar: number) => DrawnLine
  playheadMark: (position: PlayPosition) => PlayheadMark | undefined
}

/** Stave lines the playhead line reaches above the top line and below the bottom line. */
const PLAYHEAD_OVERHANG = 1.5

/** The x of the middle of a note's noteheads. */
const noteCentre = (note: StaveNote) => (note.getNoteHeadBeginX() + note.getNoteHeadEndX()) / 2

/**
 * Draws the whole exercise into `el`, replacing what was there, at the given width. Each of the
 * exercise part's notes carries `data-bar` and `data-beat`, the beat it sits in; each bar number
 * carries `data-loop-bar`, its bar. With no cursor, no beat or bar is highlighted.
 */
export function drawExercise(el: HTMLElement, exercise: Exercise, cursor: Cursor | null, width: number): Drawing {
  el.replaceChildren()
  const { bars } = exercise
  const available = width - 2 * MARGIN - CLEF_WIDTH
  const barsPerLine = Math.max(1, Math.min(BARS_PER_LINE, Math.floor(available / MIN_BAR_WIDTH)))
  const barWidth = Math.floor(available / barsPerLine)
  const lines = Math.ceil(bars.length / barsPerLine)
  const parts = staffParts(bars, exercise.voice, exercise.practice.groove)
  const exerciseLimb = VOICE_LIMB[exercise.voice]
  /** A part is drawn when it holds the exercise or has a note anywhere. */
  const drawnLimbs = (['hands', 'feet'] as const).filter(
    (limb) => limb === exerciseLimb || parts.some((bar) => bar[limb].some((e) => e.kind === 'chord')),
  )
  const handRow = exerciseLimb === 'feet' ? HAND_ROW_BASS : drawnLimbs.includes('feet') ? HAND_ROW_FEET : HAND_ROW_HANDS
  const spaceAbove = SPACE_ABOVE_STAVE + (drawnLimbs.includes('hands') ? STEMS_UP_SPACE : 0)
  /** The bar number's line above the stave, clear of the hands part's stems. */
  const barNumberLine = drawnLimbs.includes('hands') ? STEMS_UP_SPACE : 0
  const height = (spaceAbove + handRow + 1) * STAVE_LINE_GAP

  const renderer = new Renderer(el as HTMLDivElement, Renderer.Backends.SVG)
  renderer.resize(width, lines * height + STAVE_TOP)
  const ctx = renderer.getContext()
  const stickings = new Map(sticking(exercise).map((n) => [n.noteId, n]))
  /** Each part's last drawn note of each drum, with its line, to tie the next one to. */
  const lastOf = new Map<string, TieEnd>()
  const ties: StaveTie[] = []
  /** Where the playhead line goes for each struck position, by `bar:tick`. */
  const marks = new Map<string, PlayheadMark>()

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

    const drawings = drawnLimbs.map(
      (limb): PartDrawing => ({ limb, drawn: parts[b][limb].map((event) => ({ event, note: eventNote(event, limb) })) }),
    )
    // The cursor's beat is lit in the part holding the exercise.
    for (const { limb, drawn } of drawings) {
      if (limb !== exerciseLimb || b !== cursor?.bar) continue
      for (const { event, note } of drawn) {
        if (Math.floor(event.start / TICKS_PER_BEAT) === cursor.beat) note.setStyle({ fillStyle: ACCENT_COLOUR, strokeStyle: ACCENT_COLOUR })
      }
    }
    drawParts(stave, drawings, 4, Math.max(30, x + w - stave.getNoteStartX() - 18))

    const top = stave.getYForLine(-PLAYHEAD_OVERHANG)
    const bottom = stave.getYForLine(4 + PLAYHEAD_OVERHANG)
    for (const { limb, drawn } of drawings) {
      for (const { event, note } of drawn) {
        if (event.kind !== 'chord' || !(note instanceof StaveNote)) continue
        for (const tick of event.strikes) marks.set(`${b}:${tick}`, { x: noteCentre(note), top, bottom })
        if (limb === exerciseLimb) {
          // Tagged with its beat, so a click on it can move the cursor there.
          const svg = note.getSVGElement()
          svg?.setAttribute('data-bar', String(b))
          svg?.setAttribute('data-beat', String(Math.floor(event.start / TICKS_PER_BEAT)))
          svg?.classList.add('cursor-pointer')
        }
        for (const n of event.notes) {
          const index = keyIndex(event, n.drum)
          const previous = lastOf.get(`${limb}:${n.drum}`)
          if (n.tied && previous) ties.push(...tie(previous, { note, index, line }))
          lastOf.set(`${limb}:${n.drum}`, { note, index, line })
          const noteSticking = n.noteId && !n.tied ? stickings.get(n.noteId) : undefined
          if (noteSticking) drawHand(stave, note, noteSticking, handRow)
        }
      }
    }
  })
  ties.forEach((t) => t.setContext(ctx).draw())

  const line = (bar: number) => {
    const top = Math.floor(bar / barsPerLine) * height
    return { top, bottom: top + height + STAVE_TOP }
  }
  const playheadMark = ({ bar, tick }: PlayPosition) => marks.get(`${bar}:${tick}`)
  return { svg: el.querySelector('svg'), line, playheadMark }
}

/** A notehead a tie can run from or to: its note, its index in the chord, and its line of staves. */
type TieEnd = { note: StaveNote; index: number; line: number }

/** A tie between two noteheads; one that runs over a line break is drawn as two halves. */
function tie(from: TieEnd, to: TieEnd): StaveTie[] {
  if (from.line === to.line) {
    return [new StaveTie({ firstNote: from.note, lastNote: to.note, firstIndexes: [from.index], lastIndexes: [to.index] })]
  }
  const incoming = new StaveTie({ firstNote: null, lastNote: to.note, firstIndexes: [to.index], lastIndexes: [to.index] })
  // The second half starts back by the clef, not at the note.
  incoming.renderOptions.firstXShift = -12
  return [new StaveTie({ firstNote: from.note, lastNote: null, firstIndexes: [from.index], lastIndexes: [from.index] }), incoming]
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
  const x = noteCentre(note) - width / 2
  const y = stave.getYForLine(line)
  ctx.fillText(hand, x, y)
  // VexFlow's SVG ignores the pointer, so the hand needs its own invisible hit area to be clicked.
  ctx.pointerRect(x - HAND_HIT_PAD, y - 12 - HAND_HIT_PAD, width + 2 * HAND_HIT_PAD, 14 + 2 * HAND_HIT_PAD)
  ctx.restore()
  ctx.closeGroup()
}

/** Draws one beat figure on its own, as a bare snare line writes it, shrunk to fit a palette tile. */
export function drawFigure(el: HTMLElement, hits: string, width: number, height: number) {
  el.replaceChildren()
  const scale = 0.55
  const voice: DrumVoice = 'snare'
  const [{ hands }] = staffParts(setBeat([restBar()], 0, 0, hits), voice, 'off')
  const renderer = new Renderer(el as HTMLDivElement, Renderer.Backends.SVG)
  renderer.resize(width, height)
  const ctx = renderer.getContext()
  ctx.scale(scale, scale)
  const stave = new Stave(0, -22, width / scale).setContext(ctx)
  stave.draw()
  const drawn = hands.filter((e) => e.start < TICKS_PER_BEAT).map((event) => ({ event, note: eventNote(event, 'hands') }))
  drawParts(stave, [{ limb: 'hands', drawn }], 1, width / scale - 30)
}
