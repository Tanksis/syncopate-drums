# 01: New exercises start straight

**What to build:** A new exercise starts at 50% swing, and picking a jazz groove on a straight exercise turns swing to 66.7% (ADR 0007). See [spec](../spec.md) stories 1–6.

**Blocked by:** None (can start immediately)

**Status:** done (merged in PR #37, 2026-10-08)

- [x] `newExercise` sets swing to 50%; a new untouched exercise is still `isUnchangedNew`. Tested
- [x] Picking `jazz` or `jazzFeathered` from a non-jazz preset with swing at 50% sets swing to 66.7%. Tested
- [x] Picking a jazz preset with any other swing amount, picking the hi-hat preset, or turning the groove off leaves swing as it is. Tested
- [x] Stored exercises keep their swing (no migration)
- [x] The swing slider and preset buttons show the new value after a jazz preset is picked (the groove and swing change together, in one save)
- [x] Checked in the browser: New, then `x.x.` on beat 1 reads as two eighths; picking the jazz groove draws it as a triplet (headless, fresh profile; the slider and "triplet" button read 66.7%)

## Comments

- Where ADR 0007 was silent, the spec's "the previous one wasn't" rule applies: moving from jazz to the feathered jazz ride on an exercise set back to straight leaves it straight. The rule is stated in `withGroove`'s comment.
- Added `TRIPLET_SWING` (2/3) to the core; the sidebar's "triplet" button uses it too.
