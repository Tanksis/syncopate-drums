import { describe, expect, it } from 'vitest'
import type { Item, Note } from './index'
import { SCHEMA_VERSION, migrateExercise, newExercise, restItems } from './index'

const note = (duration: Item['duration'], extra: Partial<Note> = {}): Note => ({
  kind: 'note',
  duration,
  dotted: false,
  triplet: false,
  tiedToNext: false,
  ...extra,
})
const rest: Item = { kind: 'rest', duration: 'quarter', dotted: false, triplet: false }

/** A version-1 exercise: one rhythm on one drum, its voice. */
function v1(voice: 'snare' | 'bass', items: Item[][]) {
  const { bars: _, ...current } = newExercise({ id: 'e1', now: 5 })
  return { ...current, schemaVersion: 1, voice, bars: items.map((i) => ({ items: i })) }
}

const line: Item[] = [note('quarter', { override: 'L' }), note('eighth'), note('eighth', { tiedToNext: true }), note('quarter')]

describe('the migration chain', () => {
  it('brings an exercise stored before schema versions existed up to the current shape', () => {
    const { schemaVersion: _, ...v0 } = v1('snare', [line])
    const { voice: __, ...expected } = { ...v0, schemaVersion: SCHEMA_VERSION, bars: [{ snare: line, kick: restItems() }] }
    expect(migrateExercise(v0)).toEqual(expected)
  })

  it('leaves a current exercise as it is', () => {
    const current = newExercise({ id: 'e1', now: 5 })
    expect(migrateExercise(current)).toEqual(current)
  })

  it('refuses an exercise from a newer version of the app', () => {
    const newer = { ...newExercise({ id: 'e1', now: 5 }), schemaVersion: 99 }
    expect(() => migrateExercise(newer)).toThrow(/newer version/)
  })
})

describe('version 1 to 2: the snare row and the kick row (ADR 0005)', () => {
  it('puts a snare exercise in the snare row, over a resting kick row, with its overrides', () => {
    const migrated = migrateExercise(v1('snare', [line, [rest, rest, rest, rest]]))
    expect(migrated.bars).toEqual([
      { snare: line, kick: restItems() },
      { snare: [rest, rest, rest, rest], kick: restItems() },
    ])
    expect(migrated).not.toHaveProperty('voice')
    expect(migrated.schemaVersion).toBe(SCHEMA_VERSION)
  })

  it('puts a bass drum exercise in the kick row, its overrides dropped, under a resting snare row', () => {
    const migrated = migrateExercise(v1('bass', [line]))
    const [first, ...others] = line
    expect(migrated.bars).toEqual([{ snare: restItems(), kick: [note('quarter'), ...others] }])
    expect(first).toHaveProperty('override')
    expect(migrated).not.toHaveProperty('voice')
  })
})

describe('version 2 to 3: folders', () => {
  it('puts a version-2 exercise in no folder', () => {
    const { folderId: _, ...v2 } = { ...newExercise({ id: 'e1', now: 5 }), schemaVersion: 2 }
    const migrated = migrateExercise(v2)
    expect(migrated.folderId).toBeNull()
    expect(migrated.schemaVersion).toBe(3)
  })
})
