# 02: The ghost-note groove example

**What to build:** The Examples tab gains "Example: ghost-note groove": a one- or two-bar 16th-note groove with accented backbeats on 2 and 4 and ghosted sixteenths around them, over a hi-hat pattern and a kick. The examples' text form gains snare marks for it: `>` before a hit for an accent, `(x)` for a ghost. See [spec](../spec.md), story 8.

**Blocked by:** 01

**Status:** done (merged in PR #171, 2026-10-30)

- [x] The examples' text form reads `>` and `(x)` on the snare row, unit-tested
- [x] The example, its bars adding up and its marks where written, unit-tested
- [x] Checked in a close-up screenshot, and opened and played from the Examples tab

## Comments

The groove is two bars at 80 bpm over the hi-hat eighths. The text form writes `>x` and `(x)`, and a mark on the kick row throws. The rudiments' and the examples' text forms now share `markStruckSnare` (speller), which throws if the marks don't match the struck notes. The browser check was headless (Playwright), as the Chrome extension wasn't connected: the example opened from the Examples tab, and Play ran the count-in with no console errors. Listening to the groove is left to the user.
