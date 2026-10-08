# 01: New exercises start straight

**What to build:** A new exercise starts at 50% swing, and picking a jazz groove on a straight exercise turns swing to 66.7% (ADR 0007). See [spec](../spec.md) stories 1–6.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `newExercise` sets swing to 50%; a new untouched exercise is still `isUnchangedNew`. Tested
- [ ] Picking `jazz` or `jazzFeathered` from a non-jazz preset with swing at 50% sets swing to 66.7%. Tested
- [ ] Picking a jazz preset with any other swing amount, picking the hi-hat preset, or turning the groove off leaves swing as it is. Tested
- [ ] Stored exercises keep their swing (no migration)
- [ ] The swing slider and preset buttons show the new value after a jazz preset is picked (the groove and swing change together, in one save)
- [ ] Checked in the browser: New, then `x.x.` on beat 1 reads as two eighths; picking the jazz groove draws it as a triplet
