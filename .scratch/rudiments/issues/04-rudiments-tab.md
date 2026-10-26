# 04: The Rudiments tab, with the singles and the diddles

**What to build:** A third tab in the exercises sidebar, **Rudiments**, lists the 40 by PAS number and name under Rolls, Diddles, Flams and Drags. Only 1-3 (single stroke roll, four, seven) and 16-19 (single, double and triple paradiddle, paradiddle-diddle) open for now; the rest are listed greyed, marked "coming soon". A rudiment is read-only like an example, with its hands stored as overrides and always printed. Its notice reads as a rudiment's, and Copy to Library makes an ordinary exercise. On a rudiment the settings sidebar hides Sticking mode and Pattern. See [spec](../spec.md), stories 11-17, and the PAS list there.

**Blocked by:** 02, 03

**Status:** ready-for-agent

- [ ] `src/core/rudiments.ts`: a compact text form (hands and marks per note) parsed into exercises, unit-tested: bars add up, sticking matches PAS, Lead hand L mirrors, ends back on the starting hand
- [ ] The seven rudiments, each the fewest bars back to its starting hand, at a sensible tempo; the paradiddle-diddle in 8th triplets
- [ ] The tab, its family headings and the greyed "coming soon" rows; opening, playing, Copy to Library
- [ ] The sidebar on a rudiment: Lead hand, Swing, Feet; no Sticking mode or Pattern
- [ ] Checked in the browser with real mouse clicks, desktop and phone
- [ ] `CONTEXT.md`: Rudiment
