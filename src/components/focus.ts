/**
 * Whether the keyboard focus is on one of the app's controls (a button, field, slider, link or
 * menu item) rather than on the page, where the editor's keys and Space go.
 */
export const onControl = (target: EventTarget | null): target is HTMLElement =>
  target instanceof HTMLElement && target !== document.body && target.closest('input, textarea, select, button, a[href], [contenteditable], [tabindex]:not([tabindex="-1"])') !== null

/** Whether a focused control takes Space itself: all of them but a slider. */
export const usesSpace = (target: EventTarget | null) =>
  onControl(target) && !(target instanceof HTMLInputElement && target.type === 'range')
