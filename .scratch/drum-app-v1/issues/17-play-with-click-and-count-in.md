# 17: Play the exercise with click and count-in

**What to build:** Pressing Ctrl+Space (or the play button) plays a one-bar count-in of clicks, then the exercise on the snare. The click sounds on every quarter note with beat 1 accented, and the whole exercise loops until stopped. The BPM can be set from 30 to 300 with a number box and a slider in the header; a change while playing takes effect almost at once without stopping. Playback stays sample-accurate on the user's Windows laptop with wired headphones.

See [spec.md](../spec.md): the core's `schedule`, and the playback engine:
- a Worker timer every ~25 ms schedules `start(when)` for the next ~100 ms
- Virtuosity Drums (CC0) samples and a synthesized click
- click / exercise / groove gains feeding a master gain

The [playback prototype](../prototypes/04-swing-groove-playback/index.html) is a reference.

**Blocked by:** 16 (Enter straight beat figures and see them on the staff)

**Status:** in-review (on `feature/17-play-with-click-and-count-in`)

- [x] The core's `schedule(exercise, practice settings, device settings, from position, window)` returns timed events for the count-in (one bar of clicks at negative bar indices, only on start), clicks on every quarter with beat 1 accented, and exercise notes on the exercise's voice, wrapping at the end of the exercise
- [x] Musical position (bar, tick) is the source of truth; a BPM change affects only events not yet scheduled (tested)
- [x] Tests cover the count-in, click accents, the loop wrap and a mid-play BPM change
- [x] The engine loads the Virtuosity samples (snare, kick including feathered, ride, ride bell, hi-hat closed and pedal) and synthesizes the click. It keeps references to started sources so stop cancels them cleanly
- [x] Ctrl+Space toggles playback from anywhere in the editor; the play button does the same
- [x] The BPM number box and slider (30–300) write to the exercise's practice settings and apply live while playing
- [ ] By ear: steady timing over several minutes of looping, with no drift or dropouts

## Comments

- 2026-10-06: Implemented on `feature/17-play-with-click-and-count-in`. Core: `schedule.ts` walks tick by tick from a `PlayPosition` (or `'start'`, which adds the count-in at bar -1 when `DeviceSettings.countIn` is on) and returns the events plus the first unscheduled position and its time offset. The engine passes that position back on the next tick, so a BPM change applies from the next unscheduled tick (tested at a quarter of the way into a beat). Each event carries its position for ticket 27. Tied continuations are already skipped (via `placeItems`); ticket 20 adds the test. Engine: `features/playback/engine.ts`, with a Worker tick every 25 ms, a 100 ms lookahead, click/exercise/groove gains into a master gain, onset-trimmed Virtuosity overhead samples in `public/samples/` (CC0, see LICENSE.txt), round-robin, and a synthesized click. A stall longer than the lookahead resumes from the current time rather than playing a burst. Header: play button, BPM box (applies once no further digit could follow, so typing 300 doesn't pass through 30) and slider. Ctrl+Space works even from inside the BPM box. Checked in Chrome with `AudioNode.start` instrumented: count-in clicks 0.75 s apart at 80 BPM, then `2 3 7` notes at the right offsets, clicks exactly 0.300 s apart after typing 200 while playing, no late starts, and stop cancels. Not yet checked by ear over several minutes on the Windows laptop with wired headphones; that box is left for the user.
