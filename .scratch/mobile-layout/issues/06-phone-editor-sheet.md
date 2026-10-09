# 06: Phone editor sheet

**What to build:** On the phone layout, Edit opens the grid editor as a sheet under the staff, and Done closes it. The sheet has the bar tabs, the bar menu, ↶ ↷, Done, and the cursor bar's beat cards two to a row. See [spec](../spec.md) stories 18–20, and the mockup linked from the spec.

**Blocked by:** 02, 03, 04, 05

**Status:** done

- [x] Edit, in the transport bar, opens the sheet over the lower ~55% of the screen. The notation stays visible above it and follows each edit, and Done closes it. It opens by button, not only by drag
- [x] The sheet header holds the bar tabs, ‹ › and +, the bar menu, ↶ ↷ and Done. The sheet scrolls inside if needed
- [x] Beat cards are two per row, with cells at least 44 px tall and the beat card menu from 02
- [x] Tap toggles a hit, drag sets a hold (including from beat 2 down into beat 3), and long-press flips the sticking
- [x] Playback can run with the sheet open, and the transport bar stays below it
- [x] Edit is hidden for an example, which shows the notation only
- [x] Checked in Playwright WebKit at 390 × 844 with touch: enter a bar, a hold across the row break, a long-press, undo, the bar menu, and a tie over the barline
