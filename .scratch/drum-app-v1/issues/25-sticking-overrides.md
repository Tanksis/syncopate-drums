# 25: Sticking overrides

**What to build:** The drummer can override the computed sticking note by note.
- **Setting overrides:** clicking an R/L under a note sets the opposite hand as a sticking override; clicking again clears it. Alt+1–4 flips the 1st–4th struck note of the cursor beat (rests and tied continuations not counted), in any editor mode.
- **Display:** overrides are printed in an accent colour, with the hover hint "override, click to reset".
- **Scope:** an override changes only its own note.
- **Surviving edits:** an override survives edits to the notes around it and a duration change on its own note. It is dropped only when its note is deleted or turned into a rest.
- **Modes and voice:** overrides are kept when the sticking mode changes. They are hidden but kept when sticking is off or the voice is bass drum, and clicks do nothing then.
- **Reset:** "Reset overrides (n)" in the Sticking group clears them all; it is disabled at zero.
- **Undo:** each flip and each reset is one undo step.

See [spec.md](../spec.md): overrides ride on the note's start position through a re-spell; editor commands for override flip and reset.

**Blocked by:** 24 (Sticking modes, lead hand and voice), 21 (Move around and reshape the line, with undo)

**Status:** ready-for-agent

- [ ] `applyEdit` has an override-flip command for struck note n of the cursor beat and a reset command; each is one undo step (tested)
- [ ] Tests: an override leaves its neighbours' computed hands unchanged; it survives re-entering a neighbouring beat and a duration change on its own note; it is dropped when its beat becomes a rest; it is kept across mode switches
- [ ] Clicking an R/L in the notation flips or clears it; Alt+1–4 works in every mode
- [ ] Overrides show in the accent colour with the hover hint; under off or bass drum they're hidden and clicks do nothing
- [ ] "Reset overrides (n)" shows the count, is disabled at zero, and clears all overrides in one undoable step
- [ ] A sticking flip counts as a change for autosave and for the unchanged-new rule
