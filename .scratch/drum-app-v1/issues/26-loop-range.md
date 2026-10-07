# 26: Loop range

**What to build:** Clicking a bar number above the staff loops just that bar. Shift+clicking another bar number extends the loop range, and an "all" control in the header resets it to the whole exercise. The loop range is shaded in the beat strip and shown in the header. A change while playing applies at the next wrap, or right away if the playhead is already past the new end. In a narrowed range, sticking plays as printed. The loop range is remembered per exercise.

See [spec.md](../spec.md): `schedule` (loop range with wraparound, live loop changes).

**Blocked by:** 17 (Play the exercise with click and count-in)

**Status:** done (merged in PR #14, 2026-10-06)

- [x] `schedule` honours a loop range: playback wraps from its end to its start, and the count-in is not repeated on wraps (tested)
- [x] Tests cover a loop change applying at the next wrap, and at once when the playhead is past the new end
- [x] Bar-number click and Shift+click set the range; "all" resets it
- [x] The beat strip shades the range; the header shows it
- [x] The loop range is stored in the exercise's practice settings, autosaves and comes back on reopen. Editing bars keeps it valid (it's clamped if bars are deleted)

## Comments

- 2026-10-06: Squash-merged as PR #14. Choices where the spec was silent:
  - Shift+click with no range set loops just that bar. Shift+click only grows the range (to the smallest span that includes the clicked bar), so it can't shrink it. A plain click starts a new range.
  - The range does more than get clamped: it moves with its bars when bars are added, duplicated or deleted before it, and grows or shrinks when that happens inside it. If all of its bars are deleted, the whole exercise loops again. Undoing or redoing a change that added or removed bars brings the range back with them. Setting the range is not an undo step, like BPM.
  - If the playhead is before a new range, it plays on into the range, which counts as "the next wrap"; only a playhead past the new end jumps at once. That jump can land mid-bar, at the next scheduler tick.
  - Starting playback with a range set counts in, then starts at the range's first bar.
  - The loop colour is amber, as new `--color-loop*` tokens, so it differs from the blue selection. Bars in the range get bold amber numbers in the notation too. "all" shows only while a range is set, and the readout says "all bars" otherwise.
  - Bar numbers are now drawn by `staff.ts` rather than VexFlow's `setMeasure`, so each has a click target.
  - There's no separate sticking test for a narrowed range: `sticking` never reads the range, so a test would only restate that.
