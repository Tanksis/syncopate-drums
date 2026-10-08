# 03: Folders in the Library

**What to build:** User-made folders in the Library tab: create, rename (double-click), delete (exercises move to no folder), and collapse with a count. Exercises in no folder are listed below the folders. The filter searches inside folders. Stored exercises gain `folderId` (schema 3), and folders get their own store. See [spec](../spec.md) stories 12–15, 18–20.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] `SCHEMA_VERSION` 3: the migration step from 2 sets `folderId: null`. Tested
- [ ] Pure folder functions: create, rename (blank names ignored), and delete (its exercises' `folderId` becomes null, and none are deleted). Tested
- [ ] The library view function: folders by name, case-insensitive, each with its exercises in list order and a count, then the loose exercises. Collapsed folders hide their exercises. With filter text, folders without a match are hidden and those with one are expanded. Tested
- [ ] A new exercise goes into the open exercise's folder. Tested at the core seam
- [ ] `copyExample` and `duplicateExercise` take a `folderId`: a duplicate goes into its original's folder, and a copy of an example goes into no folder (an example has none). Tested
- [ ] IndexedDB version 2 adds a `folders` store. Device settings gain `collapsedFolderIds`
- [ ] Sidebar: a New folder button, folder rows with a chevron, name and count, double-click to rename, and a delete with a confirm that says the exercises are kept
- [ ] Checked in the browser with real mouse clicks; the existing library opens with every exercise in no folder
