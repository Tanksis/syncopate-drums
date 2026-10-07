# 03: Switch a beat between the sixteenth and triplet grid

**What to build:** A small 3/16 toggle on each beat box (and right-click on the box) switches that beat between four sixteenth positions and three triplet positions, so triplet beats can be entered by clicking. See [spec](../spec.md) stories 15–19.

**Blocked by:** 02 (Click hits on grid positions)

**Status:** done (merged in PR #25, 2026-10-07)

- [x] New editor command: set a beat's grid. It keeps a downbeat hit, clears the others and resets holds to their defaults. It is one undo step, moves the cursor to the beat without advancing, and isn't repeated by `.`
- [x] Pending grid: an empty beat (or one with only a downbeat hit) switched to triplets stays on the triplet grid in the editor state until a hit fixes it. It isn't saved, and it clears when the beat changes by any other command
- [x] Toggling hits works on triplet positions (switch, then click positions 1 and 3 → the beat reads triplet `x.x`)
- [x] The toggle shows the beat's current grid; right-click on a box does the same, and the browser menu is suppressed on the strip
- [x] Core tests cover the switch, the pending grid and undo; verified in the browser with a real mouse
