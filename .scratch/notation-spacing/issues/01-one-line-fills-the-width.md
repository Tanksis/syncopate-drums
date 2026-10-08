# 01: An exercise on one line fills the width

**What to build:** When the whole exercise fits on one line, its bars share the line's width, up to a cap of 475 per bar (at scale 1). Longer exercises keep equal, aligned bars, and a short last line isn't stretched. See [spec](../spec.md) stories 1–4.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `notationFit` returns `barWidth` too, and `NOTATION_LAYOUT.maxBarWidth` is 475. Tested: one bar fills the line, two bars split it, one bar in a very wide area is capped, five bars all get a quarter of the line, and the existing `notationFit` tests still pass
- [ ] `drawExercise` draws at that bar width (the first bar still adds the clef's width), left aligned
- [ ] The playhead line, the current-bar shade, the loop band and the empty-exercise hint line up with the wider bars
- [ ] Checked in the browser with real mouse clicks: one bar of sixteenth hi-hats (e.g. the rock beat example cut to one bar, or a new exercise) at 1280 px and 900 px, two bars, and five bars; clicking a note, a hand and a bar number in a filled bar works
