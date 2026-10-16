# 03: A welcome card and the Library's empty state

**What to build:** Findings 1 and 2, as `?welcome=card` and `?empty=button` on `prototype/new-user-polish`. The first visit opens the first example with a welcome card over the notation paper (the paper dimmed behind it): **Welcome to Syncopate!**, one sentence, **New exercise** (primary), **Browse examples** and ✕. Any of the three sets `welcomeDismissed`. The Library's "No exercises yet." gets a **New exercise** button and "Or copy one from Examples.", where Examples switches to that tab. The phone's **Copy** stays as it is. See [spec](../spec.md), stories 1–5.

**Blocked by:** none

**Status:** ready-for-agent

- [ ] `DeviceSettings.welcomeDismissed`, validated by `deviceSettingsFrom`, with tests
- [ ] The welcome shows on a fresh device, on an example, on phone and desktop; it never shows again once dismissed
- [ ] New exercise opens an empty, editable exercise in the Library; Browse examples shows the Examples list (the phone's Library sheet on its Examples tab)
- [ ] The empty Library has a New exercise button and the hint, with Examples as a link to the tab
- [ ] Checked from a cleared IndexedDB at 390 × 844 and 1280

## Comments

- 2026-10-16: The user wants to see this mocked or prototyped before agreeing to it. It waits for the `prototype/new-user-polish` verdict.
- 2026-10-16: Prototype verdict (`prototype/new-user-polish`, commit 53472b9): the welcome card (over the start page and the banner), the Copy label kept (over "Edit a copy" and "Make it mine"), and the empty Library's button (over the panel).
