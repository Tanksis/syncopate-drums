# 28: Swing feel

**What to build:** The Groove sidebar group gets a swing slider from 50% (straight) to 75%. It sets one swing amount for the exercise (and, from ticket 29, the groove layer). Preset buttons give light 58%, medium 62%, triplet 66.7% (the default) and dotted 75%.

Swing eases toward straight as the tempo rises: the full amount up to 120 BPM, straight by 320 BPM. Notated triplets are never moved. Sixteenths are swung in proportion: the "e" lands halfway through the long eighth and the "a" halfway through the short one. The swing amount is remembered per exercise.

See [spec.md](../spec.md): `schedule`, with the `effectiveSwing` / `warp` logic from the playback prototype (the breakpoints may be tuned).

**Blocked by:** 19 (Triplet beat figures)

**Status:** done (merged in PR #18, 2026-10-06)

- [x] `schedule` warps binary-grid notes with the effective swing for the current BPM and never warps triplet-grid notes
- [x] Tests: at 180 BPM with 66.7% swing, the & of 1 lands at 0.62 of the beat and a triplet stays at 2/3; at 120 BPM or below the full amount applies; at 320 it's straight; sixteenths land in proportion
- [x] The slider and the four preset buttons set the amount, and the change applies to playback live
- [x] The swing amount autosaves with the exercise and comes back on reopen

## Comments

- The spec doesn't say how to tell binary-grid notes from triplet-grid ones. A note counts as binary when it sits on every third tick of the beat (the 1, e, & and a). Tick 0 is on both grids, but warp leaves it where it is.
- Swing moves only event times. The schedule window and `nextTime` stay on straight time, so a swung note near the end of a window may be scheduled a little past the horizon. Nothing is played twice or skipped.
- Swing changes are not undo steps, the same as BPM. The slider autosaves once a drag settles. The 180 BPM test expects 0.617, the exact value that the spec's "0.62" rounds.
- The by-ear playback check is left to the user.
