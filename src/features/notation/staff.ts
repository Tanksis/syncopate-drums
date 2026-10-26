// The notation renderer: draws an exercise straight from the model with VexFlow (no MusicXML in
// between). We do the line wrapping ourselves: 4 bars per line, fewer on a narrow window or for busy
// music, and a short last line keeps the bar width and stays left aligned. An exercise on one line
// spreads its bars across it, a short exercise is drawn bigger and a busy one on a phone smaller,
// at the bar width and scale the core's notationFit picks for the notation area. What to draw
// comes from the core's staff parts: the hands part stems up, the feet part stems down, or one
// voice stems up (ADRs 0002, 0004).

import type { RenderContext, StemmableNote } from 'vexflow/bravura'
import { Articulation, Beam, Dot, Formatter, Fraction, GhostNote, ModifierPosition, Renderer, Stave, StaveNote, StaveTie, Tuplet, Voice } from 'vexflow/bravura'
import type { Cursor, Drum, Duration, Exercise, Limb, LoopRange, Meter, NotationShows, NoteSticking, PlayheadAnchor, PlayPosition, StaffBar, StaffEvent } from '@/core'
import {
  NOTATION_LAYOUT,
  TICKS_PER_BEAT,
  barTicks,
  compoundValue,
  inLoopRange,
  meter,
  minBarWidthFor,
  notationFit,
  playedAsWritten,
  playheadX,
  staffParts,
  sticking,
  swingOn,
} from '@/core'

/** A design token from styles/index.css, read when the notation draws so it follows the look and mode. */
const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim()
/** Height of the loop band drawn behind the bar numbers of the looped bars. */
const LOOP_BAND_HEIGHT = 12

const { clefWidth: CLEF_WIDTH, margin: MARGIN, staveTop: STAVE_TOP } = NOTATION_LAYOUT

/**
 * The SVG is drawn in Bravura and Academico, which VexFlow loads as web fonts. The sticking letters
 * and bar numbers are printed in the look's numbers font, read from its token.
 */
export const notationFontsReady: Promise<unknown> = Promise.all([
  document.fonts.load('30px Bravura'),
  document.fonts.load('12px Academico'),
])

export const VEX_DURATION: Record<Duration, string> = { quarter: 'q', eighth: '8', sixteenth: '16' }

/** VexFlow draws in black, some of it (stems) from its own defaults, so its black becomes `colour`. */
export function recolour(el: Element, colour: string) {
  for (const attr of ['fill', 'stroke']) {
    for (const node of el.querySelectorAll(`[${attr}="black"], [${attr}="#000000"]`)) node.setAttribute(attr, colour)
  }
}

/** Stave lines a stave leaves above its top line, for the bar number. */
const SPACE_ABOVE_STAVE = 4
/** More stave lines above for the hands part's stems, which reach about this far above the top line. */
const STEMS_UP_SPACE = 3
/** The stave line the sticking is printed on: under the hands part's stems... */
const HAND_ROW_HANDS = 6.5
/** ...or under the feet part's stems down, when it is drawn. */
const HAND_ROW_FEET = 9.5
/** ...or under the feet part's triplet "3"s, when it has a triplet group. */
const HAND_ROW_FEET_TRIPLETS = 12
const STAVE_LINE_GAP = 10
/** Pixels of clickable space around a printed hand. */
const HAND_HIT_PAD = 3
/** Pixels of clickable space around a bar number, which is printed small. */
const BAR_NUMBER_HIT_PAD = 6

/**
 * Stave spaces between an accent's baseline and the stem tip it sits over. The `>` glyph's foot is a
 * tenth of a space over its baseline, so this leaves it about a quarter of a space clear.
 */
const ACCENT_BASELINE = 0.15

/**
 * An accent `>` drawn just over its stem's tip, or, in a beam group, over the group's highest tip
 * (`groupTop`), so a group's accents are level. VexFlow's own placement snaps to the stave's half
 * lines and works from the stem as it was before beaming, so the accent places itself as it's drawn.
 */
class Accent extends Articulation {
  groupTop?: number

  renderText(ctx: RenderContext, xPos: number, yPos: number) {
    const top = this.groupTop ?? this.checkAttachedNote().getStemExtents().topY
    this.y = top - ACCENT_BASELINE * STAVE_LINE_GAP
    this.setYShift(0)
    super.renderText(ctx, xPos, yPos)
  }
}

