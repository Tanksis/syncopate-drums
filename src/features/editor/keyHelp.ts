// The cheat sheet's lists of keys, one per mode. Keep them in step with the core's key map (`commandForKey`).

import type { EditorMode } from '@/core'

export interface KeyHelpGroup {
  title: string
  keys: [keys: string, does: string][]
}

/** The keys that work in both modes. */
const SHARED: KeyHelpGroup[] = [
  {
    title: 'Move',
    keys: [
      ['← →', 'beat back / on'],
      ['↑ ↓  Ctrl+← →', 'bar back / on'],
      ['Home  End', 'start / end of the exercise'],
    ],
  },
  {
    title: 'Edit',
    keys: [
      ['Backspace', 'rest, then step back'],
      ['Delete', 'rest in place'],
      ['Alt+1–4', 'flip the sticking of note 1–4 of the beat'],
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
      ['Ctrl+Space', 'play / stop'],
      ['?', 'show / hide this sheet'],
    ],
  },
]

function insertKeys(vimKeys: boolean): KeyHelpGroup {
  return {
    title: 'Insert',
    keys: [
      ['1–0  Z X C V B', 'enter a figure (sixteenths)'],
      ['A S D F G H', 'enter a figure (triplets)'],
      ['Space', 'enter a rest'],
      ['T', 'tie into the beat'],
      ['.', 'cut the beat’s last note short'],
      ...(vimKeys ? [['Esc', 'Normal mode'] as [string, string]] : []),
    ],
  }
}

const NORMAL: KeyHelpGroup[] = [
  {
    title: 'Normal: move (a beat is a character, a bar a word)',
    keys: [
      ['h l', 'beat back / on'],
      ['w b', 'next bar / start of the bar'],
      ['0 $', 'first / last beat of the bar'],
      ['gg G', 'start / end; with a count, that bar'],
    ],
  },
  {
    title: 'Normal: edit',
    keys: [
      ['i a', 'Insert mode on / after the beat'],
      ['x', 'rest the beat'],
      ['r + figure key', 'replace the beat'],
      ['dd yy', 'delete / yank the bar'],
      ['p P', 'put the yanked bars after / before'],
      ['o O', 'open a bar below / above'],
      ['u  Ctrl+R', 'undo / redo'],
      ['.', 'repeat the last change'],
      ['3p  2dd …', 'a count repeats the command'],
    ],
  },
  {
    title: 'Normal: select bars',
    keys: [
      ['V', 'select the bar; moves extend it'],
      ['y d p', 'yank / delete / replace the selection'],
      ['Esc', 'end the selection'],
    ],
  },
]

export function keyHelp(mode: EditorMode, vimKeys: boolean): KeyHelpGroup[] {
  return mode === 'normal' && vimKeys ? [...NORMAL, ...SHARED] : [insertKeys(vimKeys), ...SHARED]
}
