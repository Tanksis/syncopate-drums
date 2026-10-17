# 06: The settings shift when the time signature changes

**What's wrong:** On the desktop, clicking between time signatures makes the settings sidebar's rows move around (the user reported it on 2026-10-17, after ticket 04). The settings under the Time group should stay where they are when the time signature changes.

**Blocked by:** none

**Status:** done

- [x] Reproduce at 1280 (sidebar docked) and in the narrower overlay sidebar, switching 4/4 → 3/4 → 2/4 → 6/8 → 12/8
- [x] Find what changes height or width, and keep the rows below it still
- [x] Checked in the browser with real mouse events

## Comments

Suspects, from the code in `src/features/settings/SettingsSidebar.tsx` (not yet confirmed in the browser):

- `Swing`: in 6/8 and 12/8 the chips (one row) are replaced by the line "Not used in 6/8: each beat is already three eighths.". That line wraps to two lines in the sidebar's width, so everything under it moves.
- `TimeSignatureChoice`: the "beats in threes" hint appears only in compound time. It sits on the label's row, so it probably doesn't change the height, but check.
- `HihatFootChoice`: the chips go from five (4/4) to four (3/4, 2/4) to three (compound). The width is `fill`, so the height shouldn't change. The Pattern picker's name can also change, to None when a pattern doesn't fit.
- `PatternNoteLine` appears and disappears. A time-signature change that turns the pattern off hides the note.
- When the Practice pane's content gets taller than the window, a vertical scrollbar appears and narrows the column. That makes rows wrap differently. A horizontal scrollbar can also show up, because the Sticking row's Mode chips are about 12 px too wide at the docked sidebar's width (found during ticket 04).

A likely fix: give the Swing row a fixed height, or hold room for its tallest form. You could also use `scrollbar-gutter: stable` on the pane, as a Tailwind arbitrary property.

Reproduced on 2026-10-17 at 1920 × 919: every row under Swing moved down 5 px in 6/8 and 12/8, where Swing's note wrapped to two lines. The Practice pane also scrolled both ways: General took up to 55% of the sidebar, and the Sticking Mode chips beside their name were 8 px wider than the column.

Fixed together with ticket 07, which moved General out of the sidebar:

- In compound time, Swing keeps its chips, dimmed and disabled, with "not used in 6/8" on the name's row (as "beats in threes" is), and a Custom slider stays, dimmed and inert. The rows under it no longer move across 4/4, 3/4, 2/4, 6/8 and 12/8, with or without Custom open.
- Sticking's Mode is stacked, its name over full-width chips, so the column has no horizontal scroll.
- The sidebar keeps the scrollbar's room (`scrollbar-gutter: stable`), so a scrollbar coming or going doesn't re-wrap the rows; its right padding is less, so the rows sit nearly centred.

Checked headless (Playwright, real mouse events, on a new exercise) at 1280 × 800, 1366 × 768 and 1920 × 1080 docked, and 900 × 700 in the overlay sidebar: the rows hold still at each, with or without Custom swing open, and the Practice settings fit with no scrollbar. The Metronome screen's settings, with Sound now under Subdivision, fit too.

Left over: between about 1000 and 1258 px wide with both sidebars docked, the exercise's bar is too narrow for the whole transport, so the Click, Count-in and loop chips move to a Playback group at the top of the sidebar, which then scrolls by 18 px at 1200 × 800 and 50 px at 1100 × 768. A middle step that moved only the loop chip would mostly close it; not done here.
