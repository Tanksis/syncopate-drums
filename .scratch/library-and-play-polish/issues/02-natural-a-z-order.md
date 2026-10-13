# 02: Natural A–Z order

**What to build:** Folders, the exercises in each folder and the exercises in no folder are listed by name, ignoring case, with numbers in order ("Syncopation 4" before "Syncopation 34"). See [spec](../spec.md) stories 6–7.

**Blocked by:** None (can start immediately)

**Status:** done (merged in PR #82, 2026-10-13)

- [x] Core: folders sort naturally (tested)
- [x] Core: exercises in a folder and loose exercises sort naturally, with or without filter text (tested)
- [x] Core: import still matches folder names exactly, ignoring case only (tested)
- [x] Checked in the browser at 1280 px

## Comments

- The folder picker for "Move the selected exercises to a folder" uses `foldersByName` too, so it lists folders in natural order as well.
- Names that sort as equals (such as "Page 01" and "Page 1", or two exercises with the same name) keep their order in the library. Nothing breaks the tie.
- The Examples tab keeps its own order, which stories 6–7 don't cover.
- The browser check ran headless at 1280 px: an import with folders Syncopation 34, syncopation 4 and Alpha listed them as Alpha, syncopation 4, Syncopation 34, with the exercises in each in number order, with and without filter text.
