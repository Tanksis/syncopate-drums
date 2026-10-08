# 03: Kick row from the keyboard

**What to build:** The editor cursor has a row. Tab switches rows (and j / k do in Normal mode), and every keyboard edit acts on the cursor's row. See [spec](../spec.md) stories 14, 15 and 24.

**Blocked by:** 02

**Status:** done (merged in PR #32, 2026-10-08)

- [x] The cursor has `row`; Tab toggles it in both modes; in Normal mode j moves to the kick row and k to the snare row. Tested
- [x] Figure keys, Space, Backspace, Delete, `T`, `.` and `r` act on the cursor's row. Tested: Tab then 2 gives two eighths in the kick row
- [x] `.` repeats on the current row. Tested
- [x] Clicking a cell moves the cursor to that beat and row
- [x] The cursor's row is marked on its card; the cheat sheet lists Tab and j / k
- [x] Checked in the browser (headless, real mouse and key events)

## Comments

- Where the spec was silent: a drag (not only a click) moves the cursor to its row. Every move and bar command keeps the row. Undo takes the cursor back to the row of the change, and redo returns it to where undo left it. Tab and j / k keep a bar selection in Normal mode. Shift+Tab switches rows too.
- The Figures palette lights the figure of the cursor's row, so the lit tile matches what a figure key would replace.
- Tab no longer moves focus between controls outside text fields, since the spec gives it to the row switch.
