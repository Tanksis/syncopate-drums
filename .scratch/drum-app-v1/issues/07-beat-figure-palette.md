# Beat figure palette

Type: grilling
Status: resolved
Blocked by: 05

## Question

Which **beat figures** go in the grid editor's palette, and how is each one entered?

Beat figures are the only way to enter a beat (see **Grid editor interaction**), so the palette must cover every one-beat figure in the lines the user practises from *Syncopation*. The prototype's 16 figures (10 straight, 6 triplet) are the starting list.

- Which straight figures (sixteenth grid) and triplet figures are needed? Check them against real lines from the book, including figures that start with a rest, such as `.x-x` and `.xxx`.
- How do the figures map to keys so that entering a line stays fast? The prototype uses number keys for straight figures and A–H for triplets.
- How are the figures laid out on screen, and how is the tie into a beat shown and toggled?
- Bar operations (add, duplicate, delete, copy and paste) and movement keys.

## Answer

Decided with the user in a grilling session (2026-10-05).

**Figures.** The palette holds **all 22 possible figures**, so it can't miss a figure in *Syncopation* or a later book. A figure is defined only by where its hits fall (`x` = hit, `.` = no hit). That gives 16 sixteenth-grid patterns plus the 6 triplet patterns a sixteenth grid can't write. Each note holds until the next hit or the end of the beat; the auto-speller writes the notes, rests, dots and ties.

**Cut short.** The **`.`** key toggles "cut short" on the current beat, which ends the beat's last note early and writes a rest after it. The note is cut to an eighth if it starts on 1 or & of a straight beat, otherwise to a sixteenth, and to one triplet eighth in a triplet beat. For example, `x...` cut gives an eighth then an eighth rest. Typing a new figure on the beat clears the cut.

**Tie.** **T** toggles a tie into the current beat (only allowed when the beat starts with a hit and the previous beat ends with a note). The beat box shows ⌒ and the notation view draws the tie. Typing a new figure keeps the tie if the new figure starts with a hit.

**Modes (vim-style).** The editor is modal and **opens in Insert mode**.
- **Insert mode**: figure keys enter a figure and advance to the next beat. Esc switches to Normal mode.
- **Normal mode**: vim commands. `i`/`a` switch back to Insert mode.
- **In both modes**: arrows, ←/→ by beat, ↑/↓ or Ctrl+←/→ by bar, Home/End, Backspace (rest + step back), Delete (rest, stay), Ctrl+Enter (add bar after), Ctrl+D (duplicate bar), Ctrl+Backspace (delete bar), Shift+←/→ (select bars), Ctrl+C/V (paste replaces from the current bar on), Ctrl+Z / Ctrl+Shift+Z. So a non-vim user can stay in Insert mode and never use vim.

**Insert-mode keys.** The on-screen palette copies this keyboard layout, and each tile shows its key.

```
Number row (most-used straight)
 1 x...   2 x.x.   3 ..x.   4 xxxx   5 x.xx
 6 xxx.   7 x..x   8 xx.x   9 .xxx   0 ..xx
Home row (triplets)
 A xxx    S x.x    D xx.    F .xx    G .x.    H ..x
Bottom row (rarer straight)
 Z .x..   X ...x   C .xx.   V .x.x   B xx..
Space = rest beat (....)   T = tie   . = cut short   ? = legend
```

The top letter row (Q W E R Y …) is left free for later commands.

**Normal-mode commands.** A beat is treated like a character and a bar like a word.
- `h`/`l` move by beat; `w`/`b` move by bar; `0`/`$` go to the start/end of the bar; `gg`/`G` go to the first/last bar.
- `x` turns the beat into a rest; `dd` deletes the bar; `yy` copies the bar; `p`/`P` paste after/before.
- `o`/`O` add an empty bar below/above and enter Insert mode.
- `V` selects whole bars, then `y`/`d`/`p` act on the selection.
- `u` undoes and `Ctrl+R` redoes; `.` repeats the last change; counts work (`3p`, `2dd`, `4l`).
- `r` + a figure key replaces one beat without leaving Normal mode.
- `j`/`k` are unused for now (later: move between wrapped staff lines).

**Legend.** A mode indicator (`-- INSERT --` / `-- NORMAL --`) sits next to the editor. **?** toggles a cheat-sheet panel listing the keys for the current mode.

**Mouse.** Clicking a palette tile enters that figure and advances; the current beat's figure is highlighted on its tile. Clicking a beat box or a note moves the cursor there. Clicking never changes the mode.

## Comments
- 2026-10-06: Amended by [Screen layout](10-screen-layout.md): vim keys can be turned off (app setting, on by default; off = no Normal mode). Play/stop is Ctrl+Space.
