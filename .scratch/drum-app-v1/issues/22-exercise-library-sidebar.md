# 22: Exercise library sidebar

**What to build:** The left sidebar always shows the exercise library.
- **Order:** sorted by when each exercise was last opened, as of launch. The order stays put while the app is open, except that exercises created this session appear on top.
- **Filter:** typing in the filter matches any part of a name, ignoring case.
- **Open:** clicking an exercise opens it.
- **New:** creates an Untitled exercise with the fixed defaults. A new exercise that was never changed is discarded when the drummer leaves it.
- **Duplicate:** makes "<name> (copy)" with a new id and the same content and practice settings.
- **Names:** free text and need not be unique. Rename inline from the header, or by double-clicking the name in the list.

See [spec.md](../spec.md): library rules in the core, and the left column of the UI.

**Blocked by:** 18 (Exercise autosaves and reopens at launch)

**Status:** ready-for-agent

- [ ] The core's library rules are tested: `isUnchangedNew` (a setting change or a sticking flip counts as a change), duplicate, the name filter, the session list order, and new exercises on top
- [ ] The sidebar list, filter, New, Duplicate and click-to-open work, and opening an exercise updates its last-opened time
- [ ] Inline rename works from the header and by double-clicking a name in the list; duplicate names are allowed
- [ ] Leaving an unchanged new exercise removes it from the library
- [ ] The list order doesn't jump while clicking through exercises; it updates at the next launch
