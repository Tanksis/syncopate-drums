# 19: Triplet beat figures

**What to build:** The drummer can enter the 6 triplet beat figures on the home row (A `xxx`, S `x.x`, D `xx.`, F `.xx`, G `.x.`, H `..x`). Each fills one beat as a triplet group, is drawn as an eighth-note triplet with its tuplet number and correct beaming, and plays at triplet timing.

See [spec.md](../spec.md): model types (a triplet group fills exactly one beat of 3 triplet-eighth slots and holds triplet eighths, triplet quarters and rests) and the auto-speller (split notes at triplet-beat edges).

**Blocked by:** 17 (Play the exercise with click and count-in)

**Status:** ready-for-agent

- [ ] The palette's home row holds the 6 triplet figures, by key and by click
- [ ] The speller writes each triplet figure into a one-beat triplet group (e.g. `x.x` as a triplet quarter + triplet eighth), and the beat view reads it back; round-trip tests cover all 6
- [ ] The notation view draws tuplets correctly next to straight beats in the same bar
- [ ] `schedule` places triplet notes at thirds of the beat (tested)
- [ ] By ear: a bar mixing straight and triplet beats plays as written against the click
