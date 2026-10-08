# 04: Move exercises into folders

**What to build:** Drag an exercise onto a folder row, or onto a "No folder" drop zone, to move it. A Move to… menu moves the ticked exercises. See [spec](../spec.md) stories 16–17.

**Blocked by:** 03

**Status:** done (merged in PR #44, 2026-10-08)

- [x] `moveToFolder(library, ids, folderId | null)` gives the library with those exercises moved, in place in the list order. Tested, including moving to no folder
- [x] Drag and drop: exercise rows are draggable, and folder rows and the "No folder" zone accept drops with the accent outline. A drop moves the exercise and stores it
- [x] Move to… in the selection bar lists the folders, and No folder, and moves every ticked exercise
- [x] Checked in the browser with real mouse drags (`page.mouse` down, move, up), not dispatched events

## Comments

- 2026-10-08: Choices where the spec was silent:
  - `moveToFolder` returns `{ library, moved }`, as `deleteFolder` does, and `moved` holds only the exercises whose folder changed. `deleteFolder` is now built on it.
  - Dragging a ticked exercise brings the other ticked ones with it, as in a file manager. The selection is kept after a move.
  - The whole exercise row is draggable, not just its button: Firefox doesn't reliably start a drag from a `<button>`. The drop target is the whole folder, so its header and the exercises listed under it both take a drop.
  - "No folder" is a small heading above the loose exercises and their drop zone. It shows whenever a folder exists, even while filtering, so an exercise can still be dragged out.
  - The exercise button doesn't use `keepFocus`, because its mousedown `preventDefault` stops a drag starting. Its focus is let go after a mouse click and after a drag. The Move to… menu lets go of focus after a choice.
  - Moving into a collapsed folder leaves it collapsed; its count goes up.
