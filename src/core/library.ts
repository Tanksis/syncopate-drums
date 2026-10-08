// Library rules: which exercise opens (at launch or after a delete), when the examples are added, list order, filter, duplicate and discard.

import type { DeviceSettings, Exercise } from './model'
import { newExercise } from './model'

/**
 * The exercise to open at launch: the one last open if it still exists, otherwise the most
 * recently opened. Null for an empty library, where a new Untitled exercise opens instead.
 */
export function exerciseToOpenAtLaunch<E extends Pick<Exercise, 'id' | 'lastOpened'>>(
  library: E[],
  lastOpenedId: string | null,
): E | null {
  return (
    library.find((e) => e.id === lastOpenedId) ??
    library.reduce<E | null>((latest, e) => (latest === null || e.lastOpened > latest.lastOpened ? e : latest), null)
  )
}

/**
 * Whether a launch adds the example exercises: only to an empty library, on a device that hasn't
 * had them. Once added they are never added again by themselves, so deleting them is final.
 */
export function addsExamplesAtLaunch(library: readonly Pick<Exercise, 'id'>[], device: Pick<DeviceSettings, 'examplesAdded'>): boolean {
  return library.length === 0 && !device.examplesAdded
}

/**
 * The exercise to have open after deleting some: the open one if it is kept, otherwise the most
 * recently opened one left. Null when none are left, where a new Untitled exercise opens instead,
 * so the screen is never empty.
 */
export function exerciseToOpenAfterDelete<E extends Pick<Exercise, 'id' | 'lastOpened'>>(
  library: E[],
  openId: string,
  deletedIds: string[],
): E | null {
  const deleted = new Set(deletedIds)
  return exerciseToOpenAtLaunch(library.filter((e) => !deleted.has(e.id)), openId)
}

/**
 * Whether an exercise is still exactly as New made it: one bar of rests, the default name and the
 * default settings. Such an exercise is discarded when the drummer leaves it.
 */
export function isUnchangedNew(exercise: Exercise): boolean {
  return sameValue(exercise, newExercise({ id: exercise.id, now: exercise.lastOpened }))
}

/** Deep equality of plain data, whatever order its keys were written in. */
function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  return (
    keysA.length === keysB.length &&
    keysA.every((key) => sameValue((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]))
  )
}

/** A copy under a new id, named "<name> (copy)", with the same content and practice settings. */
export function duplicateExercise(exercise: Exercise, { id, now }: { id: string; now: number }): Exercise {
  return { ...exercise, id, name: `${exercise.name} (copy)`, lastOpened: now }
}

/** The exercises whose name contains the filter text anywhere, ignoring case, in list order. */
export function filterByName<E extends Pick<Exercise, 'name'>>(list: E[], filter: string): E[] {
  const needle = filter.toLowerCase()
  return list.filter((e) => e.name.toLowerCase().includes(needle))
}

/**
 * The library list as the session starts: most recently opened first. The order then stays put
 * while the app is open (see `updatedInPlace`), except that new exercises go on top.
 */
export function launchListOrder<E extends Pick<Exercise, 'lastOpened'>>(library: E[]): E[] {
  return [...library].sort((a, b) => b.lastOpened - a.lastOpened)
}

/** The list with an exercise created this session on top. */
export function addedOnTop<E extends Pick<Exercise, 'id'>>(list: E[], exercise: E): E[] {
  return [exercise, ...list.filter((e) => e.id !== exercise.id)]
}

/** The list with an exercise's newer version in its old place, so the order doesn't jump. */
export function updatedInPlace<E extends Pick<Exercise, 'id'>>(list: E[], exercise: E): E[] {
  return list.map((e) => (e.id === exercise.id ? exercise : e))
}
