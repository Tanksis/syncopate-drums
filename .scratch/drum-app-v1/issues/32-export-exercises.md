# 32: Export exercises to JSON

**What to build:** The drummer can export the selected exercises, or click "Export all", to download a JSON file. The file includes each exercise's content and practice settings (BPM, loop range, groove, swing) but no device settings. A single exercise exports as a file named after it, with characters that aren't allowed in file names removed. Several exercises export as `drum-exercises-YYYY-MM-DD.json`.

See [spec.md](../spec.md): Export/import in the core. The file shape is `{ format: "drum-app-exercises", version, exercises: [...] }`; keep the marker as decided.

**Blocked by:** 23 (Select and delete exercises)

**Status:** ready-for-agent

- [ ] The core builds the export file shape with the format marker and the current schema version, each exercise in its stored shape (tested)
- [ ] The core derives the file name: the cleaned-up exercise name for one exercise, `drum-exercises-YYYY-MM-DD.json` for several (tested, including characters not allowed in file names)
- [ ] "Export selected" and "Export all" in the library sidebar download the file
- [ ] Device settings (volumes, mute, count-in, vim keys, last-opened id) are not in the file

## Comments

- "Import" and "Export all" sit in a second row under New / Duplicate / Delete. Ticking exercises shows "Export selected" beside "Delete selected".
- The export file is pretty-printed JSON. A name with nothing left after cleaning exports as `drum-exercise.json`.
- The file date is the local date, not UTC.
- "Export all" exports the library as listed, including an unchanged new Untitled exercise if one is open.
- The editor header also has a `vim on` / `vim off` switch next to the mode indicator, added on request alongside this ticket. It sets the same device setting as the Editor sidebar group.
