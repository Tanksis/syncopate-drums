// App-wide state. The open exercise lives in memory only for now; autosave comes later.

import { create } from 'zustand'
import type { EditCommand, EditorState } from '@/core'
import { applyEdit, newEditorState, newExercise } from '@/core'

interface AppState {
  editor: EditorState
  dispatch: (command: EditCommand) => void
}

export const useAppStore = create<AppState>()((set) => ({
  editor: newEditorState(newExercise({ id: crypto.randomUUID(), now: Date.now() })),
  dispatch: (command) => set((s) => ({ editor: applyEdit(s.editor, command) })),
}))
