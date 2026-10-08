# 06: Sidebars as overlays in a narrow window

**What to build:** Below 1000 px wide, both sidebars show as rails, and opening one shows it as an overlay over the notation. `Esc` or a click outside closes it. See [spec](../spec.md) stories 8–9.

**Blocked by:** 05

**Status:** done (merged in PR #47, 2026-10-08)

- [x] Below 1000 px both sidebars show as rails, whatever the stored setting, which applies again at 1000 px and over
- [x] Opening a rail shows its sidebar as an overlay with a shadow, on top of the notation, without moving it. Only one overlay is open at a time
- [x] `Esc` closes an open overlay, and only then does `Esc` skip its editor meaning. A click outside the overlay closes it
- [x] Opening an exercise from the library overlay closes it
- [x] The overlay's open state is not stored
- [x] Checked in the browser at 900 px with real mouse clicks: open each overlay, pick an exercise, change a setting, close with `Esc` and with a click outside; then widen to 1280 px and see the stored layout

## Comments

Where the spec was silent: `Esc` leaves the overlay open while focus is in a text field or a dialog is open, because those have their own Escape. Opening any exercise closes the overlay. The backdrop leaves the rails uncovered, so one click on the other rail switches overlays.
