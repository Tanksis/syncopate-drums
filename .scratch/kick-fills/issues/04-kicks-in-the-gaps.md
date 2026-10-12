# 04: Kicks in the gaps

**What to build:** "Kicks in the gaps: this bar" and "…: every bar" in the bar ⋯ menu turn every grid position where neither row strikes into a kick, on the grid each beat is already on. See [spec](../spec.md) stories 16–20.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Core: `RLRL RL.L RLR. RLRL` becomes kicks on the 7th and 12th sixteenths, with the snare row unchanged (tested)
- [ ] Core: a triplet beat gets kicks on its empty triplet positions (tested)
- [ ] Core: a hold covering a gap is cut short there, and an empty beat gets four sixteenth kicks (tested)
- [ ] Core: the sticking mode and overrides are untouched, and each action is one undo step (tested)
- [ ] Both items in the bar ⋯ menu, hidden on examples
- [ ] Checked in the browser at 1280 px and 390 × 844
