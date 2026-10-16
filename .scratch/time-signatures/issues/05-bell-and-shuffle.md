# 05: Bell in 6/8, Shuffle and Slow blues in 12/8

**What to build:** Three compound patterns. **Bell** (Afro-Cuban, 6/8) plays `x.xxx.` on the ride bell, written as an x on the ride's line. **Shuffle** (Blues, 12/8) plays the ride on the first and third eighth of each beat (`x.xx.xx.xx.x`). **Slow blues** (Blues, 12/8) plays the closed hi-hat on every eighth (`xxxxxxxxxxxx`), the downbeat of each beat louder, and the Slow blues example switches to it. They are listed only in their own meters. See [spec](../spec.md), story 21, and Implementation Decisions › Patterns.

**Blocked by:** 02, 04

**Status:** ready-for-agent

- [ ] `bell68`, `shuffle128` and `slowBlues128` in `patternHits` and `patternsFor`, with tests
- [ ] The Slow blues example plays over the Slow blues pattern, with a test
- [ ] The ride bell drawn and played; the patterns in the notation and the schedule
- [ ] Checked in the browser; the sound is left to the user's ear
