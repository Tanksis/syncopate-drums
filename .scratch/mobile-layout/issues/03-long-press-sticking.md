# 03: Long-press a hit to flip its sticking

**What to build:** Holding a pointer on a snare hit for 500 ms, without moving, flips its sticking (a sticking override). A short tap still toggles the hit and a drag still sets the hold. See [spec](../spec.md) stories 10–11.

**Blocked by:** 01

**Status:** done

- [x] A press held 500 ms within a few pixels on a snare-row hit dispatches `flipOverride` for that note, and the release doesn't toggle the hit or set a hold
- [x] Moving past the threshold before 500 ms starts a hold drag as now. Releasing earlier toggles as now
- [x] It does nothing on a rest, on the kick row, with sticking off, or on an example
- [x] Some feedback shows the long-press took (for example, the hand on the cell flashes)
- [x] The cells suppress iOS's callout and text selection
- [x] Clicking a hand on the notation still flips it
- [x] Checked in the browser with real mouse events (press, wait, release) and in Playwright WebKit with touch (see below: WebKit's touch hold is left to the iPhone)

**Decided while building:** the core gained `stickingNoteAt(state, point)`, the id of the snare note struck at a grid position whose hand shows (null on a rest, a hold, the kick row or with sticking off), so the card arms a long-press only where it would flip. With nothing to flip (a rest, the kick row, sticking off), a long press releases as an ordinary click and toggles the hit, the same as a short tap. On an example the long-press isn't armed. Within the 8 px slop, movement (even over the cell's edge) still counts as holding still, and a release there is a click, not a drag. The cell flashes the new hand (R or L) for 0.7 s. Cells also block the context menu, so Android's long-touch menu doesn't open over it. Browser check: Chromium at 1280 and 900 and WebKit at 390×844 with a real mouse, Chromium phone emulation with real touch (long-press, tap, hold drag), and WebKit with touch taps. Playwright has no touch hold on WebKit, so a touch long-press on the iPhone is for the user to check.
