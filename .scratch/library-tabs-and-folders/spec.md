# Spec: Library tabs, folders, and built-in examples

Status: ready-for-agent

Source: the user's review after [ticket 02 of first-run-examples](../first-run-examples/issues/02-examples-on-first-launch.md) (2026-10-08). The four examples were stored as ordinary exercises at the top of the one exercise list, and they bloat it. The user asked for a separate Examples tab and some way to keep the sidebar organised, "similar to other apps' sidebars". Decisions from that conversation: Library and Examples tabs, user-made folders in Library, and examples built in and read-only, copied to edit. See [ADR 0008](../../docs/adr/0008-examples-are-built-in-and-read-only.md). Vocabulary follows [`CONTEXT.md`](../../CONTEXT.md).

## Problem Statement

Since ticket 02, my library opens with four "Example: …" exercises mixed in with my own. They push my lines down, I can delete them by accident (for good), and with dozens of book lines the list is one long flat column. There's no way to group a page of the book, my warm-ups, or the examples apart from everything else.

## Solution

The sidebar gets two tabs, **Library** and **Examples**.

- **Examples** lists the example exercises. They're built into the app, not stored: always there, never cluttering the Library, and impossible to delete. I can open one, play it, and change its tempo, loop, groove and swing to try it out, but those changes aren't kept. Its notes and sticking can't be edited. A notice says so and offers **Copy to Library**, which makes an ordinary exercise from it and opens that.
- **Library** holds my own exercises. I can make **folders** (one level, no folders in folders), name them, collapse them, and move exercises into and out of them. Exercises not in a folder sit below the folders.

The first launch on a device opens the first example in the Examples tab, as ticket 02 did, but nothing is added to the Library.

## User Stories

### Tabs

1. As a drummer, I want the sidebar to have a Library tab and an Examples tab, so that the examples don't crowd my own exercises.
2. As a drummer, I want the sidebar to remember which tab I had open, so that it's the same when I come back.
3. As a drummer, I want the tab showing the open exercise to be obvious, so that I know whether I'm in an example or my own line.
4. As a drummer, I want New and Import to put the exercise in my Library and switch to that tab, so that I see what I just made.

### Examples

5. As a first-time user, I want the app to open on the first example, in the Examples tab, so that the first screen shows notation, sticking and the beat cards filled in.
6. As a drummer, I want the examples always available, so that deleting things in my Library can never lose them.
7. As a drummer, I want to change an example's BPM, loop, groove and swing while I try it, so that I can hear it slower or swung, without those changes being kept.
8. As a drummer, I want an example's notes and sticking locked, with a notice saying so, so that I don't think my edits are being ignored.
9. As a drummer, I want a Copy to Library button on an example, so that I can make my own editable version and keep practising it.
10. As a drummer, I want Duplicate on an example to do the same as Copy to Library, so that the usual command works.
11. As a drummer who opened the app after ticket 02 shipped, I want the examples it stored in my Library removed if I never changed them, so that I don't see them twice; one I changed stays as my own exercise.

### Folders

12. As a drummer, I want to make a folder in my Library and name it (for example "Syncopation p.38"), so that I can group the lines of one book page.
13. As a drummer, I want to rename a folder by double-clicking it, as I rename an exercise, so that it works the same way.
14. As a drummer, I want to collapse and expand a folder, and have it remembered on this device, so that the list stays short.
15. As a drummer, I want to see how many exercises a collapsed folder holds, so that I know what's in it without opening it.
16. As a drummer, I want to drag an exercise onto a folder, or out of it, so that I can file it the way other apps do.
17. As a drummer, I want to move the ticked exercises to a folder with a Move to… menu, so that I can file many at once, and without a mouse drag.
18. As a drummer, I want to delete a folder and have its exercises move to the top level, not be deleted, so that removing a folder never loses work.
19. As a drummer, I want the filter to search inside every folder and open the folders that have matches, so that I can still find any exercise by name.
20. As a drummer, I want a new exercise made while the open one is in a folder to go into that folder, so that I keep working on the same page.
21. As a drummer, I want an exported exercise to keep its folder name, and importing it to file it in a folder of that name (made if missing), so that my organisation moves between computers.

## Implementation Decisions

### Exercise core (the test seam)

