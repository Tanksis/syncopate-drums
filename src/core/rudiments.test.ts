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

/** The hands printed under the snare notes, in order, each after `>` when accented. */
function written(exercise: Exercise): string {
  const accented = new Set(
    placeItems(exercise.bars, 'snare')
      .filter((p) => p.item.kind === 'note' && p.item.dynamic === 'accent')
      .map((p) => `${p.bar}:${p.start}`),
  )
  return sticking(exercise)
    .map((n) => (accented.has(n.noteId) ? '>' : '') + n.shown)
    .join('')
}

/** One PAS cycle of each rudiment built, from the PAS chart; the exercise repeats it whole. */
const PAS: Record<string, string> = {
  'Single stroke roll': 'RL',
  'Single stroke four': 'RLR>L',
  'Single stroke seven': 'RLRLRL>RLRLRLR>L',
  'Single paradiddle': '>RLRR>LRLL',
  'Double paradiddle': '>RLRLRR>LRLRLL',
  'Triple paradiddle': '>RLRLRLRR>LRLRLRLL',
  'Single paradiddle-diddle': '>RLRRLL',
}

const mirror = (text: string) => text.replace(/[RL]/g, (hand) => (hand === 'R' ? 'L' : 'R'))

describe('the rudiments', () => {
  it('are the singles and the diddles so far, in PAS order', () => {
    expect(rudiments.map((r) => r.name)).toEqual(Object.keys(PAS))
  })

  it('list all 40 under their four families, in PAS order, those not built yet without an id', () => {
    const list = rudimentList()
    expect(list.map((r) => r.number)).toEqual(Array.from({ length: 40 }, (_, i) => i + 1))
    expect([...new Set(list.map((r) => r.family))]).toEqual(RUDIMENT_FAMILIES)
    expect(list.filter((r) => r.id).map((r) => r.number)).toEqual([1, 2, 3, 16, 17, 18, 19])
    expect(list.find((r) => r.number === 16)).toEqual({ number: 16, name: 'Single paradiddle', family: 'Diddles', id: 'rudiment:single-paradiddle' })
  })

  it('each have a fixed id that isRudiment recognises, and come out the same from two calls', () => {
    expect(rudiments.every((r) => isRudiment(r.id) && !isExample(r.id))).toBe(true)
    expect(isRudiment('rudiment:flam')).toBe(false)
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
    expect(rudiments.map((r) => r.bars.length)).toEqual([1, 1, 2, 1, 1, 1, 1])
  })

  it('print a hand on every note, an override, whatever the sticking mode would give', () => {
    for (const r of rudiments) expect(sticking(r).every((n) => n.override === n.shown)).toBe(true)
  })

  it('mirror every hand under Lead hand L', () => {
    for (const r of rudiments) expect(written({ ...r, leadHand: 'L' })).toBe(mirror(written(r)))
    expect(written({ ...byName('Single paradiddle'), leadHand: 'L' })).toBe('>LRLL>RLRR>LRLL>RLRR')
  })

  it('write the paradiddle-diddle in triplet eighths', () => {
    const items = byName('Single paradiddle-diddle').bars[0].snare
    expect(items.every((item) => item.triplet && item.duration === 'eighth')).toBe(true)
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
