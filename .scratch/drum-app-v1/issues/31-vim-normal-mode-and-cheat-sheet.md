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

**Status:** done (merged in PR #22, 2026-10-07)

- [x] The core's key map handles both modes and the vim-keys-off variant; Normal-mode commands are `applyEdit` commands with counts and `.` repeat
- [x] Tests: `2dd` then `u` restores both bars; `3p` pastes three times; `r` + a figure key replaces one beat; `.` repeats the last change; with vim keys off, Esc does nothing and the arrows, Backspace, Delete and Ctrl shortcuts still work
- [x] The mode indicator shows the current mode and is hidden with vim keys off
- [x] The vim-keys setting lives in the device-settings store
- [x] `?` toggles a cheat sheet listing the keys for the current mode
- [x] Clicking never changes the mode; Ctrl+Space and Alt+1–4 work in both modes

## Comments

- A bar selection in Normal mode acts as vim's Visual Line mode (the indicator shows `-- VISUAL LINE --`): `V` starts it, moves extend it, `y`/`d`/`x`/`p` act on it and end it, and Esc or `V` ends it. Shift+←/→ make the same selection.
- Choices where the spec was silent, made to follow vim:
  - Esc steps back onto the last beat typed.
  - `a` goes to Insert mode on the next beat.
  - `p`/`P` insert the yanked bars after or before the cursor bar, while Ctrl+V still pastes over from the cursor bar.
  - `x` rests beats in place rather than shifting the later ones.
  - `o`/`O` open a bar of rests and enter Insert mode.
  - `3G`/`3gg` go to bar 3.
  - Ctrl+R redoes only in Normal mode, so in Insert mode it is left to the browser.
- How `.` repeats a change:
  - It repeats the last change to the bars at the cursor, and a count given to `.` replaces the original count.
  - A figure typed in Insert mode is repeated in place, as `r` does. vim would repeat the whole insert.
  - `.` never changes the mode.
- Counts are capped at 100.
- Vim keys default to on.
- Turning vim keys off while in Normal mode puts the editor back in Insert mode. This is the one case where a click changes the mode.
- The indicator shows any pending keys (such as `2d`) after the mode.
- The cheat sheet's lists live in `src/features/editor/keyHelp.ts`, kept in step with the core's key map by hand.
- Caps Lock letters are not read as Shift+letter in Normal mode.
