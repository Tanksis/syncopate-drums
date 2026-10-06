# 27: Follow the playback

**What to build:** During playback the note that is sounding is highlighted in the notation view, in time with what the drummer hears, and the view scrolls to keep the current line in view. The header shows the playback position: count-in, then bar · beat.

See [spec.md](../spec.md):
- the playback engine's (time → noteId, position) timeline
- the notation renderer's noteId → SVG element map and its rAF highlight loop, driven by `getOutputTimestamp()`

The highlight uses an internal latency offset (default 0). A setting for it is added only if the highlight drifts (see Further Notes in the spec).

**Blocked by:** 17 (Play the exercise with click and count-in)

**Status:** ready-for-agent

- [ ] The engine publishes a timeline of (time, noteId, position) for scheduled events
- [ ] A rAF loop outside React styles the sounding note from `getOutputTimestamp()` against the timeline, with an internal offset defaulting to 0
- [ ] The notation view scrolls the current line into view during playback
- [ ] The header shows count-in and bar · beat while playing
- [ ] By eye and ear on the user's laptop: the highlight lands with the sound, including across loop wraps
