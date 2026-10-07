# 3. Entry: grid positions and drag-to-hold, with beat figures as the shortcut

Date: 2026-10-07

Status: accepted

v1 made beat figures the only way to enter a beat, after the step-grid variant (with drag-to-hold) lost in the grid-editor prototype ([ticket 05](../../.scratch/drum-app-v1/issues/05-grid-editor-interaction.md)). After using the palette for real, the user kept stopping to recall which key writes a rhythm ("is it 1 or 5?"), and preferred clicking where the hits fall. So the beat strip becomes the main editor: click a beat's grid positions to turn hits on and off, toggle a beat between the sixteenth and triplet grid, and drag a note to set its **hold** to any number of grid positions (up to the next hit, tying on across beats and bars). The figure keys stay as the keyboard and vim shortcut; the palette tiles fold away.

## Consequences

- A beat is no longer always one of the 22 beat figures plus a tie and a cut-short flag. A beat with custom holds has no figure; typing a figure key resets it to that figure's default holds.
- Spelling stays automatic: the drummer sets where hits fall and how long they are written to hold, and the speller still chooses notes, rests, dots and ties. The stored exercise shape does not change.
- The `T` and `.` keys keep working; there are no tie or cut-short controls on the beat box, since dragging does both.
