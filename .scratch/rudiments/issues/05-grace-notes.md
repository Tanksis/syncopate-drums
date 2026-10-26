# 05: Grace notes: flams and drags

**What to build:** A snare note can carry a grace: a **flam** (one) or a **drag** (two), which replace each other. The palette gains **Flam** and **Drag**. The grace notes are drawn small and close before their note: a flam with a slash, a drag beamed with no slur. They are played from the grace band a short fixed time ahead (about 25 ms for a flam; about 50 and 25 ms for a drag), by the other hand. The sticking prints them small before the main hand (`lR`, `llR`). See [spec](../spec.md), stories 4, 7, 8 and 15.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] `Note.grace`; the edit replaces flam with drag and back, unit-tested
- [ ] Schedule: grace events ahead of the note, grace level, not struck notes (no playhead, no beat lit), unit-tested
- [ ] Sticking: the grace hands, the other hand, mirrored with the Lead hand, unit-tested
- [ ] Export and import carry graces
- [ ] Drawn small, tucked, flam slashed, drag beamed with no slur, the sticking `lR` and `llR`: checked in a close-up screenshot
- [ ] By ear left to the user: the flam and drag spacing