/**
 * Stave spaces a triplet's "3" is placed over its group's highest stem tip when the group has
 * accents: their tops are about 1.2 spaces up, and the "3" reaches half a space below where it's placed.
 */
const TRIPLET_OVER_ACCENTS = 2

/**
 * A triplet group's tuplet. Over accents its "3" sits a step above them, as they place themselves,
 * not where VexFlow reserves room for its own accents.
 */
class Triplet extends Tuplet {
  getYPosition(): number {
    const stems = (this.getNotes() as StemmableNote[]).filter((n) => n.hasStem() && n.getStemDirection() === 1)
    if (!stems.some((n) => n.getModifiers().some((m) => m instanceof Accent))) return super.getYPosition()
    return Math.min(...stems.map((n) => n.getStemExtents().topY)) - TRIPLET_OVER_ACCENTS * STAVE_LINE_GAP
  }
}

const STEM_DIRECTION: Record<Limb, 1 | -1> = { hands: 1, feet: -1 }
/** Where each part's rests sit: the middle line, or lower for the feet. */
const REST_KEY: Record<Limb, string> = { hands: 'b/4', feet: 'e/4' }

/** A part's event as drawn: a StaveNote, or a GhostNote for space. */
interface DrawnEvent {
  event: StaffEvent
  note: StemmableNote
}

/**
 * The VexFlow note for one event of a part. Chord keys go bottom to top, the order ties index. In
 * compound time a value is written half as long again, with no triplet "3" (ADR 0015). An accented
 * note gets its `>` above the stem, as a modifier, so the formatter makes room for it.
 */
