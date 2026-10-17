# 06: The settings shift when the time signature changes

**What's wrong:** On the desktop, clicking between time signatures makes the settings sidebar's rows move around (the user reported it on 2026-10-17, after ticket 04). The settings under the Time group should stay where they are when the time signature changes.

**Blocked by:** none

**Status:** needs-triage

- [ ] Reproduce at 1280 (sidebar docked) and in the narrower overlay sidebar, switching 4/4 → 3/4 → 2/4 → 6/8 → 12/8
- [ ] Find what changes height or width, and keep the rows below it still
- [ ] Checked in the browser with real mouse events

## Comments

Suspects, from the code in `src/features/settings/SettingsSidebar.tsx` (not yet confirmed in the browser):

- `Swing`: in 6/8 and 12/8 the chips (one row) are replaced by the line "Not used in 6/8: each beat is already three eighths.". That line wraps to two lines in the sidebar's width, so everything under it moves.
- `TimeSignatureChoice`: the "beats in threes" hint appears only in compound time. It sits on the label's row, so it probably doesn't change the height, but check.
- `HihatFootChoice`: the chips go from five (4/4) to four (3/4, 2/4) to three (compound). The width is `fill`, so the height shouldn't change. The Pattern picker's name can also change, to None when a pattern doesn't fit.
- `PatternNoteLine` appears and disappears. A time-signature change that turns the pattern off hides the note.
- When the Practice pane's content gets taller than the window, a vertical scrollbar appears and narrows the column. That makes rows wrap differently. A horizontal scrollbar can also show up, because the Sticking row's Mode chips are about 12 px too wide at the docked sidebar's width (found during ticket 04).

A likely fix: give the Swing row a fixed height, or hold room for its tallest form. You could also use `scrollbar-gutter: stable` on the pane, as a Tailwind arbitrary property.
