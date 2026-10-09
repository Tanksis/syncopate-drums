# 9. Entry is the grid only: beat figures, vim keys and cut short go

Date: 2026-10-09

Status: accepted (finishes what [ADR 0003](0003-grid-positions-and-drag-to-hold.md) started; reverses its "the figure keys stay as the keyboard and vim shortcut")

ADR 0003 made the grid the main editor and kept the beat figures (the palette, their keys, and vim's `r` + figure key) as a keyboard shortcut. In use, the user enters everything on the grid and never reaches for the figures, and didn't know what Tie and Cut short did. The phone layout ([mobile-layout spec](../../.scratch/mobile-layout/spec.md)) would otherwise need touch versions of all of them. So entry becomes the grid alone, on every screen size:

- **Beat figures leave the interface.** The figures panel, the keycap badge on each beat card, the legend line under the cards, and the figure keys (`1`–`0`, `Z X C V B`, `A S D F G H`, `-`) all go. The core keeps the figures internally, because the speller still uses them to tell a beat's default holds.
- **Vim keys go**, with Normal mode, the mode line and the `vim on/off` switch, since vim was mostly built on figure keys and was already off by default.
- **Cut short goes as a command.** Dragging a note's hold to one grid position does the same.
- **Tie survives only over a barline**, as "Tie over the barline" in a bar's first beat's menu. Inside a bar, dragging the hold ties across beats. Over a barline it can't, because the grid editor shows one bar at a time.

## Consequences

- The keyboard keeps moving the cursor, `Tab`, `Backspace`/`Delete` to rest a beat, the bar keys (select, copy, paste, add, duplicate, delete), undo and redo, and Space. The `?` cheat sheet lists only those.
- Stored exercises don't change. A beat cut short or tied by the old commands keeps its spelling. Its hold can be changed by dragging, and a tie inside a bar can be undone by dragging the hold back.
- The `vimKeys` and `figuresPanelOpen` device settings are no longer read. A stored value is ignored.
- Grid switching and sticking flips need controls that aren't a right-click or a key (a beat menu and a long-press), which the mobile-layout spec adds on every screen size.
