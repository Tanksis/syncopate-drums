import { describe, expect, it } from 'vitest'
import type { EditCommand, StaffEvent } from './index'
import {
  ROWS,
  SCHEMA_VERSION,
  TICKS_PER_BAR,
  TRIPLET_SWING,
  applyEdit,
  copyExample,
  exampleAccepts,
  exampleExercises,
  isExample,
  isUnchangedNew,
  itemTicks,
  leftoverExamples,
  newEditorState,
  newExercise,
  staffParts,
  sticking,
  withBpm,
} from './index'

const examples = exampleExercises()

describe('the example exercises', () => {
  it('are four, named for what they show, in order', () => {
    expect(examples.map((e) => e.name)).toEqual([
      'Example: syncopated eighths',
      'Example: jazz comping',
      'Example: rock beat',
      'Example: triplets',
    ])
  })

  it('each have a fixed id that isExample recognises, and come out the same from two calls', () => {
    expect(examples.map((e) => e.id)).toEqual([
      'example:syncopated-eighths',
      'example:jazz-comping',
      'example:rock-beat',
      'example:triplets',
    ])
    expect(examples.every((e) => isExample(e.id))).toBe(true)
    expect(exampleExercises()).toEqual(examples)
  })

  it('tells a stored exercise from an example by its id', () => {
    expect(isExample(crypto.randomUUID())).toBe(false)
    expect(isExample('example:unknown')).toBe(false)
  })

  it('are valid exercises of this version, never opened', () => {
    for (const exercise of examples) {
      expect(exercise.schemaVersion).toBe(SCHEMA_VERSION)
      expect(exercise.lastOpened).toBe(0)
      expect(isUnchangedNew(exercise)).toBe(false)
    }
  })

  it('fill every bar with four beats in both rows', () => {
    for (const exercise of examples) {
      for (const bar of exercise.bars) {
        for (const row of ROWS) expect(bar[row].reduce((sum, item) => sum + itemTicks(item), 0)).toBe(TICKS_PER_BAR)
      }
    }
  })
})

describe('what each example shows', () => {
  const [eighths, comping, rock, triplets] = examples

  /** Each event of a part as `start drums`, or `start rest`. */
  const show = (events: readonly StaffEvent[]) =>
    events.map((e) => `${e.start} ${e.kind === 'chord' ? e.notes.map((n) => n.drum).join('+') : e.kind}`)

  it('syncopated eighths: a snare line, straight, with natural sticking from the right hand', () => {
    expect(eighths.practice).toMatchObject({ groove: 'off', swing: 0.5 })
    expect(sticking(eighths).slice(0, 6).map((n) => n.shown)).toEqual(['R', 'R', 'L', 'R', 'R', 'L'])
  })

  it("jazz comping: swung over the jazz ride, the snare's & of 2 in bar 1 written on the let", () => {
    expect(comping.practice).toMatchObject({ groove: 'jazz', swing: TRIPLET_SWING })
    expect(comping.sticking).toBe('off')
    const hands = staffParts(comping.bars, 'jazz', { swung: true })[0].hands
    expect(hands.find((e) => e.start === 20)).toMatchObject({ triplet: true, strikes: [18] })
    expect(show(hands)).toContain('20 ride+snare')
  })

  it('rock beat: kicks on the hi-hat stems in bar 1, and the feet part in bar 2 for the kick off the hi-hat', () => {
    expect(rock.practice).toMatchObject({ groove: 'hihatEighths', swing: 0.5 })
    const [bar1, bar2] = staffParts(rock.bars, 'hihatEighths')
    expect(show(bar1.hands)).toEqual([
      '0 hihat+bass',
      '6 hihat',
      '12 hihat+snare',
      '18 hihat',
      '24 hihat+bass',
      '30 hihat+bass',
      '36 hihat+snare',
      '42 hihat',
    ])
    expect(bar1.feet).toEqual([])
    expect(show(bar2.feet).filter((e) => e.endsWith('bass'))).toEqual(['0 bass', '21 bass', '30 bass'])
  })

  it('triplets: alternate sticking runs R L through every note, across the bar line', () => {
    expect(triplets.sticking).toBe('alternate')
    const hands = sticking(triplets).map((n) => n.shown)
    expect(hands).toHaveLength(18)
    expect(hands.join('')).toBe('RLRLRLRLRLRLRLRLRL')
  })
})

