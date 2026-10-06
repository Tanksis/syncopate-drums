# 18: Exercise autosaves and reopens at launch

**What to build:** Every change to the open exercise (notes, settings, name) is saved automatically to IndexedDB. Closing and reopening the app brings back the last open exercise, with its practice settings. With an empty library, the app opens a new Untitled exercise straight away. A device-settings store exists for settings kept per device rather than per exercise, starting with the last-opened exercise id.

See [spec.md](../spec.md): Persistence (`ExerciseRepository` over `idb`, the device-settings store, the shared migration chain) and the app store as the only caller of the repository.

**Blocked by:** 16 (Enter straight beat figures and see them on the staff)

**Status:** done (merged in PR #5, 2026-10-06)

- [x] An `ExerciseRepository` (list, get, put, delete many, put many) over `idb`, opened through the core's migration chain; each stored exercise carries a schema version
- [x] The migration chain lives in the core and is tested (a stored v0-shaped exercise migrates to the current shape), so import can reuse it later
- [x] `navigator.storage.persist()` is requested
- [x] Every committed change autosaves the open exercise; slider drags are debounced
- [x] A device-settings store holds the last-opened id (and later volumes, mute, count-in, vim keys)
- [x] Launch opens the last-opened exercise, or a new Untitled one if the library is empty (launch rule tested in the core)
- [x] Reloading the page restores the notes and the BPM exactly

## Comments

- 2026-10-06: Implemented on `feature/18-autosave-and-reopen`. Core: `migrateExercise` (v0, the shape before schema versions, gets one; newer versions are refused) and `exerciseToOpenAtLaunch` (last open if it still exists, else the most recently opened, else none → new Untitled), both tested. `DeviceSettings` moved to the model and gained `lastOpenedId`. App: `src/app/repository.ts` wraps `idb` (the user approved allowing ISC in the licence check). Opening the database migrates older records in place. Records from a newer schema are left untouched and kept out of the library, so an older cached app never overwrites them. The store saves the open exercise on every change. A slider drag is debounced and saved when the pointer lifts; arrow keys save at once. A new Untitled exercise isn't stored until first changed. Storage is only used once launch fully succeeds; otherwise the header says "Not saving". Checked in Chrome: notes plus BPM survive a reload (including a reload 100 ms after a drag), a hand-written v0 record migrates, and a v99 record is skipped and left as is. A `pagehide` flush was tried and dropped, because Chrome aborted that write on reload. `persist()` is requested, but Chrome denied it on localhost (it grants it heuristically); see whether the installed PWA gets it. The "Not saving" note wasn't checked in a browser.

- 2026-10-06: Squash-merged as PR #5 once CI passed.
