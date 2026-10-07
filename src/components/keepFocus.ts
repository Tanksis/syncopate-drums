import type { MouseEvent } from 'react'

/**
 * A button's `onMouseDown` that keeps focus off it, so Space and Enter still go to the editor (Space
 * enters a rest) rather than clicking the button again.
 */
export const keepFocus = (e: MouseEvent) => e.preventDefault()
