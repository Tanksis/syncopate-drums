# 03: A welcome card, Edit a copy, and the Library's empty state

**What to build:** Findings 1 and 2. The first visit opens the first example with a welcome card over the notation paper: a title, one sentence, **New exercise**, **Browse examples** and ✕. Any of the three sets `welcomeDismissed`. On the phone, the transport's **Copy** on an example becomes **Edit a copy** (or **Edit copy** if it doesn't fit at 390 px). The Library's "No exercises yet." gets a **New exercise** button and "Or copy one from Examples." See [spec](../spec.md), stories 1–5.

**Blocked by:** none

**Status:** needs-info

- [ ] `DeviceSettings.welcomeDismissed`, validated by `deviceSettingsFrom`, with tests
- [ ] The welcome shows on a fresh device, on an example, on phone and desktop; it never shows again once dismissed
- [ ] New exercise opens an empty, editable exercise in the Library; Browse examples shows the Examples list (the phone's Library sheet on its Examples tab)
- [ ] The phone's slot button reads Edit a copy (measured in both looks)
- [ ] The empty Library has a New exercise button and the hint
- [ ] Checked from a cleared IndexedDB at 390 × 844 and 1280

## Comments

- 2026-10-16: The user wants to see this mocked or prototyped before agreeing to it. It waits for the `prototype/new-user-polish` verdict.
