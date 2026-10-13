# 04: Kicks in the gaps

**What to build:** "Kicks in the gaps: this bar" and "…: every bar" in the bar ⋯ menu turn every grid position where neither row strikes into a kick, on the grid each beat is already on. See [spec](../spec.md) stories 16–20.

**Blocked by:** None (can start immediately)

**Status:** done (merged in PR #78, 2026-10-13)

- [x] Core: `RLRL RL.L RLR. RLRL` becomes kicks on the 7th and 12th sixteenths, with the snare row unchanged (tested)
- [x] Core: a triplet beat gets kicks on its empty triplet positions (tested)
- [x] Core: a hold covering a gap is cut short there, and an empty beat gets four sixteenth kicks (tested)
- [x] Core: the sticking mode and overrides are untouched, and each action is one undo step (tested)
- [x] Both items in the bar ⋯ menu, hidden on examples
- [x] Checked in the browser at 1280 px and 390 × 844

## Comments

Choices where the spec was silent or ambiguous:

- The menu items name the bar ("Kicks in the gaps: bar 2") as their neighbours do, rather than "this bar".
- A beat switched to trip while still empty (the editor's pending grid) gets triplet kicks. "On the grid that beat is already on" was taken to win over "an empty beat is on the sixteenth grid". That line still holds for any empty beat that wasn't switched.
- A tied-over continuation isn't struck, so a gap on a tied downbeat gets a kick and the tie is cut.
- A hold cut short stops at the end of its beat. A note tied on into a bar outside the action is struck there, so that bar still sounds as before.
- "This bar" moves the cursor to the bar's first beat, as Fill with pattern does. "Every bar" leaves the cursor where it is.
