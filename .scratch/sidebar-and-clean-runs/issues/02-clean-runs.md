# 02: Clean runs

**What to build:** A **Clean run** is a dated log entry of a BPM an exercise was played cleanly at. "Played it clean" by the tempo logs one at the current BPM. The sidebar shows ✓ and the best clean BPM beside each logged exercise (rudiments, examples, own). The exercise's history lists them newest first, each removable. Own exercises' clean runs go with them on export and come back on import. See [spec](../spec.md), stories 4-7.

**Blocked by:** 01

**Status:** done

- [x] Core: the clean runs model, best BPM, history order; unit-tested
- [x] Stored on the device for every exercise; deleted with an own exercise
- [x] Export and import keep them
- [x] The button and history on desktop and phone; ✓ best BPM in the lists
- [x] Checked in the browser with real mouse clicks, desktop and phone
- [x] `CONTEXT.md`: Clean run

## Comments

- 2026-10-28: Done. Runs live on the exercise (`cleanRuns`, schema 10) and, for a built-in, in the `builtInCleanRuns` IndexedDB store (ADR 0019). On the desktop the ✓ sits after the tempo in the exercise bar; on the phone it is in the header (the rail when sideways), since the transport bar had no room. One run a day at each BPM: a second tap the same day moves it.
