# 05: Collapsible sidebars

**What to build:** Each sidebar has a collapse button in its heading. A collapsed sidebar is a thin rail with a button to open it again, and which sidebars are collapsed is remembered on this device. See [spec](../spec.md) stories 5–7.

**Blocked by:** None (can start immediately)

**Status:** done (merged in PR #47, 2026-10-08)

- [x] Device settings gain `librarySidebarOpen` and `settingsSidebarOpen`, both default `true`. Tested: the defaults. Stored settings without them load with both open, by the existing merge over the defaults
- [x] The library and settings sidebars each have a collapse button (a chevron) in their heading
- [x] A collapsed sidebar is a rail about 32 px wide, with an open button and the sidebar's name written vertically, and the notation and beat cards take the room
- [x] Collapsing and opening keep focus off the buttons, so Space still enters a rest
- [x] Checked in the browser at 1280 px with real mouse clicks: collapse each, reload, they stay collapsed, open them again

## Comments

Where the spec was silent: the settings sidebar gains a "Settings" heading to carry its chevron. The rail's whole button (chevron and name) opens it.
