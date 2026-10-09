# 03: Long-press a hit to flip its sticking

**What to build:** Holding a pointer on a snare hit for 500 ms, without moving, flips its sticking (a sticking override). A short tap still toggles the hit and a drag still sets the hold. See [spec](../spec.md) stories 10–11.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] A press held 500 ms within a few pixels on a snare-row hit dispatches `flipOverride` for that note, and the release doesn't toggle the hit or set a hold
- [ ] Moving past the threshold before 500 ms starts a hold drag as now. Releasing earlier toggles as now
- [ ] It does nothing on a rest, on the kick row, with sticking off, or on an example
- [ ] Some feedback shows the long-press took (for example, the hand on the cell flashes)
- [ ] The cells suppress iOS's callout and text selection
- [ ] Clicking a hand on the notation still flips it
- [ ] Checked in the browser with real mouse events (press, wait, release) and in Playwright WebKit with touch
