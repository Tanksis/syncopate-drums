# 04: The Pattern picker and Feet

**What to build:** The Groove group becomes one **Pattern** picker, grouped by style family and filtered by the time signature, with a tick, a description and a dot strip on each row. Under it, a **Feet** sub-heading holds **Bass drum** (Off / Feathered) and **Hi-hat foot**. Groove presets become patterns. Ride has no hi-hat foot of its own (ADR 0010's replacing rule goes). Picking Ride may set Triplet swing and a 2 & 4 hi-hat foot, and a quiet line under the picker says so, with Undo and ✕. Schema 6 turns `jazz` and `jazzFeathered` into Ride with the same sound. Desktop and phone. See [spec](../spec.md), stories 16–19 and 22, and Implementation Decisions › Patterns, Feet, Schema 6, Picking a pattern and Groove group.

**Blocked by:** 01

**Status:** done (merged in PR #146, 2026-10-17)

- [x] `PatternId`, `Pattern`, `patternsFor()`, `patternHits()`; `PracticeSettings.pattern` and `bassDrum`, with tests
- [x] `withPattern` and its suggestions, with tests; the feathered bass drum with any pattern
- [x] Schema 6 migration (sound unchanged) and import validation, with tests
- [x] The picker, the Feet rows and the note with Undo, on desktop and phone
- [x] ADR 0010 note; `CONTEXT.md`: Pattern, Bass drum
- [x] Checked in the browser at 1280 and 390 × 844, with real mouse events

## Comments

- The sticking-pattern fill's `withPattern` (pattern.ts) was renamed `withPatternFill`, so the spec's `withPattern(exercise, id)` could take the name.
- Notation: under a pattern, the hi-hat foot setting counts in the voicing as the jazz preset's own foot did, so migrated jazz exercises are written exactly as before. With no pattern it stays an ostinato under the fill (ADR 0012 has a note).
- Schema 6 sets the 2 & 4 foot for a jazz exercise only in 4/4. A jazz exercise saved in 3/4 or 2/4 (possible since ticket 01) migrates with the foot off, because those meters don't offer 2 & 4. Its hi-hat on beat 2 is lost.
- The hi-hat foot became chips (Off, 1, Beats, 2 & 4, &s), as in the prototype, rather than a select.
- The note's Undo restores only the settings the pick changed.
- The browser check ran at a 958 px viewport and at 1280 × 860 and 390 × 844 in iframes, because the window couldn't be resized.
