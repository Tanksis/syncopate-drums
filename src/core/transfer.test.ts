import { describe, expect, it } from 'vitest'
import type { Exercise, Folder, Item, Note } from './index'
import { SCHEMA_VERSION, exportFile, exportFileName, fileIntoFolders, importConflicts, newExercise, parseImport, planImport, restItems } from './index'

const note = (duration: Item['duration'], { tied = false } = {}): Note => ({
  kind: 'note',
  duration,
  dotted: false,
  triplet: false,
  tiedToNext: tied,
})
const rest: Item = { kind: 'rest', duration: 'quarter', dotted: false, triplet: false }

/** Two bars with a tie across the bar line and a kick row, practised in a loop with a groove and swing. */
const paradiddles: Exercise = {
  ...newExercise({ id: 'paradiddles', now: 300 }),
  name: 'Paradiddles',
  bars: [
    {
      snare: [note('quarter'), note('eighth'), note('eighth'), rest, note('quarter', { tied: true })],
      kick: [note('quarter'), rest, rest, rest],
    },
    {
      snare: [note('quarter'), rest, { ...note('sixteenth'), override: 'L' }, note('sixteenth'), note('eighth'), rest],
      kick: restItems(),
    },
  ],
  sticking: 'alternate',
  leadHand: 'L',
  practice: { bpm: 140, loopRange: { first: 1, last: 1 }, groove: 'jazz', swing: 0.6 },
}
const syncopation = { ...newExercise({ id: 'syncopation-p38', now: 900 }), name: 'Syncopation p.38' }

/** The book page folder, and a warm-ups folder none of the exported exercises is in. */
const page38: Folder = { id: 'folder-p38', name: 'Syncopation p.38' }
const warmUps: Folder = { id: 'folder-warm-ups', name: 'Warm-ups' }
const filedSyncopation = { ...syncopation, folderId: page38.id }

describe('the export file', () => {
  it('holds the format marker, the schema version and each exercise as stored', () => {
    expect(exportFile([paradiddles, syncopation], [])).toEqual({
      format: 'drum-app-exercises',
      version: SCHEMA_VERSION,
      folders: [],
      exercises: [paradiddles, syncopation],
    })
  })

  it('lists only the folders the exported exercises are in', () => {
    expect(exportFile([paradiddles, filedSyncopation], [warmUps, page38]).folders).toEqual([page38])
  })
})

describe('the export file name', () => {
  const today = new Date(2026, 9, 7, 23, 30)

  it('is the exercise name for one exercise', () => {
    expect(exportFileName([paradiddles], today)).toBe('Paradiddles.json')
  })

  it('drops characters that are not allowed in file names', () => {
    const named = { ...paradiddles, name: 'Syncopation: p.38 <lines 1/2> "fast"?*|\\' }
    expect(exportFileName([named], today)).toBe('Syncopation p.38 lines 12 fast.json')
  })

  it('falls back to a plain name when nothing of the name is left', () => {
    expect(exportFileName([{ ...paradiddles, name: '???' }], today)).toBe('drum-exercise.json')
  })

  it('is dated with the local date for several exercises', () => {
    expect(exportFileName([paradiddles, syncopation], today)).toBe('drum-exercises-2026-10-07.json')
  })
})

/** The file as the drummer's other computer reads it back. */
const asJson = (file: unknown) => JSON.stringify(file)

