# 33: Import exercises from JSON

**What to build:** The drummer imports a JSON file holding one or many exercises.
- **Matching:** exercises are matched by id only.
- **Conflicts:** when some already exist, the app asks once, showing the count, whether to Replace, Keep both, or Skip them all. With no conflicts there's no prompt.
- **Keep both:** gives the imported copy a new id and keeps its name.
- **Safety:** import never deletes anything.
- **Versions:** files from older versions are migrated. A file from a newer version, a malformed file, or a file that isn't a Syncopate! export is refused whole, with a clear message.

See [spec.md](../spec.md): `parseImport(json, appVersion)` and `planImport(incoming, existingIds, choice)`, which share the migration chain with storage.

**Blocked by:** 32 (Export exercises to JSON)

**Status:** done (merged in PR #23, 2026-10-07)

- [x] `parseImport` validates the format marker and shape, migrates older versions through the same chain as the database, and refuses newer or malformed files with a reason (tests: a v0 file migrates; a v99 file is refused; JSON that isn't an export is refused)
- [x] `planImport` applies Replace / Keep both (new id, same name) / Skip to all conflicts and never deletes (tested)
- [x] The Import button opens a file picker; one conflict dialog with the count appears only when ids clash
- [x] A refused file shows a clear message and changes nothing
- [x] An exported file imports back into an empty library with its content and practice settings intact

## Comments

- `planImport` takes a 4th argument, `{ newId }`, so the core stays pure and tests can give fixed ids.
- The conflict dialog also has Cancel (the default focus), which imports nothing. Its title shows the count, for example "2 exercises already in the library".
- Imported exercises new to the library go on top of the list, in file order. Replaced ones stay where they are. If the open exercise is replaced, it reopens as imported, which starts a new undo history.
- A pending autosave of a replaced exercise is dropped so it can't overwrite the import.
- After an import, a status line in the sidebar says how many exercises were stored ("Nothing new imported." when every one was skipped).
- Refusals, checked in this order:
  - not JSON, or not an export → "isn't a Syncopate! export"
  - a file or any exercise from a newer version → "newer version"
  - an empty `exercises` list → "holds no exercises"
  - any exercise malformed (bad ids, names, bars that aren't four beats, unknown enums, BPM or swing out of range, loop range outside its bars, duplicate ids in the file) → "This file is damaged: exercise N ("name") …"
- An exercise without its own `schemaVersion` takes the file's `version`.
- Not handled: an id that matches an exercise from a newer app version, hidden in the database, isn't counted as a conflict and would be overwritten.
