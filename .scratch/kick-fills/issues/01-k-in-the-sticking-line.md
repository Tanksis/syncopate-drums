# 01: K in the sticking line

**What to build:** A kick that doesn't land with a hand shows K in the sticking line under the staff, in every sticking mode but off. See [spec](../spec.md) stories 21–23.

**Blocked by:** None (can start immediately)

**Status:** done (merged in PR #73, 2026-10-12)

- [x] Core: the sticking lists struck kick-row notes that don't share a tick with a struck snare note, shown as K; none with sticking off (tested)
- [x] A kick under a snare note shows only the hand (tested)
- [x] Kick notes carry no override, and long-press doesn't flip them
- [x] The notation draws K under those kicks, in line with the hands, in both themes
- [x] Checked in the browser at 1280 px and 390 × 844

## Comments

- `NoteSticking` is now a union, `HandSticking | KickSticking`, told apart by `row`. A K is a `KickSticking` with `shown: 'K'` and no override, rather than a `Hand | 'K'` widening of the hand fields. That keeps `Hand` the only type an override can take.
- A kick held under a tied snare continuation shows K, because no hand strikes at that tick.
- A K is drawn without a note id or hit area, so clicking or tapping it does nothing. `flipOverride` also ignores a kick id passed to it directly.
- Groove kicks get no K, because only the exercise's own kick row is labelled.
- At 390 px, a K a sixteenth before a hand sits close to it ("KL"). Two sixteenth hands get the same spacing today.
