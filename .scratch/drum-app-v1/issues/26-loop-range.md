# 26: Loop range

**What to build:** Clicking a bar number above the staff loops just that bar. Shift+clicking another bar number extends the loop range, and an "all" control in the header resets it to the whole exercise. The loop range is shaded in the beat strip and shown in the header. A change while playing applies at the next wrap, or right away if the playhead is already past the new end. In a narrowed range, sticking plays as printed. The loop range is remembered per exercise.

See [spec.md](../spec.md): `schedule` (loop range with wraparound, live loop changes).

**Blocked by:** 17 (Play the exercise with click and count-in)

**Status:** ready-for-agent

- [ ] `schedule` honours a loop range: playback wraps from its end to its start, and the count-in is not repeated on wraps (tested)
- [ ] Tests cover a loop change applying at the next wrap, and at once when the playhead is past the new end
- [ ] Bar-number click and Shift+click set the range; "all" resets it
- [ ] The beat strip shades the range; the header shows it
- [ ] The loop range is stored in the exercise's practice settings, autosaves and comes back on reopen. Editing bars keeps it valid (it's clamped if bars are deleted)
