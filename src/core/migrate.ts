// The migration chain: brings a stored exercise from any older schema version up to the
// current one. The database and import both go through it.

import type { Exercise } from './model'
import { SCHEMA_VERSION } from './model'

type Stored = Record<string, unknown>

/** Step n turns a version-n exercise into a version-(n + 1) one. Add a step with each schema bump. */
const steps: Record<number, (exercise: Stored) => Stored> = {
  // Version 0 is the shape from before exercises carried a schema version.
  0: (exercise) => ({ ...exercise, schemaVersion: 1 }),
}

/** The stored exercise in the current shape; throws for one from a newer version of the app. */
export function migrateExercise(stored: object): Exercise {
  let exercise = stored as Stored
  let version = typeof exercise.schemaVersion === 'number' ? exercise.schemaVersion : 0
  if (version > SCHEMA_VERSION) {
    throw new Error(`Exercise schema version ${version} is from a newer version of the app`)
  }
  for (; version < SCHEMA_VERSION; version++) exercise = steps[version](exercise)
  return exercise as unknown as Exercise
}
