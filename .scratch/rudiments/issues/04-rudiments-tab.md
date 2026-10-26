# 04: The Rudiments tab, with the singles and the diddles

**What to build:** A third tab in the exercises sidebar, **Rudiments**, lists the 40 by PAS number and name under Rolls, Diddles, Flams and Drags. Only 1-3 (single stroke roll, four, seven) and 16-19 (single, double and triple paradiddle, paradiddle-diddle) open for now; the rest are listed greyed, marked "coming soon". A rudiment is read-only like an example, with its hands stored as overrides and always printed. Its notice reads as a rudiment's, and Copy to Library makes an ordinary exercise. On a rudiment the settings sidebar hides Sticking mode and Pattern. See [spec](../spec.md), stories 11-17, and the PAS list there.

**Blocked by:** 02, 03

**Status:** done

- [x] `src/core/rudiments.ts`: a compact text form (hands and marks per note) parsed into exercises, unit-tested: bars add up, sticking matches PAS, Lead hand L mirrors, ends back on the starting hand
- [x] The seven rudiments, each the fewest bars back to its starting hand, at a sensible tempo; the paradiddle-diddle in 8th triplets
- [x] The tab, its family headings and the greyed "coming soon" rows; opening, playing, Copy to Library
- [x] The sidebar on a rudiment: Lead hand, Swing, Feet; no Sticking mode or Pattern
- [x] Checked in the browser with real mouse clicks, desktop and phone
- [x] `CONTEXT.md`: Rudiment

## Comments

- 2026-10-26: Done. Notes for the later tickets:
  - The text form is in `rudiments.ts`: a beat is four sixteenth slots or three triplet-eighth slots, `.` or a hand after its marks (`>` so far). Tickets 05 and 08 add their marks to `SLOT` and to `writeBars`.
  - The singles four and seven are written in triplet eighths, since the grid has no sixteenth triplets: a group of three and the accented note on the next beat.
  - A rudiment is read-only through `isBuiltIn` and `builtInAccepts`, which also takes a change of Lead hand alone. Its hands print in plain ink, not the override colour: they're the rudiment, not changed hands. A Library copy prints them as overrides, in the accent colour, with "Reset N changed hands".
