# 19: Triplet beat figures

**What to build:** The drummer can enter the 6 triplet beat figures on the home row (A `xxx`, S `x.x`, D `xx.`, F `.xx`, G `.x.`, H `..x`). Each fills one beat as a triplet group, is drawn as an eighth-note triplet with its tuplet number and correct beaming, and plays at triplet timing.

See [spec.md](../spec.md): model types (a triplet group fills exactly one beat of 3 triplet-eighth slots and holds triplet eighths, triplet quarters and rests) and the auto-speller (split notes at triplet-beat edges).

**Blocked by:** 17 (Play the exercise with click and count-in)

**Status:** done (merged in PR #6, 2026-10-06)

- [x] The palette's home row holds the 6 triplet figures, by key and by click
- [x] The speller writes each triplet figure into a one-beat triplet group (e.g. `x.x` as a triplet quarter + triplet eighth), and the beat view reads it back; round-trip tests cover all 6
- [x] The notation view draws tuplets correctly next to straight beats in the same bar
- [x] `schedule` places triplet notes at thirds of the beat (tested)
- [x] By ear: a bar mixing straight and triplet beats plays as written against the click

## Comments

- 2026-10-06: Implemented on `feature/19-triplet-beat-figures`. The speller now works on a one-cell-per-tick timeline with a per-beat triplet flag: a three-character figure makes its beat a triplet group, spelled with triplet quarters and eighths, and notes are cut at triplet-group edges (ready for ticket 20's ties). A triplet group holding only rests reads back as a rest beat. `schedule` needed no change; a test pins triplet notes at thirds of the beat. The staff draws a tuplet "3" under each triplet group (bracketed when not all of it is beamed) and beams beat by beat, since VexFlow's own grouping loses count after a triplet. Checked in Chrome: `2 A S F | G H 9 D | 1 A A A` reads correctly and the beat strip and palette read back. The by-ear check is left for the user.

- 2026-10-06: Squash-merged as PR #6 by the user.
