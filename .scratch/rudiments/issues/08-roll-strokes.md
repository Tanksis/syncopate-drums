# 08: Roll strokes: doubles and buzz

**What to build:** A snare note can carry a roll stroke: a **double** or a **buzz**, which replace each other. The palette gains **Double** and **Buzz**. A double is drawn as one thin slash across the middle of the stem (below the beam on a beamed note) and plays two strokes, same hand, in the note's time. A buzz is drawn as a Z across the stem and plays from the buzz band. See [spec](../spec.md), story 9.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] `Note.roll`; the edit replaces double with buzz and back, unit-tested
- [ ] Schedule: a double's second stroke halfway through the note's time; a buzz's level, unit-tested
- [ ] Export and import carry roll strokes
- [ ] Drawn: the slash across the stem, the Z across the stem, checked in a close-up screenshot
- [ ] By ear left to the user: the buzz
