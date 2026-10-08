# 03: Folders in the Library

**What to build:** User-made folders in the Library tab: create, rename (double-click), delete (exercises move to no folder), and collapse with a count. Exercises in no folder are listed below the folders. The filter searches inside folders. Stored exercises gain `folderId` (schema 3), and folders get their own store. See [spec](../spec.md) stories 12–15, 18–20.

**Blocked by:** 01

**Status:** done (merged in PR #43, 2026-10-08)

- [x] `SCHEMA_VERSION` 3: the migration step from 2 sets `folderId: null`. Tested
- [x] Pure folder functions: create, rename (blank names ignored), and delete (its exercises' `folderId` becomes null, and none are deleted). Tested
- [x] The library view function: folders by name, case-insensitive, each with its exercises in list order and a count, then the loose exercises. Collapsed folders hide their exercises. With filter text, folders without a match are hidden and those with one are expanded. Tested
- [x] A new exercise goes into the open exercise's folder. Tested at the core seam
- [x] `copyExample` and `duplicateExercise` take a `folderId`: a duplicate goes into its original's folder, and a copy of an example goes into no folder (an example has none). Tested
- [x] IndexedDB version 2 adds a `folders` store. Device settings gain `collapsedFolderIds`
- [x] Sidebar: a New folder button, folder rows with a chevron, name and count, double-click to rename, and a delete with a confirm that says the exercises are kept
- [x] Checked in the browser with real mouse clicks; the existing library opens with every exercise in no folder

## Comments

- 2026-10-08: Choices where the spec was silent:
  - `duplicateExercise` keeps `{ id, now }`: a duplicate takes its original's `folderId`, and an example's copy goes into no folder, so it needs no folder argument. `copyExample` takes `folderId`.
  - New folder sits beside the filter. It clears the filter and starts the rename at once. A blank name gives "New folder", and two folders may share a name.
  - Only the chevron collapses a folder; the name is for double-click renaming. The chevron is disabled while filtering, since the filter keeps folders with a match open.
  - New into a collapsed folder expands it, so the new exercise shows.
  - The folder's × shows on hover. Its confirm says how many exercises are kept.
  - Until ticket 05, an imported exercise keeps its `folderId` only when this library has that folder (by id); otherwise it goes into no folder. Exports already say version 3 and carry raw `folderId`s, without folder names. Ticket 05 should match by name and accept a v3 file with no folders block.
  - For ticket 04: an unchanged New exercise counts as unchanged in any folder, so moving one doesn't stop it being discarded when the drummer leaves it.
