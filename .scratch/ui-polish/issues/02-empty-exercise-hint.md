# 02: Empty-exercise hint

**What to build:** An exercise with no hits shows a hint centred over the staff: "Click a grid position below, or type a figure key, to add hits." It goes with the first hit. See [spec](../spec.md) stories 10–11.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `hasHits(exercise)` says whether any row of any bar has a note. Tested: all rests has none, and one kick note, or one snare note, is a hit
- [ ] The hint shows in the notation area for an exercise with no hits, centred over the staff, in muted text, and doesn't take clicks
- [ ] It goes as soon as a hit is entered (by a click or a figure key) and comes back if every hit is removed or undone
- [ ] Checked in the browser with real mouse clicks: New shows the hint, a click on a grid position clears it, undo brings it back
