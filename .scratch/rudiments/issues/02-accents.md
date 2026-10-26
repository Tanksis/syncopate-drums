# 02: Accents: entered with the tool palette, drawn and played

**What to build:** A snare note can carry an accent (`dynamic: 'accent'`). The tool palette shows over the beat cards with **Hit** and **Accent**. With Accent held, tapping a hit toggles its accent, and tapping an empty snare cell adds an accented hit. The staff draws `>` just above the stem tip, level across a beam group. Accented notes play from the accent band. A marked cell shows `>` in small print. Export and import carry it, with a schema version bump. See [spec](../spec.md), stories 1-6 and 18, [ADR 0017](../../../docs/adr/0017-note-marks-entered-with-a-tool-palette.md), and the prototype's variant B (branch `prototype/note-marks`).

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] `Note.dynamic?: 'accent'`; the mark edit (toggle, add the hit when empty, cleared with the hit, carried through copy, paste, duplicate and regrid), unit-tested
- [ ] The schedule gives accented notes the accent level, unit-tested
- [ ] `SCHEMA_VERSION` bumped; export and import with accents, an older version refusing, unit-tested
- [ ] The palette on the desktop (over the cards) and the phone (top of the editor sheet); Hit held at first; disabled on an example
- [ ] Drawn `>` close above the stem, checked in a close-up screenshot
- [ ] Checked in the browser with real mouse clicks; by ear left to the user
- [ ] `CONTEXT.md`: Accent, Tool palette
