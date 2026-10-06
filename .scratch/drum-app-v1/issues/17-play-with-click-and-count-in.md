# 17: Play the exercise with click and count-in

**What to build:** Pressing Ctrl+Space (or the play button) plays a one-bar count-in of clicks, then the exercise on the snare. The click sounds on every quarter note with beat 1 accented, and the whole exercise loops until stopped. The BPM can be set from 30 to 300 with a number box and a slider in the header; a change while playing takes effect almost at once without stopping. Playback stays sample-accurate on the user's Windows laptop with wired headphones.

See [spec.md](../spec.md): the core's `schedule`, and the playback engine:
- a Worker timer every ~25 ms schedules `start(when)` for the next ~100 ms
- Virtuosity Drums (CC0) samples and a synthesized click
- click / exercise / groove gains feeding a master gain

The [playback prototype](../prototypes/04-swing-groove-playback/index.html) is a reference.

**Blocked by:** 16 (Enter straight beat figures and see them on the staff)

**Status:** ready-for-agent

- [ ] The core's `schedule(exercise, practice settings, device settings, from position, window)` returns timed events for the count-in (one bar of clicks at negative bar indices, only on start), clicks on every quarter with beat 1 accented, and exercise notes on the exercise's voice, wrapping at the end of the exercise
- [ ] Musical position (bar, tick) is the source of truth; a BPM change affects only events not yet scheduled (tested)
- [ ] Tests cover the count-in, click accents, the loop wrap and a mid-play BPM change
- [ ] The engine loads the Virtuosity samples (snare, kick including feathered, ride, ride bell, hi-hat closed and pedal) and synthesizes the click. It keeps references to started sources so stop cancels them cleanly
- [ ] Ctrl+Space toggles playback from anywhere in the editor; the play button does the same
- [ ] The BPM number box and slider (30–300) write to the exercise's practice settings and apply live while playing
- [ ] By ear: steady timing over several minutes of looping, with no drift or dropouts
