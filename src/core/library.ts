// Library rules: which exercise opens, and later the list order, filter, duplicate and discard.

import type { Exercise } from './model'

/**
 * The id of the exercise to open at launch: the one last open if it still exists, otherwise the
 * most recently opened. Null for an empty library, where a new Untitled exercise opens instead.
 */
export function exerciseToOpenAtLaunch(
  library: Pick<Exercise, 'id' | 'lastOpened'>[],
  lastOpenedId: string | null,
): string | null {
  if (library.some((e) => e.id === lastOpenedId)) return lastOpenedId
  const latest = library.reduce<(typeof library)[number] | null>(
    (best, e) => (best === null || e.lastOpened > best.lastOpened ? e : best),
    null,
  )
  return latest?.id ?? null
}
