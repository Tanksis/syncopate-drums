import type { DragEvent } from 'react'
import { useRef, useState } from 'react'

/** The drag data type of an exercise being dragged to a folder; its value is the exercise's id. */
const EXERCISE_DRAG_TYPE = 'application/x-syncopate-exercise'

const isExerciseDrag = (event: DragEvent) => event.dataTransfer.types.includes(EXERCISE_DRAG_TYPE)

/**
 * Dragging exercises onto folders. `dragProps` makes an exercise's row draggable, and
 * `dropProps(folderId)` makes an element a drop target for the folder (`null` for no folder), which
 * calls `onDrop` with the dragged exercise's id. `dropTarget` is the folder being dragged over, to
 * outline it: a folder id, `null` for no folder, or `undefined` while there's none.
 */
export function useExerciseDrop(onDrop: (exerciseId: string, folderId: string | null) => void) {
  const [dropTarget, setDropTarget] = useState<string | null | undefined>(undefined)
  /**
   * How many of each drop target's elements the drag is in: dragenter on a child comes before
   * dragleave on the one it left, and a drag has left a target only when its count is back to 0.
   */
  const depth = useRef(new Map<string | null, number>())
  const endDrag = () => {
    depth.current.clear()
    setDropTarget(undefined)
  }

  const dragProps = (exerciseId: string) => ({
    onDragStart: (event: DragEvent) => {
      event.dataTransfer.setData(EXERCISE_DRAG_TYPE, exerciseId)
      event.dataTransfer.effectAllowed = 'move'
    },
    onDragEnd: (event: DragEvent<HTMLElement>) => {
      endDrag()
      // The mousedown that began the drag focused the exercise's button, and no click came to let
      // it go; Space and Enter belong to the editor.
      if (document.activeElement instanceof HTMLElement && event.currentTarget.contains(document.activeElement)) {
        document.activeElement.blur()
      }
    },
  })

  const dropProps = (folderId: string | null) => ({
    onDragEnter: (event: DragEvent) => {
      if (!isExerciseDrag(event)) return
      depth.current.set(folderId, (depth.current.get(folderId) ?? 0) + 1)
      setDropTarget(folderId)
    },
    onDragOver: (event: DragEvent) => {
      if (!isExerciseDrag(event)) return
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
    },
    onDragLeave: (event: DragEvent) => {
      if (!isExerciseDrag(event)) return
      const left = (depth.current.get(folderId) ?? 1) - 1
      depth.current.set(folderId, left)
      if (left === 0) setDropTarget((target) => (target === folderId ? undefined : target))
    },
    onDrop: (event: DragEvent) => {
      event.preventDefault()
      endDrag()
      const id = event.dataTransfer.getData(EXERCISE_DRAG_TYPE)
      if (id) onDrop(id, folderId)
    },
  })

  return { dropTarget, dragProps, dropProps }
}
