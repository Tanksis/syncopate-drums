# 04: The Rhythm sheet and subdivision pictures

**What to build:** The phone's Rhythm sheet from mockup P5: the time signature with a beats stepper on its left and a note-value stepper on its right, the grid of 12 subdivision pictures drawn with VexFlow, and the subdivision volume. The pictures are a shared component the desktop panel reuses. See [spec](../spec.md) stories 7–9 and 13, and the canvas's P5.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Opens from the Time signature and Subdivision buttons; Done closes it
- [ ] Steppers: beats 1–16, note value 2 / 4 / 8 / 16; changing either resets the blocks
- [ ] `SubdivisionPicture` draws each pattern with VexFlow, no staff lines, with an accessible name
- [ ] The selected subdivision is marked and named above the grid
- [ ] The subdivision volume slider
- [ ] Checked in the browser at 390 × 844, light and dark
