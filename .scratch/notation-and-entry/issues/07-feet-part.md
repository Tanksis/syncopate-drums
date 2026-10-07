# 07: Feet part: bass drum lines with the groove

**What to build:** A bass drum exercise is written in the **feet part**, stems down, alongside the groove's hi-hat foot and bass drum. Where the exercise and the feathered bass drum hit the same position, it is one notehead and one sound. See [spec](../spec.md) stories 45 and 51.

**Blocked by:** 06 (Hands part: snare stems up, merged with the groove)

**Status:** ready-for-agent

- [ ] The staff parts put bass drum exercise notes in the feet part, with rests only where nothing in the feet part sounds or is held; the hands part (groove only) shows no rests
- [ ] An exercise bass drum hit and a groove bass drum hit at the same tick become one note (the exercise's), and the schedule plays one bass drum there
- [ ] Sticking stays hidden under the bass drum voice, and overrides are kept
- [ ] Core tests (e.g. a bass drum exercise on beat 1 with the feathered preset gives one bass drum in the feet part and one scheduled bass drum event); checked by eye in the browser