describe('the edits an example accepts', () => {
  const accepts = (...commands: EditCommand[]) => commands.map(exampleAccepts)

  it('accepts cursor moves', () => {
    expect(
      accepts(
        { type: 'move', by: 'beat', step: 1 },
        { type: 'moveTo', bar: 1, beat: 2 },
        { type: 'moveRow' },
        { type: 'jump', to: 'end' },
      ),
    ).toEqual([true, true, true, true])
  })

  it('accepts selecting and copying bars', () => {
    expect(accepts({ type: 'selectBars', step: 1 }, { type: 'copyBars' })).toEqual([true, true])
  })

  it('refuses a hit toggle, a hold drag, a grid switch and a rest', () => {
    expect(
      accepts(
        { type: 'toggleGridPosition', row: 'snare', bar: 0, beat: 0, position: 0 },
        { type: 'setHold', from: { row: 'snare', bar: 0, beat: 0, position: 0 }, to: { row: 'snare', bar: 0, beat: 1, position: 0 } },
        { type: 'setBeatGrid', bar: 0, beat: 0, triplet: true },
        { type: 'rest', stepBack: true },
      ),
    ).toEqual([false, false, false, false])
  })

  it('refuses adding, deleting and pasting bars', () => {
    expect(
      accepts(
        { type: 'addBar' },
        { type: 'duplicateBar' },
        { type: 'deleteBar' },
        { type: 'pasteBars' },
      ),
    ).toEqual([false, false, false, false])
  })

  it('refuses a sticking or lead hand change and sticking overrides', () => {
    expect(
      accepts(
        { type: 'setExerciseSettings', settings: { sticking: 'alternate' } },
        { type: 'setExerciseSettings', settings: { leadHand: 'L' } },
        { type: 'flipOverride', note: { id: '0:0' } },
        { type: 'resetOverrides' },
      ),
    ).toEqual([false, false, false, false])
  })

  it('refuses undo and redo, having no changes of its own', () => {
    expect(accepts({ type: 'undo' }, { type: 'redo' })).toEqual([false, false])
  })
})

describe('copying an example to the library', () => {
  const [eighths] = examples
  const slowed = withBpm(eighths, 60)
  const copy = copyExample(slowed, { id: 'mine', now: 7000, folderId: null })

  it('gives an ordinary exercise under a new id, opened now', () => {
    expect(copy.id).toBe('mine')
    expect(isExample(copy.id)).toBe(false)
    expect(copy.lastOpened).toBe(7000)
  })

  it('drops the "Example: " prefix from the name', () => {
    expect(copy.name).toBe('syncopated eighths')
  })

  it('files it in the folder given', () => {
    expect(copy.folderId).toBeNull()
    expect(copyExample(slowed, { id: 'mine', now: 7000, folderId: 'f1' }).folderId).toBe('f1')
  })

  it('keeps the notes, sticking and the practice settings as they are now', () => {
    expect(copy.bars).toEqual(eighths.bars)
    expect(copy.sticking).toBe('natural')
    expect(copy.leadHand).toBe(eighths.leadHand)
    expect(copy.practice).toEqual({ ...eighths.practice, bpm: 60 })
  })

  it('leaves the example it was copied from as it was', () => {
    expect(slowed).toEqual({ ...eighths, practice: { ...eighths.practice, bpm: 60 } })
  })

  it('is not taken for a leftover example', () => {
    expect(leftoverExamples([copyExample(eighths, { id: 'mine', now: 1, folderId: null })])).toEqual([])
  })
})

describe('examples left in the library by an earlier version', () => {
  // As the first-run-examples build stored them: under new ids, opened since.
  const [eighths, comping, rock, triplets] = examples.map((e, i) => ({ ...e, id: `stored-${i}`, lastOpened: 5000 + i }))
  const own = { ...newExercise({ id: 'own', now: 100 }), name: 'p.38 #2' }

  it('are found under any id and any last-opened time', () => {
    expect(leftoverExamples([own, eighths, comping, rock, triplets])).toEqual(['stored-0', 'stored-1', 'stored-2', 'stored-3'])
  })

  it('are not found once a bar, the name or a practice setting changed', () => {
    const edited = applyEdit(newEditorState(eighths), { type: 'toggleGridPosition', row: 'snare', bar: 0, beat: 0, position: 1 }).exercise
    const renamed = { ...comping, name: 'My comping' }
    const slowed = withBpm(rock, 60)
    const leftHanded = { ...triplets, leadHand: 'L' as const }
    expect(leftoverExamples([edited, renamed, slowed, leftHanded])).toEqual([])
  })
})
