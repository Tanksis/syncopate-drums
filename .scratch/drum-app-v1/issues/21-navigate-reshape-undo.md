# 21: Move around and reshape the line, with undo

**What to build:** The drummer can get around the line and fix it from the keyboard or the mouse:
- ←/→ move by beat, ↑/↓ or Ctrl+←/→ move by bar, and Home/End jump
- Backspace turns the beat into a rest and steps back; Delete turns it into a rest in place
- Ctrl+Enter adds a bar after the current one, Ctrl+D duplicates it, and Ctrl+Backspace (or a ✕ on hover in the beat strip) deletes it
- Shift+←/→ selects bars; Ctrl+C / Ctrl+V copy and paste them (paste replaces from the current bar on)
- clicking a beat box or a note in the notation moves the cursor there, without changing the editor mode
- Ctrl+Z / Ctrl+Shift+Z undo and redo every change

See [spec.md](../spec.md): editor commands (`applyEdit` over exercise, cursor, selection, clipboard and undo/redo history).

**Blocked by:** 16 (Enter straight beat figures and see them on the staff)

**Status:** done (merged in PR #8, 2026-10-06)

- [x] All the moves, rest-and-back, rest-in-place, bar add/duplicate/delete, bar select, copy and paste-replaces are `applyEdit` commands, mapped from keys by the core's pure key map
- [x] The beat strip shows a ✕ on hover that deletes that bar, and shows the bar selection
- [x] Clicking a beat box or a note in the notation moves the cursor there; clicking never changes the editor mode
- [x] Undo/redo covers every editing command; tests cover command sequences (e.g. paste replaces later bars; delete then undo restores the bar)
- [x] Deleting the only bar leaves one bar of rests rather than an empty exercise

## Comments

- 2026-10-06: Squash-merged as PR #8. Choices where the spec was silent: Home/End jump to the first/last beat of the exercise; ↑/↓ and Ctrl+←/→ keep the beat; with nothing selected, Ctrl+C copies and Ctrl+Backspace deletes the cursor bar; copy keeps the selection; paste writes from the cursor bar and leaves the cursor on its first beat; bar operations cut ties that would run into a bar that was never tied into; undo restores bars and cursor, not BPM. Ctrl+C/V outside text fields no longer copy page text.