function eventNote(event: StaffEvent, limb: Limb, compound: boolean): StemmableNote {
  const value = compound ? compoundValue(event) : event
  const duration = VEX_DURATION[value.duration] + (value.dotted ? 'd' : '')
  if (event.kind === 'space') return new GhostNote({ duration })
  const note = new StaveNote({
    keys: event.kind === 'rest' ? [REST_KEY[limb]] : event.notes.map((n) => n.key + (n.notehead === 'x' ? '/x2' : '')).reverse(),
    duration: duration + (event.kind === 'rest' ? 'r' : ''),
    stemDirection: STEM_DIRECTION[limb],
    clef: 'percussion',
  })
  if (value.dotted) Dot.buildAndAttach([note], { all: true })
  const accented = event.kind === 'chord' ? event.notes.find((n) => n.accent) : undefined
  if (accented) {
    note.addModifier(new Accent('a>').setPosition(ModifierPosition.ABOVE), keyIndex(event, accented.drum))
  }
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
 * notes are beamed. In compound time a beat's three eighths are written plain, with no "3".
 */
function drawParts(stave: Stave, parts: readonly PartDrawing[], { beats, compound }: Meter, width: number) {
  const ctx = stave.getContext()
  const groups = parts.map((p) => ({ limb: p.limb, groups: byBeat(p.drawn) }))
  // Tuplets first: they scale their notes' ticks, which the beams and the formatter read.
  const tuplets = groups.flatMap(({ limb, groups: g }) =>
    g
      .filter((group) => group.triplet && !compound)
      .map(
        (group) =>
          new Triplet(group.notes, {
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
      // A triplet group's beam runs over a rest in its middle, as a swung ride is written (ADR 0006).
      return Beam.generateBeams(notes, {
        groups: [compound ? new Fraction(3, 8) : new Fraction(1, 4)],
        stemDirection: STEM_DIRECTION[limb],
        beamRests: group.triplet,
        beamMiddleOnly: true,
      })
    }),
  )
  tuplets.forEach((t) => t.setBracketed(t.getNotes().some((n) => !(n as StaveNote).hasBeam?.())))
  // A compound bar is counted in eighths: 6/8, or 12/8.
  const time = compound ? { numBeats: beats * 3, beatValue: 8 } : { numBeats: beats, beatValue: 4 }
  const voices = parts.map((p) =>
    new Voice(time).setStrict(false).addTickables(p.drawn.map((d) => d.note)),
  )
  new Formatter().joinVoices(voices).format(voices, width)
  // The beams set their stems' lengths before the notes and their accents are drawn, from the notes
  // on the stave, so an accent sits over its stem's real tip rather than an unbeamed one's.
  for (const { drawn } of parts) for (const { note } of drawn) note.setStave(stave)
  beams.forEach((b) => b.postFormat())
  for (const beam of beams) {
    const notes = beam.getNotes()
    const groupTop = Math.min(...notes.map((n) => n.getStemExtents().topY))
    for (const note of notes) for (const m of note.getModifiers()) if (m instanceof Accent) m.groupTop = groupTop
  }
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
 * at a position (in Played, undefined for a position with nothing struck on the staff; in Written,
 * a hit between written notes is placed between them).
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
 * A written bar's playhead anchors: where each written note or rest starts (a note's x winning over
 * a rest's at the same tick), then the bar's end.
 */
function writtenAnchors(drawings: PartDrawing[], end: PlayheadAnchor): PlayheadAnchor[] {
  const struck = drawings.flatMap(({ drawn }) => drawn).filter((d): d is DrawnEvent & { note: StaveNote } => d.note instanceof StaveNote)
  struck.sort((p, q) => Number(q.event.kind === 'chord') - Number(p.event.kind === 'chord'))
  const atTick = new Map<number, number>()
  for (const { event, note } of struck) if (!atTick.has(event.start)) atTick.set(event.start, noteCentre(note))
  atTick.set(end.tick, end.x)
  return [...atTick].map(([tick, x]) => ({ tick, x })).sort((p, q) => p.tick - q.tick)
}

/** One version of the exercise as drawn: its parts, the parts drawn, and the room they take. */
interface StaffVersion {
  parts: StaffBar[]
  drawnLimbs: Limb[]
  /** The stave line the sticking is printed on. */
  handRow: number
  /** Stave lines left above the stave's top line. */
  spaceAbove: number
}

function staffVersion(parts: StaffBar[], compound: boolean): StaffVersion {
  /** A part is drawn when it has a note or a rest anywhere. */
  const drawnLimbs = (['hands', 'feet'] as const).filter((limb) => parts.some((bar) => bar[limb].some((e) => e.kind !== 'space')))
  // Compound time's eighths have no triplet "3"s to make room for.
  const feetTriplets = !compound && parts.some((bar) => bar.feet.some((e) => e.triplet))
  const handRow = !drawnLimbs.includes('feet') ? HAND_ROW_HANDS : feetTriplets ? HAND_ROW_FEET_TRIPLETS : HAND_ROW_FEET
  const spaceAbove = SPACE_ABOVE_STAVE + (drawnLimbs.includes('hands') ? STEMS_UP_SPACE : 0)
  return { parts, drawnLimbs, handRow, spaceAbove }
}

/** The notation area the exercise is drawn to fit, in pixels. */
export interface NotationArea {
  width: number
  height: number
  /** A short exercise grows, onto more lines if need be, to fill the area (see `notationFit`). */
  grow?: boolean
}

/**
 * Draws the whole exercise into `el`, replacing what was there, to fit the area: at its width, and
 * scaled up when the exercise is short enough (the whole SVG is scaled, so hit areas and the
 * playhead line scale with it). Each struck
 * chord carries `data-bar` and `data-beat`, the beat it sits in; each bar number
 * carries `data-loop-bar`, its bar. With no cursor, no beat or bar is highlighted. When the exercise
 * isn't played as written, `shows` picks the version drawn, and each line is laid out to fit either.
 */
export function drawExercise(
  el: HTMLElement,
  exercise: Exercise,
  cursor: Cursor | null,
  area: NotationArea,
  shows: NotationShows = 'played',
): Drawing {
  el.replaceChildren()
  const { bars, practice } = exercise
  const barMeter = meter(exercise.timeSignature)
  const { compound } = barMeter
  const played = staffVersion(
    staffParts(bars, practice.pattern, {
      swung: swingOn(practice),
      hihatFoot: practice.hihatFoot,
      bassDrum: practice.bassDrum,
      compound,
    }),
    compound,
  )
  // Played as written, the two versions are one. Otherwise each line fits both, so switching moves nothing (ADR 0016).
  const written = playedAsWritten(practice, exercise.timeSignature) ? played : staffVersion(staffParts(bars, 'off', { compound }), compound)
  const versions = [played, written]
  const { parts, drawnLimbs, handRow } = shows === 'written' ? written : played
  const spaceAbove = Math.max(...versions.map((v) => v.spaceAbove))
  /** The bar number's line above the stave, clear of the hands part's stems. */
  const barNumberLine = spaceAbove - SPACE_ABOVE_STAVE
  const height = (spaceAbove + Math.max(...versions.map((v) => v.handRow)) + 1) * STAVE_LINE_GAP
  const minBarWidth = Math.max(...versions.map((v) => minBarWidthFor(v.parts)))
  const { scale, barsPerLine, barWidth } = notationFit({ bars: bars.length, ...area, lineHeight: height, minBarWidth })
  const lines = Math.ceil(bars.length / barsPerLine)

  const renderer = new Renderer(el as HTMLDivElement, Renderer.Backends.SVG)
  renderer.resize(area.width, Math.ceil((lines * height + STAVE_TOP) * scale))
  const ctx = renderer.getContext()
  ctx.scale(scale, scale)
  const colour = {
    ink: token('color-ink'),
    notationAccent: token('color-notation-accent'),
    currentBar: token('color-accent-tint'),
    loopInk: token('color-loop-ink'),
    loop: token('color-loop'),
  }
  const font = token('font-numbers')
  const stickings = new Map(sticking(exercise).map((n) => [n.noteId, n]))
  /** The last drawn note of each drum, with its line, to tie the next one to. */
  const lastOf = new Map<string, TieEnd>()
  const ties: StaveTie[] = []
  /** Where the playhead line goes for each struck position, by `bar:tick`. */
  const marks = new Map<string, PlayheadMark>()
  /**
   * In Written, each bar's anchors, so a hit the written line has no note for (a ride, a foot, a
   * swung &) is placed between the written notes around it.
   */
  const barAnchors = new Map<number, { anchors: PlayheadAnchor[]; top: number; bottom: number }>()

  bars.forEach((_, b) => {
    const line = Math.floor(b / barsPerLine)
    const column = b % barsPerLine
    const x = MARGIN + (column === 0 ? 0 : CLEF_WIDTH + column * barWidth)
    const w = barWidth + (column === 0 ? CLEF_WIDTH : 0)
    const y = STAVE_TOP + line * height

    const stave = new Stave(x, y, w, { spaceAboveStaffLn: spaceAbove })
    if (column === 0) stave.addClef('percussion')
    if (b === 0) stave.addTimeSignature(exercise.timeSignature)
    if (b === cursor?.bar) {
      ctx.save()
      ctx.setFillStyle(colour.currentBar)
      ctx.fillRect(x, stave.getYForLine(-1), w, stave.getYForLine(5) - stave.getYForLine(-1))
      ctx.restore()
    }
    if (inLoopRange(exercise.practice.loopRange, b)) {
      // A band across the top of each looped bar, behind its number, so the range reads as one strip.
      const bandTop = stave.getYForTopText(barNumberLine) + 3 - LOOP_BAND_HEIGHT + 2
      ctx.save()
      ctx.setFillStyle(colour.loop)
      ctx.fillRect(x, bandTop, w, LOOP_BAND_HEIGHT)
      ctx.restore()
    }
    stave.setContext(ctx).draw()
    drawBarNumber(stave, b, exercise.practice.loopRange, barNumberLine, colour.loopInk, font)

    const drawings = drawnLimbs
      .filter((limb) => parts[b][limb].length)
      .map((limb): PartDrawing => ({ limb, drawn: parts[b][limb].map((event) => ({ event, note: eventNote(event, limb, compound) })) }))
    // The cursor's beat is lit in both parts, which hold the snare row and the kick row.
    for (const { drawn } of drawings) {
      if (b !== cursor?.bar) continue
      for (const { event, note } of drawn) {
        if (Math.floor(event.start / TICKS_PER_BEAT) === cursor.beat) note.setStyle({ fillStyle: colour.notationAccent, strokeStyle: colour.notationAccent })
      }
    }
    drawParts(stave, drawings, barMeter, Math.max(30, x + w - stave.getNoteStartX() - 18))

    const top = stave.getYForLine(-PLAYHEAD_OVERHANG)
    const bottom = stave.getYForLine(4 + PLAYHEAD_OVERHANG)
    if (shows === 'written') {
      const anchors = writtenAnchors(drawings, { tick: barTicks(barMeter.beats), x: x + w })
      barAnchors.set(b, { anchors, top, bottom })
    }
    for (const { drawn } of drawings) {
      for (const { event, note } of drawn) {
        if (event.kind !== 'chord' || !(note instanceof StaveNote)) continue
        for (const tick of event.strikes) marks.set(`${b}:${tick}`, { x: noteCentre(note), top, bottom })
        // Tagged with its beat, so a click on it can move the cursor there.
        const svg = note.getSVGElement()
        svg?.setAttribute('data-bar', String(b))
        svg?.setAttribute('data-beat', String(Math.floor(event.start / TICKS_PER_BEAT)))
        svg?.classList.add('cursor-pointer')
        for (const n of event.notes) {
          const index = keyIndex(event, n.drum)
          const previous = lastOf.get(n.drum)
          if (n.tied && previous) ties.push(...tie(previous, { note, index, line }))
          lastOf.set(n.drum, { note, index, line })
          const noteSticking = n.noteId && !n.tied ? stickings.get(n.noteId) : undefined
          if (noteSticking) drawSticking(stave, note, noteSticking, handRow, colour.notationAccent, font)
        }
      }
    }
  })
  ties.forEach((t) => t.setContext(ctx).draw())
  recolour(el, colour.ink)

  // In the page's pixels, so scaled.
  const line = (bar: number) => {
    const top = Math.floor(bar / barsPerLine) * height * scale
    return { top, bottom: top + (height + STAVE_TOP) * scale }
  }
  const playheadMark = ({ bar, tick }: PlayPosition) => {
    const mark = marks.get(`${bar}:${tick}`)
    const written = barAnchors.get(bar)
    if (mark || !written) return mark
    return { x: playheadX(written.anchors, tick), top: written.top, bottom: written.bottom }
  }
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
function drawBarNumber(stave: Stave, bar: number, loopRange: LoopRange | null, line: number, loopInk: string, font: string) {
  const ctx = stave.checkContext()
  const looped = inLoopRange(loopRange, bar)
  const group: SVGGElement = ctx.openGroup('bar-number')
  group.dataset.loopBar = String(bar)
  group.classList.add('cursor-pointer')
  const title = document.createElementNS('http://www.w3.org/2000/svg', 'title')
  title.textContent = `Loop bar ${bar + 1} (Shift+click to extend the loop)`
  group.append(title)
  ctx.save()
  ctx.setFont({ ...stave.fontInfo, family: font, weight: looped ? 'bold' : stave.fontInfo.weight })
  if (looped) ctx.setFillStyle(loopInk)
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
 * Prints the shown R, L or K centred under a note, on the given stave line. A hand's group is tagged
 * with the note's id so a click can flip it, and an override is printed in the notation's accent colour, with
 * a hover hint. A kick's K has nothing to flip.
 */
function drawSticking(
  stave: Stave,
  note: StaveNote,
  { noteId, shown: label, override, row }: NoteSticking,
  line: number,
  accent: string,
  font: string,
) {
  if (!label) return
  const ctx = stave.checkContext()
  const flippable = row === 'snare'
  const group: SVGGElement = ctx.openGroup(flippable ? 'hand' : 'kick')
  if (flippable) {
    group.dataset.noteId = noteId
    group.classList.add('cursor-pointer')
  }
  if (override) {
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title')
    title.textContent = 'override, click to reset'
    group.append(title)
  }
  ctx.save()
  ctx.setFont(font, 12, 'bold')
  if (override) ctx.setFillStyle(accent)
  const width = ctx.measureText(label).width
  const x = noteCentre(note) - width / 2
  const y = stave.getYForLine(line)
  ctx.fillText(label, x, y)
  // VexFlow's SVG ignores the pointer, so the hand needs its own invisible hit area to be clicked.
  if (flippable) ctx.pointerRect(x - HAND_HIT_PAD, y - 12 - HAND_HIT_PAD, width + 2 * HAND_HIT_PAD, 14 + 2 * HAND_HIT_PAD)
  ctx.restore()
  ctx.closeGroup()
}
