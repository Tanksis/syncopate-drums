# 02: Accents: entered with the tool palette, drawn and played

**What to build:** A snare note can carry an accent (`dynamic: 'accent'`). The tool palette shows over the beat cards with **Hit** and **Accent**. With Accent held, tapping a hit toggles its accent, and tapping an empty snare cell adds an accented hit. The staff draws `>` just above the stem tip, level across a beam group. Accented notes play from the accent band. A marked cell shows `>` in small print. Export and import carry it, with a schema version bump. See [spec](../spec.md), stories 1-6 and 18, [ADR 0017](../../../docs/adr/0017-note-marks-entered-with-a-tool-palette.md), and the prototype's variant B (branch `prototype/note-marks`).

**Blocked by:** 01

**Status:** done, bar the by-ear check

- [x] `Note.dynamic?: 'accent'`; the mark edit (toggle, add the hit when empty, cleared with the hit, carried through copy, paste, duplicate and regrid), unit-tested
- [x] The schedule gives accented notes the accent level, unit-tested; the engine loads the accent band (files already in `public/samples`, see 01's comment) with the main load's error handling
- [x] `SCHEMA_VERSION` bumped; export and import with accents, an older version refusing, unit-tested
- [x] The palette on the desktop (over the cards) and the phone (top of the editor sheet); Hit held at first; disabled on an example
- [x] Drawn `>` close above the stem, checked in a close-up screenshot
- [x] Checked in the browser with real mouse clicks
- [ ] Left to the user: by ear, the accent band (vl24-vl30) against the normal notes
- [x] `CONTEXT.md`: Accent, Tool palette

## Comments

- 2026-10-26: Done. Notes for the later tickets:
  - An accented note is played by setting the scheduled event's existing `accent` flag, which the engine maps to the `snareAccent` band. Grace notes (05) need a third level, so that flag becomes a snare level then, as the spec's Schedule section says.
  - The `>` places itself: over the stem tip as the beam leaves it, and over the beam group's highest tip, so a group's accents are level. VexFlow's own placement works from the unbeamed stem and snaps to half lines. A triplet's "3" over accents sits a step above them. The beams are post-formatted before the notes draw, which leaves unaccented notation pixel-identical.
  - With a mark held, only a plain tap applies it: a drag still sets a hold and a long-press still flips the hand. A tap on a kick square still toggles a kick, since marks are snare-only.

