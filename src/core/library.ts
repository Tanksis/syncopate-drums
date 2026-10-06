// Library rules: which exercise opens, and later the list order, filter, duplicate and discard.

import type { Exercise } from './model'

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
