import { describe, expect, it } from 'vitest'
import type { EditCommand, Exercise } from './index'
import {
  ROWS,
  RUDIMENT_FAMILIES,
  SCHEMA_VERSION,
  applyEdit,
  barTicks,
  builtInAccepts,
  duplicateExercise,
  exerciseToOpenAtLaunch,
  isBuiltIn,
  isExample,
  isRudiment,
  itemTicks,
  meter,
  newEditorState,
  placeItems,
  rudimentExercises,
  rudimentList,
  sticking,
  tabListing,
} from './index'

const rudiments = rudimentExercises()
const byName = (name: string) => rudiments.find((r) => r.name === name)!

/**
 * The hands printed under the snare notes, in order, each after its marks as the text form writes
 * them: `>` when accented, `/` a double or `z` a buzz, then its grace hands in lower case (`lR` a
 * flam, `llR` a drag), as the PAS chart writes them.
 */
function written(exercise: Exercise): string {
  const notes = new Map(placeItems(exercise.bars, 'snare').flatMap((p) => (p.item.kind === 'note' ? [[`${p.bar}:${p.start}`, p.item]] : [])))
  const ROLL = { double: '/', buzz: 'z' }
  return sticking(exercise)
    .map((n) => {
      const note = notes.get(n.noteId)!
      return (note.dynamic === 'accent' ? '>' : '') + (note.roll ? ROLL[note.roll] : '') + (n.graces ?? []).join('').toLowerCase() + n.shown
    })
    .join('')
}

/** How long each struck snare note sounds, in ticks, a tied note counted whole. */
function struckTicks(exercise: Exercise): number[] {
  const ticks: number[] = []
  for (const p of placeItems(exercise.bars, 'snare')) {
    if (p.item.kind !== 'note') continue
    if (p.continuation) ticks[ticks.length - 1] += itemTicks(p.item)
    else ticks.push(itemTicks(p.item))
  }
  return ticks
}

/** One PAS cycle of each rudiment built, from the PAS chart; the exercise repeats it whole. */
const PAS: Record<string, string> = {
  'Single stroke roll': 'RL',
  'Single stroke four': 'RLR>L',
  'Single stroke seven': 'RLRLRL>RLRLRLR>L',
  'Multiple bounce roll': 'zRzL',
  'Triple stroke roll': 'RRRLLL',
  'Double stroke open roll': '/R/L',
  'Five stroke roll': '/R/L>R/L/R>L',
  'Six stroke roll': '>R/L/R>L',
  'Seven stroke roll': '/R/L/R>L/L/R/L>R',
  'Nine stroke roll': '/R/L/R/L>R',
  'Ten stroke roll': '/R/L/R/L>R>L',
  'Eleven stroke roll': '/R/L/R/L/R>L/L/R/L/R/L>R',
  'Thirteen stroke roll': '/R/L/R/L/R/L>R',
  'Fifteen stroke roll': '/R/L/R/L/R/L/R>L/L/R/L/R/L/R/L>R',
  'Seventeen stroke roll': '/R/L/R/L/R/L/R/L>R',
  'Single paradiddle': '>RLRR>LRLL',
  'Double paradiddle': '>RLRLRR>LRLRLL',
  'Triple paradiddle': '>RLRLRLRR>LRLRLRLL',
  'Single paradiddle-diddle': '>RLRRLL',
  Flam: 'lRrL',
  'Flam accent': '>lRLR>rLRL',
  'Flam tap': '>lRR>rLL',
  Flamacue: 'lR>LRLlRrL>RLRrL',
  'Flam paradiddle': '>lRLRR>rLRLL',
  'Single flammed mill': '>lRRLR>rLLRL',
  'Flam paradiddle-diddle': '>lRLRRLL>rLRLLRR',
  Pataflafla: 'lRLRrL',
  'Swiss army triplet': '>lRRL',
  'Inverted flam tap': '>lRL>rLR',
  'Flam drag': '>lRLLR>rLRRL',
  Drag: 'llRrrL',
  'Single drag tap': 'llR>LrrL>R',
  'Double drag tap': 'llRllR>LrrLrrL>R',
  'Lesson 25': 'llRL>RrrLR>L',
  'Single dragadiddle': '>/RLRR>/LRLL',
  'Drag paradiddle #1': '>RllRLRR>LrrLRLL',
  'Drag paradiddle #2': '>RllRllRLRR>LrrLrrLRLL',
  'Single ratamacue': 'llRLR>LrrLRL>R',
  'Double ratamacue': 'llRllRLR>LrrLrrLRL>R',
  'Triple ratamacue': 'llRllRllRLR>LrrLrrLrrLRL>R',
}

