# 01: Examples tab with built-in, read-only examples

**What to build:** The sidebar's Library and Examples tabs, with the examples built into the app instead of stored: fixed ids, never saved, notes and sticking locked, practice settings changeable but not kept. The first launch opens the first example. Examples stored by first-run-examples ticket 02 are removed if unchanged. See [spec](../spec.md) stories 1–8 and 11, and [ADR 0008](../../../docs/adr/0008-examples-are-built-in-and-read-only.md).

**Blocked by:** None (can start immediately)

**Status:** done (merged in PR #41, 2026-10-08)

- [x] `exampleExercises()` gives the four examples with fixed ids and `lastOpened` 0; `isExample(id)` recognises them. Tested: two calls give equal examples
- [x] A pure rule for which edit commands an example accepts (practice settings, cursor, selection, mode) and which it refuses (bars, sticking, lead hand, overrides, name). Tested for each kind
- [x] `leftoverExamples(stored)` finds stored exercises still exactly as ticket 02 added them. Tested: found under any id, not found once a bar or the name changed. Launch deletes them
- [x] Launch rule: the last-open example reopens, a fresh device (`lastOpenedId` null, empty library) opens the first example, and an emptied library opens Untitled. `examplesAdded` and `addsExamplesAtLaunch` are removed. Tested for all three
- [x] Device settings gain `libraryTab` (default `'library'`). Opening an example switches to Examples, and opening a stored exercise switches to Library. New and Import switch to Library
- [x] Autosave never stores an example. Its practice-setting changes are dropped when another exercise opens
- [x] A notice above the notation says the example is read-only. A refused edit highlights it briefly. Delete and Export are disabled for an example
- [x] Checked in the browser with real mouse clicks, on a fresh profile and on one holding ticket 02's stored examples (one of them changed)

## Comments

- 2026-10-08: Choices where the spec was silent:
  - Undo, redo and `.` are refused for an example, since it has no changes to go back over. They flash the notice like any other refused edit.
  - The notice says "Example: read-only. Its notes and sticking can't be changed, and tempo, loop, groove and swing changes aren't kept." Ticket 02 adds the Copy to Library button and the spec's wording.
  - Header: an example's name is plain text, so there's nothing to click to rename.
  - Sidebar: a dot marks the tab holding the open exercise (story 3), and an empty library says "No exercises yet."
  - If the last-open exercise was a leftover example deleted at launch, it counts as nothing open, so a device holding only ticket 02's unchanged examples opens the first built-in example.
  - The leftover check runs at every launch, not behind a once-only flag. It only ever deletes an exact copy of a built-in example, which might also come from an old import, and nothing is lost by that.
  - Import skips any exercise with an example's id.
  - Duplicate on an example still makes "Example: … (copy)" in the Library; ticket 02 turns it into Copy to Library.

