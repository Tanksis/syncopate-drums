// Library rules: which exercise opens (at launch or after a delete), leftover examples, list order, filter, duplicate and discard.

import type { Exercise } from './model'
import { newExercise } from './model'
import { exampleExercises } from './examples'

/**
 * The exercise to open at launch: the one last open if it still exists, an example among them,
 * otherwise the most recently opened. A fresh device (nothing ever open, an empty library) opens
 * the first example. Null for a library emptied since, where a new Untitled exercise opens instead.
 */
export function exerciseToOpenAtLaunch<E extends Pick<Exercise, 'id' | 'lastOpened'>>(
  library: E[],
  lastOpenedId: string | null,
): E | Exercise | null {
  const examples = exampleExercises()
  const example = examples.find((e) => e.id === lastOpenedId)
  if (example) return example
  if (library.length === 0 && lastOpenedId === null) return examples[0]
  return lastOpenOrLatest(library, lastOpenedId)
}

/** The exercise with that id, otherwise the most recently opened one; null for an empty list. */
function lastOpenOrLatest<E extends Pick<Exercise, 'id' | 'lastOpened'>>(library: E[], id: string | null): E | null {
  return (
    library.find((e) => e.id === id) ??
    library.reduce<E | null>((latest, e) => (latest === null || e.lastOpened > latest.lastOpened ? e : latest), null)
  )
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
  return lastOpenOrLatest(library.filter((e) => !deleted.has(e.id)), openId)
}

/**
 * Whether an exercise is still exactly as New made it: one bar of rests, the default name and the
 * default settings. Such an exercise is discarded when the drummer leaves it.
 */
export function isUnchangedNew(exercise: Exercise): boolean {
  return sameValue(exercise, newExercise({ id: exercise.id, now: exercise.lastOpened }))
}

/**
 * The stored exercises that are still exactly an example as the first-run-examples build added it
 * to the library (same name, bars, sticking, lead hand and practice settings, under any id), in
 * list order. The built-in examples replace them, so launch deletes them; one the drummer changed
 * is theirs and stays (ADR 0008).
 */
export function leftoverExamples(stored: readonly Exercise[]): string[] {
  const content = ({ name, bars, sticking, leadHand, practice }: Exercise) => ({ name, bars, sticking, leadHand, practice })
  const examples = exampleExercises().map(content)
  return stored.filter((e) => examples.some((example) => sameValue(content(e), example))).map((e) => e.id)
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
