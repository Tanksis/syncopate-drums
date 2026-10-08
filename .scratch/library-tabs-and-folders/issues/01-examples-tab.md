# 01: Examples tab with built-in, read-only examples

**What to build:** The sidebar's Library and Examples tabs, with the examples built into the app instead of stored: fixed ids, never saved, notes and sticking locked, practice settings changeable but not kept. The first launch opens the first example. Examples stored by first-run-examples ticket 02 are removed if unchanged. See [spec](../spec.md) stories 1–8 and 11, and [ADR 0008](../../../docs/adr/0008-examples-are-built-in-and-read-only.md).

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `exampleExercises()` gives the four examples with fixed ids and `lastOpened` 0; `isExample(id)` recognises them. Tested: two calls give equal examples
- [ ] A pure rule for which edit commands an example accepts (practice settings, cursor, selection, mode) and which it refuses (bars, sticking, lead hand, overrides, name). Tested for each kind
- [ ] `leftoverExamples(stored)` finds stored exercises still exactly as ticket 02 added them. Tested: found under any id, not found once a bar or the name changed. Launch deletes them
- [ ] Launch rule: the last-open example reopens, a fresh device (`lastOpenedId` null, empty library) opens the first example, and an emptied library opens Untitled. `examplesAdded` and `addsExamplesAtLaunch` are removed. Tested for all three
- [ ] Device settings gain `libraryTab` (default `'library'`). Opening an example switches to Examples, and opening a stored exercise switches to Library. New and Import switch to Library
- [ ] Autosave never stores an example. Its practice-setting changes are dropped when another exercise opens
- [ ] A notice above the notation says the example is read-only. A refused edit highlights it briefly. Delete and Export are disabled for an example
- [ ] Checked in the browser with real mouse clicks, on a fresh profile and on one holding ticket 02's stored examples (one of them changed)
