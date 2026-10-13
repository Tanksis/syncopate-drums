# 03: New from pattern

**What to build:** A New from pattern button in the Library opens the pattern dialog with a Bars field and makes a new exercise from the pattern, carried on across its bars. See [spec](../spec.md) stories 12–15.

**Blocked by:** 02 (the pattern dialog and the fill)

**Status:** done

- [x] Core: `exerciseFromPattern({ id, now, folderId, pattern, grid, bars })` carries the pattern on across bars (bar 2 starts where bar 1 stopped), names the exercise after the pattern, and uses natural sticking and the usual new-exercise defaults (tested)
- [x] The dialog in this mode adds a Bars field (default 4, 1–64) and creates instead of filling
- [x] New from pattern sits beside New in the Library; the new exercise opens and is filed in the open folder, if any
- [x] Works in the phone's full-screen Library
- [x] Checked in the browser at 1280 px and 390 × 844
