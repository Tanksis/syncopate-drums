# 02: Click hits on grid positions

**What to build:** The beat strip becomes the main editor. Each beat box shows its grid positions, and the drummer clicks a position to turn a hit on or off instead of recalling a figure key. Holds are drawn as bars, and empty beats look empty. The palette tiles fold into a "Figures" panel that is closed by default. This ticket covers the sixteenth grid only; triplet beats keep working through the keys. See [spec](../spec.md) stories 1–14, 32, 35–37, and [ADR 0003](../../../docs/adr/0003-grid-positions-and-drag-to-hold.md).

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The beat view reports each grid position as hit, hold or empty, derived from the speller's timeline; tested in the core
- [ ] New editor command: toggle a hit at (bar, beat, position). It moves the cursor to that beat without advancing, is one undo step, works in Insert and Normal mode without changing the mode, and is not the change `.` repeats
- [ ] A new hit holds until the next hit or the end of the beat; one placed inside another note's hold splits that hold
- [ ] Removing a hit that the previous note ran up to lets that note hold on (removing the & of `x.x.` gives figure `1`); removing one after a shortened note leaves the span empty
- [ ] Removing a note drops its sticking override; clicking the downbeat of a tied-into beat strikes it again; removing a downbeat removes the tie into that beat
- [ ] Each beat box draws four positions: hits, hold bars and plain empty dots, with no "rest" label. The ⌒ mark stays
- [ ] The palette tiles live in a collapsible "Figures" panel, closed by default. Its open state is a new per-device setting (defaults merged in, no migration). Figure keys, `T`, `.`, Space and the cheat sheet are unchanged
- [ ] Core tests cover the command sequences above; clicks are verified in the browser with a real mouse (pointer hit-testing, not dispatched events)
