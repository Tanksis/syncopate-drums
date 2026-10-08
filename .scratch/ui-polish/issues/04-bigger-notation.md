# 04: Bigger notation for short exercises

**What to build:** When there's room, the staff scales up to fill the notation area, up to 1.6 times, and shrinks back as bars are added, never adding a line. See [spec](../spec.md) stories 1–4.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] A pure core function takes the bar count, the area's width and height, and one line's height at scale 1, and returns the scale (1 to 1.6, in steps of 0.05) and bars per line (at most 4, none narrower than the minimum bar width). The layout constants move to the core with it
- [ ] Tested: one bar in a wide, tall area is 1.6; eight bars in the same area are 1; the scale never adds a line; a short exercise in a short area scales only as far as its height fits; an exercise that doesn't fit at 1 stays at 1
- [ ] `drawExercise` draws at that layout, scaling the SVG, and `NotationView` measures the area's height as well as its width
- [ ] The playhead line, the current-bar shade, the loop band and following the playback line up at any scale
- [ ] Checked in the browser with real mouse clicks at a large scale: a note moves the cursor, a hand flips its sticking, a bar number loops the bar
