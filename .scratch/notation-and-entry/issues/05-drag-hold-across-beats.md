# 05: Drag a hold across beats and bars

**What to build:** Dragging a note's hold past the beat line ties it on into the next beats, across bar lines too. Quarters, dotted quarters, half notes and syncopated long notes can then be entered by dragging. See [spec](../spec.md) stories 24, 25 and 29.

**Blocked by:** 04 (Drag a note's hold within its beat)

**Status:** done (merged in PR #25, 2026-10-07)

- [x] The set-hold command accepts an end in a later beat or bar, snaps to the grid of the beat it ends in, and stops at the next hit
- [x] Beats the drag passes through become tied continuations (not struck, no hand); shortening back past a beat line removes the tie
- [x] Hold bars continue across box edges in the beat strip, across bar lines too; the ⌒ mark shows on tied-into boxes
- [x] Core tests, e.g. dragging the note on 1 to the & of 2 gives a dotted quarter with beat 2 tied into and a rest on the & of 2, and a drag over a bar line ties across it. Verified in the browser with a real mouse