describe('parsing an import', () => {
  it('reads back an exported file with its content and practice settings intact', () => {
    expect(parseImport(asJson(exportFile([paradiddles, syncopation], [])))).toEqual({
      ok: true,
      folders: [],
      exercises: [paradiddles, syncopation],
    })
  })

  it('reads back the folders the exercises were in', () => {
    expect(parseImport(asJson(exportFile([paradiddles, filedSyncopation], [page38])))).toEqual({
      ok: true,
      folders: [page38],
      exercises: [paradiddles, filedSyncopation],
    })
  })

  it('reads a version 2 export, from before folders, with every exercise in no folder', () => {
    const { folderId: _, ...v2 } = { ...paradiddles, schemaVersion: 2 }
    expect(parseImport(asJson({ format: 'drum-app-exercises', version: 2, exercises: [v2] }))).toEqual({
      ok: true,
      folders: [],
      exercises: [paradiddles],
    })
  })

  it('puts an exercise in no folder when the file does not list its folder', () => {
    const file = { ...exportFile([filedSyncopation], [page38]), folders: [] }
    expect(parseImport(asJson(file))).toEqual({ ok: true, folders: [], exercises: [syncopation] })
  })

  it.each([
    ['folders that are not a list', { id: 'f', name: 'F' }],
    ['a folder without an id', [{ name: 'F' }]],
    ['a folder without a name', [{ id: 'f', name: 3 }]],
  ])('refuses a file with %s', (_, folders) => {
    const file = { ...exportFile([syncopation], []), folders }
    expect(parseImport(asJson(file))).toEqual({ ok: false, reason: expect.stringMatching(/damaged/) })
  })

  /** Paradiddles as version 1 stored it: one rhythm, its snare row, on one drum, its voice. */
  const { schemaVersion: _, bars, ...settings } = paradiddles
  const v1 = (voice: 'snare' | 'bass') => ({ ...settings, voice, bars: bars.map((bar) => ({ items: bar.snare })) })

  it('migrates a snare exercise from before exercises carried a schema version into the snare row', () => {
    expect(parseImport(asJson({ format: 'drum-app-exercises', version: 0, exercises: [v1('snare')] }))).toEqual({
      ok: true,
      folders: [],
      exercises: [{ ...paradiddles, bars: bars.map((bar) => ({ snare: bar.snare, kick: restItems() })) }],
    })
  })

  it('migrates a version 1 bass drum exercise into the kick row, its overrides dropped', () => {
    const file = { format: 'drum-app-exercises', version: 1, exercises: [{ ...v1('bass'), schemaVersion: 1 }] }
    const kick = [note('quarter'), rest, note('sixteenth'), note('sixteenth'), note('eighth'), rest]
    expect(parseImport(asJson(file))).toEqual({
      ok: true,
      folders: [],
      exercises: [{ ...paradiddles, bars: [{ snare: restItems(), kick: bars[0].snare }, { snare: restItems(), kick }] }],
    })
  })

  it('refuses a file from a newer version of the app', () => {
    const newer = { format: 'drum-app-exercises', version: 99, exercises: [{ ...paradiddles, schemaVersion: 99 }] }
    expect(parseImport(asJson(newer))).toEqual({ ok: false, reason: expect.stringMatching(/newer version/) })
  })

  it.each([
    ["text that isn't JSON", 'Paradiddles: RLRR LRLL'],
    ["JSON that isn't an export", asJson({ name: 'Paradiddles', bars: [] })],
    ['an export from another app', asJson({ format: 'other-app', version: 1, exercises: [] })],
    ['a bare list of exercises', asJson([paradiddles])],
    ['null', 'null'],
  ])('refuses %s', (_, json) => {
    expect(parseImport(json)).toEqual({ ok: false, reason: expect.stringMatching(/isn't a Syncopate! export/) })
  })

  /** An export of the good exercise and then a damaged one, which must refuse the whole file. */
  const withDamaged = (damaged: unknown) =>
    asJson({ format: 'drum-app-exercises', version: SCHEMA_VERSION, exercises: [syncopation, damaged] })
  const [bar1, bar2] = paradiddles.bars

  it.each([
    ['an exercise that is not an object', 'Paradiddles'],
    ['an exercise without an id', { ...paradiddles, id: undefined }],
    ['an exercise without a name', { ...paradiddles, name: 7 }],
    ['an exercise without bars', { ...paradiddles, bars: [] }],
    ['a bar that is not four beats long', { ...paradiddles, bars: [{ ...bar1, snare: bar1.snare.slice(1) }, bar2] }],
    ['a kick row that is not four beats long', { ...paradiddles, bars: [bar1, { ...bar2, kick: bar2.kick.slice(1) }] }],
    ['a bar without its kick row', { ...paradiddles, bars: [{ snare: bar1.snare }, bar2] }],
    ['an item of an unknown duration', { ...paradiddles, bars: [{ ...bar1, snare: [{ ...rest, duration: 'half' }] }] }],
    ['a note without its tie flag', { ...paradiddles, bars: [{ ...bar1, kick: [{ ...rest, kind: 'note' }, rest, rest, rest] }] }],
    ['an unknown sticking override', { ...paradiddles, bars: [{ ...bar1, snare: [{ ...note('quarter'), override: 'X' }, rest, rest, rest] }] }],
    ['an unknown sticking mode', { ...paradiddles, sticking: 'paradiddle' }],
    ['an unknown lead hand', { ...paradiddles, leadHand: 'both' }],
    ['a BPM out of range', { ...paradiddles, practice: { ...paradiddles.practice, bpm: 900 } }],
    ['a swing out of range', { ...paradiddles, practice: { ...paradiddles.practice, swing: 0.9 } }],
    ['an unknown groove', { ...paradiddles, practice: { ...paradiddles.practice, groove: 'polka' } }],
    ['a loop range past the last bar', { ...paradiddles, practice: { ...paradiddles.practice, loopRange: { first: 1, last: 2 } } }],
    ['a loop range ending before it starts', { ...paradiddles, practice: { ...paradiddles.practice, loopRange: { first: 1, last: 0 } } }],
    ['an exercise without a last-opened time', { ...paradiddles, lastOpened: 'yesterday' }],
    ['an exercise in a folder that is not an id', { ...paradiddles, folderId: 7 }],
    ['a second exercise with the same id', syncopation],
  ])('refuses a file with %s', (_, damaged) => {
    expect(parseImport(withDamaged(damaged))).toEqual({ ok: false, reason: expect.stringMatching(/damaged/) })
  })

  it('refuses a file with one exercise from a newer version of the app', () => {
    expect(parseImport(withDamaged({ ...paradiddles, schemaVersion: 99 }))).toEqual({
      ok: false,
      reason: expect.stringMatching(/newer version/),
    })
  })

  it('refuses a file with no exercises in it', () => {
    expect(parseImport(asJson(exportFile([], [])))).toEqual({ ok: false, reason: expect.stringMatching(/no exercises/) })
  })
})

describe('planning an import', () => {
  const triplets = { ...newExercise({ id: 'triplets', now: 500 }), name: 'Triplets' }
  /** The library already holds older copies of paradiddles and syncopation, and a warm-up. */
  const existingIds = ['paradiddles', 'syncopation-p38', 'warm-up']
  const incoming = [paradiddles, syncopation, triplets]
  let made = 0
  const newId = () => `new-${++made}`

  it('counts the exercises already in the library, matched by id only', () => {
    expect(importConflicts(incoming, existingIds)).toBe(2)
    expect(importConflicts([{ ...paradiddles, id: 'other' }], existingIds)).toBe(0)
  })

  it('replaces the exercises already in the library with the imported ones', () => {
    expect(planImport(incoming, existingIds, 'replace', { newId })).toEqual([paradiddles, syncopation, triplets])
  })

  it('keeps both by giving the imported copies new ids and their own names', () => {
    made = 0
    expect(planImport(incoming, existingIds, 'keepBoth', { newId })).toEqual([
      { ...paradiddles, id: 'new-1', name: 'Paradiddles' },
      { ...syncopation, id: 'new-2', name: 'Syncopation p.38' },
      triplets,
    ])
  })

  it('skips the exercises already in the library and imports the rest', () => {
    expect(planImport(incoming, existingIds, 'skip', { newId })).toEqual([triplets])
  })

  it('imports everything as it is when nothing conflicts, whatever the choice', () => {
    for (const choice of ['replace', 'keepBoth', 'skip'] as const) {
      expect(planImport(incoming, ['warm-up'], choice, { newId })).toEqual(incoming)
    }
  })
})

describe('filing an import into folders', () => {
  let made = 0
  const newId = () => `new-folder-${++made}`
  const triplets = { ...newExercise({ id: 'triplets', now: 500 }), name: 'Triplets', folderId: page38.id }

  it('files exercises into the folder of the same name, ignoring case, without making a second', () => {
    const mine: Folder = { id: 'my-p38', name: 'syncopation p.38' }
    expect(fileIntoFolders([paradiddles, filedSyncopation, triplets], [page38], [warmUps, mine], { newId })).toEqual({
      exercises: [paradiddles, { ...filedSyncopation, folderId: 'my-p38' }, { ...triplets, folderId: 'my-p38' }],
      created: [],
    })
  })

  it('makes one folder for exercises whose folder the library lacks', () => {
    made = 0
    const created: Folder = { id: 'new-folder-1', name: 'Syncopation p.38' }
    expect(fileIntoFolders([filedSyncopation, triplets], [page38], [warmUps], { newId })).toEqual({
      exercises: [
        { ...filedSyncopation, folderId: created.id },
        { ...triplets, folderId: created.id },
      ],
      created: [created],
    })
  })

  it('makes no folder when no exercise is in one', () => {
    expect(fileIntoFolders([paradiddles], [page38], [], { newId })).toEqual({ exercises: [paradiddles], created: [] })
  })
})
