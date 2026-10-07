import { describe, expect, it } from 'vitest'
import type { Exercise, Item, Note } from './index'
import { SCHEMA_VERSION, exportFile, exportFileName, importConflicts, newExercise, parseImport, planImport } from './index'

const note = (duration: Item['duration'], { tied = false } = {}): Note => ({
  kind: 'note',
  duration,
  dotted: false,
  triplet: false,
  tiedToNext: tied,
})
const rest: Item = { kind: 'rest', duration: 'quarter', dotted: false, triplet: false }

/** Two bars with a tie across the bar line, practised in a loop with a groove and swing. */
const paradiddles: Exercise = {
  ...newExercise({ id: 'paradiddles', now: 300 }),
  name: 'Paradiddles',
  bars: [
    { items: [note('quarter'), note('eighth'), note('eighth'), rest, note('quarter', { tied: true })] },
    { items: [note('quarter'), rest, { ...note('sixteenth'), override: 'L' }, note('sixteenth'), note('eighth'), rest] },
  ],
  sticking: 'alternate',
  leadHand: 'L',
  practice: { bpm: 140, loopRange: { first: 1, last: 1 }, groove: 'jazz', swing: 0.6 },
}
const syncopation = { ...newExercise({ id: 'syncopation-p38', now: 900 }), name: 'Syncopation p.38' }

describe('the export file', () => {
  it('holds the format marker, the schema version and each exercise as stored', () => {
    expect(exportFile([paradiddles, syncopation])).toEqual({
      format: 'drum-app-exercises',
      version: SCHEMA_VERSION,
      exercises: [paradiddles, syncopation],
    })
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
    expect(parseImport(asJson(exportFile([paradiddles, syncopation])))).toEqual({
      ok: true,
      exercises: [paradiddles, syncopation],
    })
  })

  it('migrates a file from before exercises carried a schema version', () => {
    const { schemaVersion: _, ...v0 } = paradiddles
    expect(parseImport(asJson({ format: 'drum-app-exercises', version: 0, exercises: [v0] }))).toEqual({
      ok: true,
      exercises: [{ ...v0, schemaVersion: SCHEMA_VERSION }],
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
    ['a bar that is not four beats long', { ...paradiddles, bars: [{ items: bar1.items.slice(1) }, bar2] }],
    ['an item of an unknown duration', { ...paradiddles, bars: [{ items: [{ ...rest, duration: 'half' }] }] }],
    ['a note without its tie flag', { ...paradiddles, bars: [{ items: [{ ...rest, kind: 'note' }, rest, rest, rest] }] }],
    ['an unknown sticking override', { ...paradiddles, bars: [{ items: [{ ...note('quarter'), override: 'X' }, rest, rest, rest] }] }],
    ['an unknown voice', { ...paradiddles, voice: 'cowbell' }],
    ['an unknown sticking mode', { ...paradiddles, sticking: 'paradiddle' }],
    ['an unknown lead hand', { ...paradiddles, leadHand: 'both' }],
    ['a BPM out of range', { ...paradiddles, practice: { ...paradiddles.practice, bpm: 900 } }],
    ['a swing out of range', { ...paradiddles, practice: { ...paradiddles.practice, swing: 0.9 } }],
    ['an unknown groove', { ...paradiddles, practice: { ...paradiddles.practice, groove: 'polka' } }],
    ['a loop range past the last bar', { ...paradiddles, practice: { ...paradiddles.practice, loopRange: { first: 1, last: 2 } } }],
    ['a loop range ending before it starts', { ...paradiddles, practice: { ...paradiddles.practice, loopRange: { first: 1, last: 0 } } }],
    ['an exercise without a last-opened time', { ...paradiddles, lastOpened: 'yesterday' }],
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
    expect(parseImport(asJson(exportFile([])))).toEqual({ ok: false, reason: expect.stringMatching(/no exercises/) })
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
