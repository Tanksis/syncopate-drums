# 03: Kick row from the keyboard

**What to build:** The editor cursor has a row. Tab switches rows (and j / k do in Normal mode), and every keyboard edit acts on the cursor's row. See [spec](../spec.md) stories 14, 15 and 24.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] The cursor has `row`; Tab toggles it in both modes; in Normal mode j moves to the kick row and k to the snare row. Tested
- [ ] Figure keys, Space, Backspace, Delete, `T`, `.` and `r` act on the cursor's row. Tested: Tab then 2 gives two eighths in the kick row
- [ ] `.` repeats on the current row. Tested
- [ ] Clicking a cell moves the cursor to that beat and row
- [ ] The cursor's row is marked on its card; the cheat sheet lists Tab and j / k
