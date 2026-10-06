# 33: Import exercises from JSON

**What to build:** The drummer imports a JSON file holding one or many exercises.
- **Matching:** exercises are matched by id only.
- **Conflicts:** when some already exist, the app asks once, showing the count, whether to Replace, Keep both, or Skip them all. With no conflicts there's no prompt.
- **Keep both:** gives the imported copy a new id and keeps its name.
- **Safety:** import never deletes anything.
- **Versions:** files from older versions are migrated. A file from a newer version, a malformed file, or a file that isn't a Syncopate! export is refused whole, with a clear message.

See [spec.md](../spec.md): `parseImport(json, appVersion)` and `planImport(incoming, existingIds, choice)`, which share the migration chain with storage.

**Blocked by:** 32 (Export exercises to JSON)

**Status:** ready-for-agent

- [ ] `parseImport` validates the format marker and shape, migrates older versions through the same chain as the database, and refuses newer or malformed files with a reason (tests: a v0 file migrates; a v99 file is refused; JSON that isn't an export is refused)
- [ ] `planImport` applies Replace / Keep both (new id, same name) / Skip to all conflicts and never deletes (tested)
- [ ] The Import button opens a file picker; one conflict dialog with the count appears only when ids clash
- [ ] A refused file shows a clear message and changes nothing
- [ ] An exported file imports back into an empty library with its content and practice settings intact
