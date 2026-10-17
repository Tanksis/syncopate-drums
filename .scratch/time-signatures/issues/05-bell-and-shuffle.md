# 05: Bell in 6/8, Shuffle and Slow blues in 12/8

**What to build:** Three compound patterns. **Bell** (Afro-Cuban, 6/8) plays `x.xxx.` on the ride bell, written as an x on the ride's line. **Shuffle** (Blues, 12/8) plays the ride on the first and third eighth of each beat (`x.xx.xx.xx.x`). **Slow blues** (Blues, 12/8) plays the closed hi-hat on every eighth (`xxxxxxxxxxxx`), the downbeat of each beat louder, and the Slow blues example switches to it. They are listed only in their own meters. See [spec](../spec.md), story 21, and Implementation Decisions › Patterns.

**Blocked by:** 02, 04

**Status:** done (merged in PR #148, 2026-10-17)

- [x] `bell68`, `shuffle128` and `slowBlues128` in `patternHits` and `patternsFor`, with tests
- [x] The Slow blues example plays over the Slow blues pattern, with a test
- [x] The ride bell drawn and played; the patterns in the notation and the schedule
- [x] Checked in the browser; the sound is left to the user's ear

## Comments

Choices made where the spec was silent:

- **Accents.** The spec gives accents only to Slow blues. The Bell is also louder on its two beats (1 against 0.8), and the Shuffle on each beat's downbeat (1 against 0.7), matching how Ride and Hi-hat 8ths already lean. These are left for the user to judge by ear.
- **Hits from the strip.** Each compound pattern's hits are built from its strip on the triplet grid (`fromStrip` in `groove.ts`), so the picker's dots and what plays can't disagree.
- **A notation fix.** In compound time, a beat counted as a triplet group only where the exercise had a triplet note there. A groove hit inside an empty beat (the bell's third eighth) then had no legal spelling and crashed the staff. Any compound beat with a sound off its downbeat is now a triplet group (`staffParts.ts`).
- **The header change rode along:** see ticket 07's follow-up comment.
