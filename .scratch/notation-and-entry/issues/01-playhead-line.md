# 01: Playhead line

**What to build:** During playback, a playhead line runs across the staff and jumps to each hit as it sounds, from the exercise and the groove layer alike. The drummer can then see where they are in the count even when the line rests and only the ride or hi-hat plays. Sounding notes are no longer coloured. See [spec](../spec.md) stories 38–43.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The playback timeline records exercise and groove hits (not clicks, not the count-in) as staff hits, each with its position (bar, tick)
- [ ] `playheadAt` reports the latest staff hit's position. Tested in the core: in a jazz groove with the line resting, at the ride's & of 2 the playhead is at bar 1, tick 18; a click-only moment doesn't move it
- [ ] The notation view draws a vertical line across the staff at that position, in time with what is heard (the same audio-clock timing as the v1 highlight)
- [ ] The sounding-note colour is gone; the cursor-beat highlight while editing is unchanged
- [ ] The view still scrolls to keep the playhead's line in view
- [ ] Checked in the browser on a jazz-groove exercise with rests: the line moves on every ride, hi-hat foot and snare hit
