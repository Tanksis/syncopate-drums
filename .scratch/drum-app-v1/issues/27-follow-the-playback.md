# 27: Follow the playback

**What to build:** During playback the note that is sounding is highlighted in the notation view, in time with what the drummer hears, and the view scrolls to keep the current line in view. The header shows the playback position: count-in, then bar · beat.

See [spec.md](../spec.md):
- the playback engine's (time → noteId, position) timeline
- the notation renderer's noteId → SVG element map and its rAF highlight loop, driven by `getOutputTimestamp()`

The highlight uses an internal latency offset (default 0). A setting for it is added only if the highlight drifts (see Further Notes in the spec).

**Blocked by:** 17 (Play the exercise with click and count-in)

**Status:** done (merged in PR #16, 2026-10-06)

- [x] The engine publishes a timeline of (time, noteId, position) for scheduled events
- [x] A rAF loop outside React styles the sounding note from `getOutputTimestamp()` against the timeline, with an internal offset defaulting to 0
- [x] The notation view scrolls the current line into view during playback
- [x] The header shows count-in and bar · beat while playing
- [ ] By eye and ear on the user's laptop: the highlight lands with the sound, including across loop wraps

## Comments

- 2026-10-06: Squash-merged as PR #16. Choices where the spec was silent:
  - The lit note is the last one struck, and it stays lit until the next note, through rests and ties. No note is lit during the count-in.
  - The sounding note is green (a new `--color-play` token), so it differs from the blue cursor beat and the amber loop.
  - The view scrolls only when the playhead reaches a new line, or after a redraw while playing, so the drummer can still scroll by hand.
  - The header shows "count-in · 1" to "count-in · 4", then "bar · beat", both counted from 1. The position isn't kept in the store: the header reads the engine's `playhead()` in its own rAF loop, so the store doesn't change on every beat.
  - The latency offset is `HIGHLIGHT_LATENCY = 0` in `engine.ts`. There's no setting for it until the highlight drifts.
  - The by-ear-and-eye check on the user's laptop is still open.
- 2026-10-06: Follow-up PR #17 on the user's request: while playing, the notation no longer draws the blue cursor beat or bar shade, so only the green sounding note is lit. Both come back on stop; the beat strip still shows the cursor.
