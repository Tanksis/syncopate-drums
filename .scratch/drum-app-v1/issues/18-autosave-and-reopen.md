# 18: Exercise autosaves and reopens at launch

**What to build:** Every change to the open exercise (notes, settings, name) is saved automatically to IndexedDB. Closing and reopening the app brings back the last open exercise, with its practice settings. With an empty library, the app opens a new Untitled exercise straight away. A device-settings store exists for settings kept per device rather than per exercise, starting with the last-opened exercise id.

See [spec.md](../spec.md): Persistence (`ExerciseRepository` over `idb`, the device-settings store, the shared migration chain) and the app store as the only caller of the repository.

**Blocked by:** 16 (Enter straight beat figures and see them on the staff)

**Status:** ready-for-agent

- [ ] An `ExerciseRepository` (list, get, put, delete many, put many) over `idb`, opened through the core's migration chain; each stored exercise carries a schema version
- [ ] The migration chain lives in the core and is tested (a stored v0-shaped exercise migrates to the current shape), so import can reuse it later
- [ ] `navigator.storage.persist()` is requested
- [ ] Every committed change autosaves the open exercise; slider drags are debounced
- [ ] A device-settings store holds the last-opened id (and later volumes, mute, count-in, vim keys)
- [ ] Launch opens the last-opened exercise, or a new Untitled one if the library is empty (launch rule tested in the core)
- [ ] Reloading the page restores the notes and the BPM exactly
