# Export and import

Type: grilling
Status: resolved
Blocked by: 03, 06

## Question

How does the user move exercises between devices (or back them up) as files?

- What one file holds: a single exercise, a chosen set, or the whole library.
- What goes in: the exercise only, or its remembered practice settings too. Global settings (volumes, count-in)?
- The file shape: JSON of the stored model plus a format/schema version. How an older file is migrated on import.
- Importing an exercise that already exists (same id, or same name): duplicate, replace, or ask.
- Where the actions live in the UI is left to screen layout; this ticket settles behaviour and format.

## Answer

Settled in a grilling session (2026-10-05).

- **What a file holds**: a list of exercises. "Export this one", "export these" and "export all" are the same format with a different selection; import always accepts a list.
- **What goes in**: each exercise's content (bars, voice, sticking mode, lead hand, sticking overrides) plus its practice settings (BPM, loop range, groove preset, swing amount). Global settings (click/exercise/groove volumes, count-in) are not exported; they belong to the device.
- **File shape**: JSON, `.json` extension, `{ format: "drum-app-exercises", version, exercises: [...] }`. Each exercise is the stored IndexedDB shape. The file version tracks the stored model's schema version.
- **Versions**: an older file runs through the same migration chain as the database (one migration path). A newer file than the app understands is refused with a clear message. A malformed file or wrong `format` marker is rejected whole; no partial imports.
- **Identity**: every exercise has a stable id (UUID) that is kept in the export, so a re-import can be recognised.
- **Conflicts**: when imported ids already exist, ask once per import (showing the count): Replace / Keep both / Skip, applied to all conflicts. Keep both gives the copy a new id. No prompt when there are no conflicts. Matching by name waits for the exercise library decision.
- **Merge only**: import never deletes anything. Clearing the library is done by deleting exercises in the library.
- Where the export/import actions sit in the UI is left to screen layout.
