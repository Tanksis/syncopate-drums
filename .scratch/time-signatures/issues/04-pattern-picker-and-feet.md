# 04: The Pattern picker and Feet

**What to build:** The Groove group becomes one **Pattern** picker, grouped by style family and filtered by the time signature, with a tick, a description and a dot strip on each row. Under it, a **Feet** sub-heading holds **Bass drum** (Off / Feathered) and **Hi-hat foot**. Groove presets become patterns. Ride has no hi-hat foot of its own (ADR 0010's replacing rule goes). Picking Ride may set Triplet swing and a 2 & 4 hi-hat foot, and a quiet line under the picker says so, with Undo and ✕. Schema 6 turns `jazz` and `jazzFeathered` into Ride with the same sound. Desktop and phone. See [spec](../spec.md), stories 16–19 and 22, and Implementation Decisions › Patterns, Feet, Schema 6, Picking a pattern and Groove group.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] `PatternId`, `Pattern`, `patternsFor()`, `patternHits()`; `PracticeSettings.pattern` and `bassDrum`, with tests
- [ ] `withPattern` and its suggestions, with tests; the feathered bass drum with any pattern
- [ ] Schema 6 migration (sound unchanged) and import validation, with tests
- [ ] The picker, the Feet rows and the note with Undo, on desktop and phone
- [ ] ADR 0010 note; `CONTEXT.md`: Pattern, Bass drum
- [ ] Checked in the browser at 1280 and 390 × 844, with real mouse events
