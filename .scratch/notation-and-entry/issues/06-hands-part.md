# 06: Hands part: snare stems up, merged with the groove

**What to build:** The notation writes everything played with the hands as one **hands part**, stems up. A snare line is always stems up. With a groove on, the snare shares stems with the ride or hi-hat where they land together, so rests appear only where no hand is playing. See [spec](../spec.md) stories 44, 46–50 and 52–56, and [ADR 0002](../../../docs/adr/0002-hands-up-feet-down.md).

**Blocked by:** 01 (Playhead line), so the renderer rework builds on the playhead's drawing code

**Status:** done (merged in PR #25, 2026-10-07)

- [x] New pure core function: the staff parts for an exercise, its groove preset and its voice. Per bar it returns a hands part and a feet part as chords and rests with durations, dots, triplets and ties. Each chord note says its drum, its notehead, whether it's an exercise note (with its id) and whether it's a tied continuation
- [x] A chord holds until the next chord in its part, or until all its notes' holds end if that is sooner. The part containing the exercise rests only where nothing sounds or is held; a groove-only part shows no rests
- [x] An exercise note held on under a later chord appears in that chord as a tied continuation
- [x] The renderer draws the parts as returned (hands up, feet down) and no longer decides voices itself; a bare snare line is stems up with its rests
- [x] Sticking and override clicks work on exercise notes inside chords. The cursor-beat highlight, bar shading, bar numbers and loop clicks still work, and the playhead line sits on the merged chords
- [x] Core tests for every preset with the snare voice (e.g. jazz with a snare on the & of 2 gives one ride + snare chord at tick 18 and no rests in the hands part); checked by eye against the Groove Scribe comparison bar

## Comments

- 2026-10-07: The tie criterion here was superseded during the build: with a groove on, a held exercise note ends at the next chord in its part instead of being tied on under it (spec story 54, decided by the user after seeing this ticket). Implemented in ticket 07's branch.
