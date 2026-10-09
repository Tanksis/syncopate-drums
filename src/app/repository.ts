// Persistence: exercises, folders and device settings in IndexedDB. Only the app store calls this.

import type { DBSchema, IDBPDatabase } from 'idb'
import { openDB } from 'idb'
import type { DeviceSettings, Exercise, Folder } from '@/core'
import { SCHEMA_VERSION, deviceSettingsFrom, migrateExercise } from '@/core'

export interface ExerciseRepository {
  list(): Promise<Exercise[]>
  get(id: string): Promise<Exercise | undefined>
  put(exercise: Exercise): Promise<void>
  putMany(exercises: Exercise[]): Promise<void>
  deleteMany(ids: string[]): Promise<void>
}

export interface FolderRepository {
  list(): Promise<Folder[]>
  put(folder: Folder): Promise<void>
  delete(id: string): Promise<void>
}

export interface DeviceSettingsStore {
  load(): Promise<DeviceSettings>
  save(settings: DeviceSettings): Promise<void>
}

export interface AppStorage {
  exercises: ExerciseRepository
  folders: FolderRepository
  device: DeviceSettingsStore
}

interface Schema extends DBSchema {
  exercises: { key: string; value: Exercise }
  // Added in database version 2.
  folders: { key: string; value: Folder }
  // One record, under the key 'device'. Partial: settings added later fall back to their defaults.
  settings: { key: 'device'; value: Partial<DeviceSettings> }
}

type Db = IDBPDatabase<Schema>

/**
 * Opens the database, bringing any exercise stored by an older app version up to date. One from a
 * newer version (an older cached copy of the app) is left alone and kept out of the library, so
 * this version never overwrites it.
 */
export async function openStorage(): Promise<AppStorage> {
  const db = await openDB<Schema>('syncopate', 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('exercises', { keyPath: 'id' })
        db.createObjectStore('settings')
      }
      if (oldVersion < 2) db.createObjectStore('folders', { keyPath: 'id' })
    },
  })
  await migrateStored(db)
  return { exercises: exerciseRepository(db), folders: folderRepository(db), device: deviceSettingsStore(db) }
}

async function migrateStored(db: Db) {
  const tx = db.transaction('exercises', 'readwrite')
  for (const stored of await tx.store.getAll()) {
    if (!isNewer(stored) && stored.schemaVersion !== SCHEMA_VERSION) await tx.store.put(migrateExercise(stored))
  }
  await tx.done
}

const isNewer = (exercise: Exercise) => exercise.schemaVersion > SCHEMA_VERSION

function exerciseRepository(db: Db): ExerciseRepository {
  return {
    list: async () => (await db.getAll('exercises')).filter((e) => !isNewer(e)),
    get: async (id) => {
      const exercise = await db.get('exercises', id)
      return exercise && !isNewer(exercise) ? exercise : undefined
    },
    put: async (exercise) => {
      await db.put('exercises', exercise)
    },
    putMany: async (exercises) => {
      const tx = db.transaction('exercises', 'readwrite')
      await Promise.all([...exercises.map((e) => tx.store.put(e)), tx.done])
    },
    deleteMany: async (ids) => {
      const tx = db.transaction('exercises', 'readwrite')
      await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done])
    },
  }
}

function folderRepository(db: Db): FolderRepository {
  return {
    list: () => db.getAll('folders'),
    put: async (folder) => {
      await db.put('folders', folder)
    },
    delete: (id) => db.delete('folders', id),
  }
}

function deviceSettingsStore(db: Db): DeviceSettingsStore {
  return {
    load: async () => deviceSettingsFrom(await db.get('settings', 'device')),
    save: async (settings) => {
      await db.put('settings', settings, 'device')
    },
  }
}