- **Examples.** `exampleExercises()` takes no id factory: each example has a fixed id (`example:syncopated-eighths`, …) and `lastOpened` 0, so the app can tell an example from a stored exercise and reopen it at launch. `isExample(id)` says which ids are examples. The four lines stay as ticket 02 left them.
- **Copy to Library.** `copyExample(example, { id, now, folderId })` gives an ordinary exercise: a new id, the same notes, sticking and practice settings as they are now (so a slowed tempo carries over), and the name without the "Example: " prefix.
- **Read-only.** A pure rule says which edit commands an example accepts: practice settings (BPM, loop range, groove, swing) and cursor, selection and mode commands, but no command that changes the bars, sticking, lead hand, overrides or name.
- **Leftover examples.** `leftoverExamples(stored)` returns the ids of stored exercises that are still exactly an example as ticket 02 added it (same name, bars, sticking, lead hand and practice settings; any id and last-opened time). Launch deletes them once.
- **Folders.** A folder is `{ id, name }`. An exercise gains `folderId: string | null`. `SCHEMA_VERSION` goes to 3; the migration step from 2 sets `folderId: null`. Folders are one level deep. Pure functions cover creating, renaming, deleting (its exercises' `folderId` becomes null) and moving exercises (`moveToFolder(ids, folderId | null)`).
- **Library view.** A pure function turns the library, the folders, the filter text and the collapsed folder ids into the rows the sidebar shows: the folders by name (case-insensitive), each with its exercises in list order and a count, then the exercises in no folder. With filter text, folders without a match are hidden and folders with one show expanded, collapsed or not.
- **Launch.** `exerciseToOpenAtLaunch` may return an example when `lastOpenedId` is an example id. On a device whose `lastOpenedId` is null and whose library is empty, it returns the first example. Otherwise, with an empty library, a new Untitled exercise opens, as before ticket 02. `examplesAdded` and `addsExamplesAtLaunch` are removed. A stored `examplesAdded` is ignored.
- **Device settings.** New: `libraryTab: 'library' | 'examples'` (default `'library'`) and `collapsedFolderIds: string[]` (default `[]`). Opening an example switches the tab to Examples, and opening a stored exercise switches it to Library.
- **Export and import.** The export file carries the folders of the exported exercises. On import, an exercise's folder is matched by name (ignoring case) to an existing folder, or created. A v2 file imports with every exercise outside a folder.

### App

- **Storage.** The IndexedDB database goes to version 2 with a `folders` object store. Examples are never written to storage: autosave skips them, and practice-setting changes to an open example live only in memory until another exercise opens.
- **Sidebar.** There's a tab bar under the "Exercises" heading. Library shows New, New folder, Duplicate, Delete, Import, Export all, the filter, and the folder tree. Examples shows its list, and the open example's Copy to Library. Delete and Export are disabled for an example.
- **Example notice.** With an example open, a notice above the notation says "Example: read-only. Copy to Library to edit it." with the button. A locked edit (a click on a cell, a figure key) gives the notice a short highlight, so the drummer can see why nothing changed.
- **Drag and drop.** HTML drag and drop on the exercise buttons. Folder rows and a "No folder" drop zone accept drops. While dragging, a drop target shows the accent outline.
- **First-run-examples ticket 03** (the Add examples button) is dropped: built-in examples make it unnecessary.

## Testing Decisions

- **One seam: the exercise core's public interface**, as before. For example:
  - "every example has a fixed id that `isExample` recognises, and two calls give equal examples";
  - "a copy of an example has a new id, no 'Example: ' prefix, the example's current BPM, and is not an example";
  - "an example accepts a BPM change and a cursor move but refuses a figure key, a hit toggle, a sticking change and a rename";
  - "`leftoverExamples` finds an unchanged stored example under any id, but not one with a changed bar or name";
  - "a v2 exercise migrates to v3 with `folderId` null";
  - "deleting a folder moves its exercises to no folder, and keeps them";
  - "the library view lists folders by name with counts, then the loose exercises; a filter hides folders without a match and expands those with one";
  - "launch opens the first example on a fresh device, the last-open example when `lastOpenedId` is one, and Untitled on a device that emptied its library";
  - "an export with folders imports into a library that has a folder of the same name, differently cased, without making a second one".
- **Not tested automatically:** the tab bar, the notice, drag and drop and the Move to… menu. These are checked in the browser with real mouse events (drag and drop included), on a fresh profile and on one holding ticket 02's stored examples.

## Out of Scope

- Folders inside folders, and sorting options (by name or date) for the list.
- Colours, icons or emoji on folders.
- More examples, or examples grouped by topic.
- A "Recent" or "Pinned" section.
- Reordering exercises by hand within a folder: the list order stays as it is (most recently opened at launch, new on top).
- Syncing the library between devices.

## Further Notes

- This reverses the first-run-examples spec's "examples are ordinary exercises" and its out-of-scope "marking examples as read-only, or as a separate kind of exercise". ADR 0008 records why.
- The "Example: " prefix stays on the built-in examples' names, so that a copy is easy to tell from its source in the title bar.
