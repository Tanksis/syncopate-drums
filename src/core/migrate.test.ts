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

  it('gives an exercise stored at version 3 the hi-hat foot off', () => {
    const { hihatFoot: _, ...practice } = newExercise({ id: 'e1', now: 5 }).practice
    const v3 = { ...newExercise({ id: 'e1', now: 5 }), schemaVersion: 3, practice }
    expect(migrateExercise(v3).practice.hihatFoot).toBe('off')
    expect(migrateExercise(v3).schemaVersion).toBe(SCHEMA_VERSION)
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

describe('version 5 to 6: groove presets become patterns and feet', () => {
  /** An exercise as stored at version 5, with a groove preset and a hi-hat foot setting. */
  const v5 = (groove: string, hihatFoot = 'off') => {
    const { pattern: _, bassDrum: __, ...practice } = newExercise({ id: 'e1', now: 5 }).practice
    return { ...newExercise({ id: 'e1', now: 5 }), schemaVersion: 5, practice: { ...practice, groove, hihatFoot } }
  }
  const feet = (stored: object) => {
    const { pattern, bassDrum, hihatFoot } = migrateExercise(stored).practice
    return { pattern, bassDrum, hihatFoot }
  }

  it('turns the jazz ride into Ride with the hi-hat foot on 2 & 4, so it sounds as it did', () => {
    expect(feet(v5('jazz'))).toEqual({ pattern: 'ride', bassDrum: 'off', hihatFoot: 'twoAndFour' })
    expect(migrateExercise(v5('jazz')).practice).not.toHaveProperty('groove')
  })

  it('turns the feathered jazz ride into Ride with the bass drum feathered', () => {
    expect(feet(v5('jazzFeathered'))).toEqual({ pattern: 'ride', bassDrum: 'feathered', hihatFoot: 'twoAndFour' })
  })

  it("keeps a hi-hat foot setting, which already played in place of the ride's own", () => {
    expect(feet(v5('jazz', 'quarters'))).toEqual({ pattern: 'ride', bassDrum: 'off', hihatFoot: 'quarters' })
  })

  it('keeps hi-hat eighths and no groove as they were, with the bass drum off', () => {
    expect(feet(v5('hihatEighths', 'one'))).toEqual({ pattern: 'hihatEighths', bassDrum: 'off', hihatFoot: 'one' })
    expect(feet(v5('off'))).toEqual({ pattern: 'off', bassDrum: 'off', hihatFoot: 'off' })
  })

  it('leaves an unknown groove for import to refuse', () => {
    expect(feet(v5('polka')).pattern).toBe('polka')
  })
})

describe('version 2 to 3: folders', () => {
  it('puts a version-2 exercise in no folder', () => {
    const { folderId: _, ...v2 } = { ...newExercise({ id: 'e1', now: 5 }), schemaVersion: 2 }
    const migrated = migrateExercise(v2)
    expect(migrated.folderId).toBeNull()
    expect(migrated.schemaVersion).toBe(SCHEMA_VERSION)
  })
})
