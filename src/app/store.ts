// App-wide state. The open exercise lives in memory only for now; autosave comes later.

import { create } from 'zustand'
import type { DeviceSettings, EditCommand, EditorState } from '@/core'
import { applyEdit, clampBpm, newEditorState, newExercise } from '@/core'

interface AppState {
  editor: EditorState
  device: DeviceSettings
  /** Transport: whether playback is running (or starting). */
  playing: boolean
  dispatch: (command: EditCommand) => void
  setBpm: (bpm: number) => void
  setPlaying: (playing: boolean) => void
}

export const useAppStore = create<AppState>()((set) => ({
  editor: newEditorState(newExercise({ id: crypto.randomUUID(), now: Date.now() })),
  device: { countIn: true },
  playing: false,
  dispatch: (command) => set((s) => ({ editor: applyEdit(s.editor, command) })),
  setBpm: (bpm) =>
    set(({ editor }) => {
      const { exercise } = editor
      return { editor: { ...editor, exercise: { ...exercise, practice: { ...exercise.practice, bpm: clampBpm(bpm) } } } }
    }),
  setPlaying: (playing) => set({ playing }),
}))
