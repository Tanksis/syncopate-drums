# 04: Drag a note's hold within its beat

**What to build:** The drummer presses on a note (its hit or its hold bar) and drags to set how long it is written to last: from one grid position up to just before the next hit or the end of the beat. A line can then be written exactly as the book prints it (for example sixteenth, sixteenth rest, eighth). See [spec](../spec.md) stories 20–23, 26–28, 30, 31, 33 and 34.

**Blocked by:** 02 (Click hits on grid positions)

**Status:** done (merged in PR #25, 2026-10-07)

- [x] New editor command: set a note's hold end at a grid position in its beat. It is clamped before the next hit, refuses a zero-length hold, is one undo step, and isn't repeated by `.`
- [x] Positions after a shortened note are empty and spelled as rests; the app still chooses notes, rests and dots
- [x] A beat whose holds aren't the figure's defaults has no figure (no palette tile lit); typing a figure key over it resets the holds
- [x] Holds don't change playback
- [x] The beat strip shows the hold live while dragging, snapped to grid positions. Release dispatches one command, and a press that doesn't move counts as a click
- [x] Core tests, e.g. shortening the first note of `x.x.` to one sixteenth gives sixteenth, sixteenth rest, eighth, and a drag past the next hit stops before it. Verified in the browser with a real mouse
