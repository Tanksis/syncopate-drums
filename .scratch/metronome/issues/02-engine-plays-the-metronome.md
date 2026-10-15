# 02: The engine plays the metronome

**What to build:** The playback engine plays either the exercise or the metronome schedule, one at a time, with the metronome's click voices and levels, and reports the current metronome beat for the visuals. See [spec](../spec.md) stories 3, 5–7, 11 and 12, and Implementation Decisions › App.

**Blocked by:** 01

**Status:** done (merged in PR #98, 2026-10-15)

- [x] `startPlayback` takes the source to schedule from; starting one stops the other
- [x] Voices: Beep, Wood block, Cowbell (synthesized), Hi-hat, Ride bell (samples)
- [x] Accent, Normal, Soft and Off levels; subdivision clicks lower and at the subdivision volume; the beats volume
- [x] Settings changes (BPM, levels, sound, volumes) apply while playing
- [x] The playhead reports the metronome's bar and beat, by what is heard
- [x] Exercise playback behaves as before (existing tests pass)
