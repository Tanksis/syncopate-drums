// The migration chain: brings a stored exercise from any older schema version up to the
// current one. The database and import both go through it.

import type { Exercise } from './model'
import { SCHEMA_VERSION, restItems } from './model'

type Stored = Record<string, unknown>

/** Step n turns a version-n exercise into a version-(n + 1) one. Add a step with each schema bump. */
const steps: Record<number, (exercise: Stored) => Stored> = {
  // Version 0 is the shape from before exercises carried a schema version.
  0: (exercise) => ({ ...exercise, schemaVersion: 1 }),
  // Version 1 was one rhythm on one drum, its voice. A snare exercise becomes the snare row over a
  // resting kick row; a bass drum exercise becomes the kick row, which has no sticking, under a
  // resting snare row (ADR 0005).
  1: ({ voice, ...exercise }) => {
    const bass = voice === 'bass'
    const bars = Array.isArray(exercise.bars)
      ? exercise.bars.map((bar: unknown) => {
          // A malformed bar is left for import to refuse.
          if (typeof bar !== 'object' || bar === null || !Array.isArray((bar as Stored).items)) return bar
          const items = (bar as { items: Stored[] }).items
          return bass
            ? { snare: restItems(), kick: items.map(({ override: _, ...item }) => item) }
            : { snare: items, kick: restItems() }
        })
      : exercise.bars
    return { ...exercise, bars, schemaVersion: 2 }
  },
  // Version 2 had no folders: every exercise starts outside one.
  2: (exercise) => ({ ...exercise, folderId: null, schemaVersion: 3 }),
  // Version 3 had no hi-hat foot setting: it starts off. A missing practice is left for import to refuse.
  3: ({ practice, ...exercise }) => ({
    ...exercise,
    practice: typeof practice === 'object' && practice !== null ? { ...practice, hihatFoot: 'off' } : practice,
    schemaVersion: 4,
  }),
  // Version 4 was always in 4/4.
  4: (exercise) => ({ ...exercise, timeSignature: '4/4', schemaVersion: 5 }),
  // Version 5 had groove presets, whose jazz ride played the hi-hat foot on 2 & 4 and, feathered,
  // the bass drum on every beat. They became the Ride pattern with the same feet set, so the
  // exercise sounds as it did (a hi-hat foot setting other than off already replaced the ride's,
  // ADR 0010). Hi-hat eighths and off keep their ids.
  // A practice with no groove is left for import to refuse.
  5: ({ practice, ...exercise }) => {
    if (typeof practice !== 'object' || practice === null || !('groove' in practice)) return { ...exercise, practice, schemaVersion: 6 }
    const { groove, ...rest } = practice as Stored
    const jazz = groove === 'jazz' || groove === 'jazzFeathered'
    return {
      ...exercise,
      practice: {
        ...rest,
        pattern: jazz ? 'ride' : groove,
        bassDrum: groove === 'jazzFeathered' ? 'feathered' : 'off',
        hihatFoot: jazz && rest.hihatFoot === 'off' ? 'twoAndFour' : rest.hihatFoot,
      },
      schemaVersion: 6,
    }
  },
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