/** The rudiments that take two bars to come back to the starting hand; the rest take one. */
const TWO_BARS = [
  'Single stroke seven',
  'Eleven stroke roll',
  'Fifteen stroke roll',
  'Seventeen stroke roll',
  'Double ratamacue',
  'Triple ratamacue',
]

const MIRRORED: Record<string, string> = { R: 'L', L: 'R', r: 'l', l: 'r' }
const mirror = (text: string) => text.replace(/[RLrl]/g, (hand) => MIRRORED[hand])

describe('the rudiments', () => {
  it('are all 40, in PAS order', () => {
    expect(rudiments.map((r) => r.name)).toEqual(Object.keys(PAS))
  })

  it('list all 40 under their four families, in PAS order, each with its exercise', () => {
    const list = rudimentList()
    expect(list.map((r) => r.number)).toEqual(Array.from({ length: 40 }, (_, i) => i + 1))
    expect([...new Set(list.map((r) => r.family))]).toEqual(RUDIMENT_FAMILIES)
    expect(list.map((r) => r.id)).toEqual(rudiments.map((r) => r.id))
    expect(list.find((r) => r.number === 16)).toEqual({ number: 16, name: 'Single paradiddle', family: 'Diddles', id: 'rudiment:single-paradiddle' })
  })

  it('each have a fixed id that isRudiment recognises, and come out the same from two calls', () => {
    expect(rudiments.every((r) => isRudiment(r.id) && !isExample(r.id))).toBe(true)
    expect(isRudiment('rudiment:no-such-rudiment')).toBe(false)
    expect(isRudiment(crypto.randomUUID())).toBe(false)
    expect(rudimentExercises()).toEqual(rudiments)
  })

  it('are valid exercises of this version, never opened', () => {
    for (const r of rudiments) {
      expect(r.schemaVersion).toBe(SCHEMA_VERSION)
      expect(r.lastOpened).toBe(0)
    }
  })

  it("fill every bar with their time signature's beats in both rows", () => {
    for (const r of rudiments) {
      const { beats } = meter(r.timeSignature)
      for (const bar of r.bars) {
        for (const row of ROWS) expect(bar[row].reduce((sum, item) => sum + itemTicks(item), 0)).toBe(barTicks(beats))
      }
    }
  })

  it('stick and accent as the PAS chart does, a whole number of cycles, so they end back on the starting hand', () => {
    for (const r of rudiments) {
      const cycle = PAS[r.name]
      const text = written(r)
      expect(text.length % cycle.length, r.name).toBe(0)
      expect(text, r.name).toBe(cycle.repeat(text.length / cycle.length))
    }
  })

  it('are the fewest bars back to the starting hand', () => {
    for (const r of rudiments) expect(r.bars.length, r.name).toBe(TWO_BARS.includes(r.name) ? 2 : 1)
  })

  it('print a hand on every note, an override, whatever the sticking mode would give', () => {
    for (const r of rudiments) expect(sticking(r).every((n) => n.override === n.shown)).toBe(true)
  })

  it('mirror every hand under Lead hand L', () => {
    for (const r of rudiments) expect(written({ ...r, leadHand: 'L' })).toBe(mirror(written(r)))
    expect(written({ ...byName('Single paradiddle'), leadHand: 'L' })).toBe('>LRLL>RLRR>LRLL>RLRR')
  })

  it('write the paradiddle-diddles, the triple stroke and seven stroke rolls, the flam accent and the Swiss army triplet in triplet eighths', () => {
    for (const name of ['Triple stroke roll', 'Single paradiddle-diddle', 'Flam paradiddle-diddle', 'Flam accent', 'Swiss army triplet']) {
      const items = byName(name).bars[0].snare
      expect(items.every((item) => item.triplet && item.duration === 'eighth'), name).toBe(true)
    }
  })

  it('write the seven stroke roll as triplet eighth doubles and an accented quarter, twice', () => {
    expect(struckTicks(byName('Seven stroke roll'))).toEqual([4, 4, 4, 12, 4, 4, 4, 12])
  })

  it('write the doubles of the stroke rolls and the double stroke open roll as slashed eighths', () => {
    expect(struckTicks(byName('Double stroke open roll'))).toEqual(Array(8).fill(6))
    expect(struckTicks(byName('Five stroke roll'))).toEqual([6, 6, 12, 6, 6, 12])
    expect(struckTicks(byName('Nine stroke roll'))).toEqual([6, 6, 6, 6, 12])
    expect(byName('Nine stroke roll').timeSignature).toBe('3/4')
    expect(struckTicks(byName('Seventeen stroke roll'))).toEqual([...Array(8).fill(6), 12])
  })

  it('write the multiple bounce roll as buzzed sixteenths', () => {
    expect(struckTicks(byName('Multiple bounce roll'))).toEqual(Array(16).fill(3))
  })

  it("write the single dragadiddle's drag as a double on its accented first sixteenth", () => {
    const [first, ...rest] = byName('Single dragadiddle').bars[0].snare
    expect(first).toMatchObject({ duration: 'sixteenth', roll: 'double', dynamic: 'accent', override: 'R' })
    expect(rest.slice(0, 3).every((item) => item.kind === 'note' && !item.roll && !item.grace)).toBe(true)
  })

  it('write the flamacue as four sixteenths and a quarter flam, twice', () => {
    const half = ['sixteenth', 'sixteenth', 'sixteenth', 'sixteenth', 'quarter']
    expect(byName('Flamacue').bars[0].snare.map((item) => item.duration)).toEqual([...half, ...half])
  })

  it('write the flam drag in 3/4 sixteenths, each half an eighth, two sixteenths and an eighth', () => {
    const flamDrag = byName('Flam drag')
    expect(flamDrag.timeSignature).toBe('3/4')
    expect(flamDrag.bars[0].snare.map(itemTicks)).toEqual([6, 3, 3, 6, 6, 3, 3, 6])
  })

  it('write the double drag tap in 3/4 sixteenths, each half a dotted eighth, a sixteenth and an eighth', () => {
    const doubleDragTap = byName('Double drag tap')
    expect(doubleDragTap.timeSignature).toBe('3/4')
    expect(struckTicks(doubleDragTap)).toEqual([9, 3, 6, 9, 3, 6])
    // The second half's dotted eighth starts on the & of 2, so it is tied over into beat 3.
    expect(placeItems(doubleDragTap.bars, 'snare').filter((p) => p.continuation)).toHaveLength(1)
  })

  it('write drag paradiddle #1 in 3/4 sixteenths, each half an eighth and four sixteenths', () => {
    const dragParadiddle = byName('Drag paradiddle #1')
    expect(dragParadiddle.timeSignature).toBe('3/4')
    expect(struckTicks(dragParadiddle)).toEqual([6, 3, 3, 3, 3, 6, 3, 3, 3, 3])
  })

  it("write the ratamacues' sixteenth triplets as triplet eighths, the eighths around them as quarters", () => {
    expect(struckTicks(byName('Single ratamacue'))).toEqual([4, 4, 4, 12, 4, 4, 4, 12])
    expect(byName('Double ratamacue').timeSignature).toBe('3/4')
    expect(struckTicks(byName('Double ratamacue'))).toEqual([12, 4, 4, 4, 12, 12, 4, 4, 4, 12])
    expect(struckTicks(byName('Triple ratamacue'))).toEqual([12, 12, 4, 4, 4, 12, 12, 12, 4, 4, 4, 12])
  })
})

