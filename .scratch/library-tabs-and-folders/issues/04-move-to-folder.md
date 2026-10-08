# 04: Move exercises into folders

**What to build:** Drag an exercise onto a folder row, or onto a "No folder" drop zone, to move it. A Move to… menu moves the ticked exercises. See [spec](../spec.md) stories 16–17.

**Blocked by:** 03

**Status:** needs-triage

- [ ] `moveToFolder(library, ids, folderId | null)` gives the library with those exercises moved, in place in the list order. Tested, including moving to no folder
- [ ] Drag and drop: exercise rows are draggable, and folder rows and the "No folder" zone accept drops with the accent outline. A drop moves the exercise and stores it
- [ ] Move to… in the selection bar lists the folders, and No folder, and moves every ticked exercise
- [ ] Checked in the browser with real mouse drags (`page.mouse` down, move, up), not dispatched events
