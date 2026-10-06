# Exercise library

Type: grilling
Status: resolved
Blocked by: 03, 08

## Question

How are saved exercises listed, named and organised, and what does a new exercise start as?

- What identifies an exercise to the user: a free-text name, or structured source fields (book, page, line number) with a name derived from them? Are names unique?
- How the list is organised and found: flat list, grouped by book, tags, search, sort order (recently practised?).
- Creating, duplicating, renaming and deleting exercises (confirm or undo on delete?).
- What a new exercise starts as: how many bars, filled with rests or quarter notes, default voice and sticking mode.
- How export selection works against the list (pick several, export all), and whether import should also match by name now that names are defined (see [Export and import](08-export-and-import.md)).
- Where the list lives on screen is left to screen layout; this ticket settles behaviour and naming.

## Answer

Settled in a grilling session (2026-10-05). Terms are in `CONTEXT.md` (Exercise, Exercise library).

- **Naming**: an exercise has a free-text name (e.g. "Syncopation p.37 #4"). Names need not be unique; the id is the identity. No structured book/page/line fields.
- **Saving**: autosave on every change, including practice settings. No Save button, no unsaved state. Mistakes are covered by the editor's undo ([Beat figure palette](07-beat-figure-palette.md)).
- **New exercise**: one bar of rests, which grows when a figure is entered past the last beat; snare, natural sticking, lead R, 80 BPM, groove off, swing 66.7%; named "Untitled", renamable any time. Fixed defaults, not copied from the last exercise.
- **Discarding blanks**: a new exercise that was never changed (still one bar of rests, default name and settings) is discarded when the user leaves it.
- **Duplicate**: copies content + practice settings under "<name> (copy)" with a new id.
- **Rename**: inline, any time.
- **Delete**: behind a confirm dialog ("can't be undone"); works on one exercise or the current selection (one dialog showing the count).
- **List**: one flat list sorted by last opened, with a filter box matching any part of the name. No tags or groups.
- **Selection and export**: checkboxes in the list; "Export selected", "Export all" (one click), "Delete selected".
- **Import matching**: by id only, never by name. "Keep both" keeps the name unchanged.
- **Export file name**: a single exercise uses its name (characters that aren't allowed in file names removed) + `.json`; several use `drum-exercises-YYYY-MM-DD.json`.
- **Launch**: opens the last opened exercise; with an empty library, opens a new Untitled exercise straight away. (Derived: deleting the open exercise opens the next most recent, or a new Untitled one if none remain.)
- Where the list, filter and actions sit on screen is left to screen layout.

## Comments
- 2026-10-06: Amended by [Screen layout](10-screen-layout.md): list order is last opened as of launch and stays stable while the app is open; new exercises go on top.
