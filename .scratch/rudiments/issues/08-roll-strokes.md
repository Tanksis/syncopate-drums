# 08: Roll strokes: doubles and buzz

**What to build:** A snare note can carry a roll stroke: a **double** or a **buzz**, which replace each other. The palette gains **Double** and **Buzz**. A double is drawn as one thin slash across the middle of the stem (below the beam on a beamed note) and plays two strokes, same hand, in the note's time. A buzz is drawn as a Z across the stem and plays from the buzz band. See [spec](../spec.md), story 9.

**Blocked by:** 02

**Status:** done

- [x] `Note.roll`; the edit replaces double with buzz and back, unit-tested
- [x] Schedule: a double's second stroke halfway through the note's time; a buzz's level, unit-tested
- [x] Export and import carry roll strokes
- [x] Drawn: the slash across the stem, the Z across the stem, checked in a close-up screenshot
- [ ] By ear left to the user: the buzz

The marks sit on the free stem between the top notehead and the beam (or flag), so on a chord with the hi-hat they go above the hi-hat's head. A double's second stroke isn't a struck note: it moves no playhead. An accented buzz plays from the same buzz strokes as an unaccented one.
