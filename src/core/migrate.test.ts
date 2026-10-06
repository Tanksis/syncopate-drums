import { describe, expect, it } from 'vitest'
import { SCHEMA_VERSION, migrateExercise, newExercise } from './index'

describe('the migration chain', () => {
  it('brings an exercise stored before schema versions existed up to the current shape', () => {
    const { schemaVersion: _, ...v0 } = newExercise({ id: 'e1', now: 5 })
    expect(migrateExercise(v0)).toEqual({ ...v0, schemaVersion: SCHEMA_VERSION })
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
