# 31: Vim Normal mode and the cheat sheet

**What to build:** The grid editor is modal for vim users. It opens in Insert mode; Esc goes to Normal mode, and `i`/`a` return to Insert.

Normal mode treats a beat like a character and a bar like a word:
- moves: `h`/`l`, `w`/`b`, `0`/`$`, `gg`/`G`
- edits: `x`, `dd`, `yy`, `p`/`P`, `o`/`O`, and `r` + a figure key to replace one beat
- bar selection: `V` with `y`/`d`/`p`
- `u` / Ctrl+R to undo and redo, `.` to repeat, and counts such as `3p` and `2dd`

A `-- INSERT --` / `-- NORMAL --` indicator sits next to the editor. Vim keys can be turned off in the Editor sidebar group (a per-device setting). With vim keys off there's no Normal mode, Esc does nothing and the indicator is hidden, while the keys that work in both modes keep working. `?` toggles a cheat sheet of the keys for the current mode.

See [spec.md](../spec.md): editor commands and the pure key → command mapping, including the vim-keys-off variant.

**Blocked by:** 21 (Move around and reshape the line, with undo), 18 (Exercise autosaves and reopens at launch)

**Status:** ready-for-agent

- [ ] The core's key map handles both modes and the vim-keys-off variant; Normal-mode commands are `applyEdit` commands with counts and `.` repeat
- [ ] Tests: `2dd` then `u` restores both bars; `3p` pastes three times; `r` + a figure key replaces one beat; `.` repeats the last change; with vim keys off, Esc does nothing and the arrows, Backspace, Delete and Ctrl shortcuts still work
- [ ] The mode indicator shows the current mode and is hidden with vim keys off
- [ ] The vim-keys setting lives in the device-settings store
- [ ] `?` toggles a cheat sheet listing the keys for the current mode
- [ ] Clicking never changes the mode; Ctrl+Space and Alt+1–4 work in both modes