describe('a rudiment open in the app', () => {
  const paradiddle = byName('Single paradiddle')

  it('is listed under the Rudiments tab, and is built in', () => {
    expect(tabListing(paradiddle.id)).toBe('rudiments')
    expect(isBuiltIn(paradiddle.id)).toBe(true)
    expect(isBuiltIn('example:rock-beat')).toBe(true)
    expect(isBuiltIn(crypto.randomUUID())).toBe(false)
  })

  it('refuses edits, as an example does, but takes a change of Lead hand', () => {
    const lead: EditCommand = { type: 'setExerciseSettings', settings: { leadHand: 'L' } }
    expect(builtInAccepts(paradiddle.id, lead)).toBe(true)
    expect(builtInAccepts('example:rock-beat', lead)).toBe(false)
    expect(builtInAccepts(paradiddle.id, { type: 'setExerciseSettings', settings: { sticking: 'natural' } })).toBe(false)
    expect(builtInAccepts(paradiddle.id, { type: 'setExerciseSettings', settings: { sticking: 'natural', leadHand: 'L' } })).toBe(false)
    expect(builtInAccepts(paradiddle.id, { type: 'toggleMark', mark: 'accent', row: 'snare', bar: 0, beat: 0, position: 0 })).toBe(false)
    expect(builtInAccepts(paradiddle.id, { type: 'copyBars' })).toBe(true)
    expect(applyEdit(newEditorState(paradiddle), lead).exercise.leadHand).toBe('L')
  })

  it('copies to the Library as an ordinary exercise with its notes, marks, hands and settings as they are now', () => {
    const now = { ...paradiddle, leadHand: 'L' as const, practice: { ...paradiddle.practice, bpm: 60 } }
    const copy = duplicateExercise(now, { id: 'mine', now: 5 })
    expect(copy).toEqual({ ...now, id: 'mine', name: 'Single paradiddle', lastOpened: 5, folderId: null })
    expect(isBuiltIn(copy.id)).toBe(false)
  })

  it('opens again at launch when it was the one last open', () => {
    expect(exerciseToOpenAtLaunch([], paradiddle.id)).toEqual(paradiddle)
  })
})
