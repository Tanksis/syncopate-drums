// The cheat sheet's list of keys. Keep it in step with the core's key map (`commandForKey`).

export interface KeyHelpGroup {
  title: string
  keys: [keys: string, does: string][]
}

/** Every key the editor takes; notes are entered on the grid (ADR 0009). */
export const KEY_HELP: KeyHelpGroup[] = [
  {
    title: 'Move',
    keys: [
      ['← →', 'beat back / on'],
      ['↑ ↓  Ctrl+← →', 'bar back / on'],
      ['Home  End', 'start / end of the exercise'],
      ['Tab', 'snare row / kick row'],
    ],
  },
  {
    title: 'Edit',
    keys: [
      ['Backspace', 'rest, then step back'],
      ['Delete', 'rest in place'],
    ],
  },
  {
    title: 'Bars',
    keys: [
      ['Shift+← →', 'select bars'],
      ['Ctrl+C  Ctrl+V', 'copy / paste over from the cursor bar'],
      ['Ctrl+Enter', 'add a bar after'],
      ['Ctrl+D', 'duplicate the bar'],
      ['Ctrl+Backspace', 'delete the bar or selection'],
      ['Ctrl+Z  Ctrl+Shift+Z', 'undo / redo'],
    ],
  },
  {
    title: 'App',
    keys: [
      ['Space', 'pause / resume'],
      ['Ctrl+Space', 'play from the count-in / stop'],
      ['?', 'show / hide this sheet'],
    ],
  },
]
