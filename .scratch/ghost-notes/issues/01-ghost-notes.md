# 01: Ghost notes: entered, drawn and played

**What to build:** A snare note can be a ghost (`dynamic: 'ghost'`), the other of the accent: choosing one replaces the other. The palette gains **Ghost** after Accent, glyph `( )`. A ghost is drawn with parentheses round its notehead and plays from a new ghost band, under the grace band; a ghosted double or buzz plays soft, its grace notes at the grace level. Export and import carry it, with a schema version bump. See [spec](../spec.md), stories 1-7.

**Blocked by:** none

**Status:** ready-for-agent

- [x] `Dynamic` gains `ghost`; ghost and accent replace each other, carried through copy and regrid, cleared with the hit, unit-tested
- [x] Schedule: the ghost level for a plain, doubled and buzzed note, grace events staying `grace`, unit-tested
- [x] The engine's ghost band (vl5-vl9; vl5-vl7 added to `public/samples` from Virtuosity Drums and to `LICENSE.txt`), loaded like the other bands
- [x] `SCHEMA_VERSION` bumped; export and import with ghosts, an older version refusing, unit-tested
- [x] Drawn with parentheses round the notehead (the snare head only on a chord), checked in a close-up screenshot alone, beamed and with each other mark; the notation doesn't move when toggled
- [x] The Ghost tool, checked with real mouse clicks on the desktop and the phone
- [x] `CONTEXT.md`: Ghost note
- [ ] By ear, left to the user: the ghost band against normal and grace notes
