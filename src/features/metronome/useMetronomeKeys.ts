import { useEffect } from 'react'
import { useAppStore } from '@/app/store'
import { usesSpace } from '@/components/focus'
import type { KeyHelpGroup } from '@/features/editor/keyHelp'
import { toggleMetronome } from '@/features/playback/transport'

/** The keys below, for the Help page. Keep it in step with `useMetronomeKeys`. */
export const METRONOME_KEY_HELP: KeyHelpGroup = {
  title: 'Metronome',
  keys: [
    ['Space', 'start / stop'],
    ['-  +  ← → ↑ ↓', 'BPM down / up, held to repeat'],
    ['T', 'tap the tempo'],
  ],
}

/** The keys that change the BPM, and by how much. */
const BPM_KEYS: Record<string, number> = { '-': -1, _: -1, '+': 1, '=': 1, ArrowDown: -1, ArrowLeft: -1, ArrowUp: 1, ArrowRight: 1 }

/** A field that's typed into, where − + and T are text, or an open menu, where a letter picks an item. */
const TYPED = 'input:not([type=range]), textarea, select, [contenteditable], [role=menu]'

/** A control that takes the arrow keys itself: a field, a slider, tabs, a radio group or a menu. */
const TAKES_ARROWS = `${TYPED}, input, [role=slider], [role=tablist], [role=radiogroup], [role=menu]`

/**
 * The desktop Metronome page's keys: Space (or Ctrl+Space) plays and stops it, − and + and the
 * arrow keys change the BPM, held to repeat, and T taps the tempo (`tap`). Space is left to a
 * focused control that takes it and to an open dialog, as the exercise's Space is; the others to a
 * field being typed in or a menu, and the arrows to a control that moves with them. Only the
 * Metronome page mounts it, and the exercise's keys (`usePlaybackKeys`) aren't mounted there.
 */
export function useMetronomeKeys(tap: () => void) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.metaKey) return
      const target = e.target instanceof Element ? e.target : null
      if (e.code === 'Space') {
        if (e.shiftKey) return
        // The dial, focused by a drag, takes no Space of its own.
        if (!e.ctrlKey && ((usesSpace(e.target) && !target?.closest('[role=slider]')) || document.querySelector('dialog[open]'))) return
        e.preventDefault()
        if (!e.repeat) toggleMetronome()
        return
      }
      if (e.ctrlKey || target?.closest(TYPED) || document.querySelector('dialog[open]')) return
      if (e.key === 't' || e.key === 'T') {
        if (e.shiftKey) return
        e.preventDefault()
        if (!e.repeat) tap()
        return
      }
      const by = BPM_KEYS[e.key]
      if (by === undefined || (e.key.startsWith('Arrow') && (e.shiftKey || target?.closest(TAKES_ARROWS)))) return
      e.preventDefault()
      const { device, setMetronome } = useAppStore.getState()
      // Held, it repeats and saves once let go, as a held − or + button does.
      setMetronome({ bpm: device.metronome.bpm + by }, { dragging: e.repeat })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [tap])
}
