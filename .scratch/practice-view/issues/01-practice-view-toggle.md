# 01: The practice view toggle

**What to build:** A Practice view toggle at the end of the exercise's bar, and the P key, switching a per-device `practiceView` setting. On, both sidebars fold to rails (drawers), the grid editor to its bar tabs, and the notation grows to fill the card. Only the toggle changes the layout; the editor's arrow brings it back. See [spec](../spec.md), stories 1-4 and 8.

**Blocked by:** none

**Status:** done (merged in PR #176, 2026-11-16)

- [x] `DeviceSettings.practiceView`, default off, unit-tested through `deviceSettingsFrom`
- [x] `workstationLayout` decides the sidebars' places, the editor's fold and the notation's growth, unit-tested
- [x] The toggle (drawn icon and label, lit while on) and P, not in a field or dialog, not on the Metronome or a phone
- [x] The editor folded to its bar tabs; its arrow leaves the practice view with the editor open
- [x] `EXERCISE_BAR_WIDTH.full` re-measured with the toggle
- [x] `notationFit` test: a four-bar line larger and all in view in the freed room
- [x] Measured in the browser at 1440, 1280 and 1024 in both looks, light and dark: nothing moves on play, stop or loop
- [x] `CONTEXT.md`: Practice view; Help's words, Quick start and keys

## Comments

The editor comes back by a deliberate click, not by itself: editing keys and clicks on the notation work in place in the practice view and move nothing, so a stray key never springs the layout. The view grows the notation even with Fit off, since growing is what it is for.
