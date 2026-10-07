# 02: Kick row

**What to build:** Every exercise gets a kick row under the snare row (ADR 0005). It's stored, migrated from v1, edited by mouse in the beat cards, written in the feet part and played on the bass drum. The Voice setting is removed. See [spec](../spec.md) stories 11–13 and 16–23.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] `Bar` is `{ snare, kick }`, `Exercise.voice` is gone and `SCHEMA_VERSION` is 2. Tested: v1 snare and bass drum exercises (stored and imported) migrate as ADR 0005 says
- [ ] Speller and editor grid commands take a row. Tested: a click in the kick row leaves the snare row unchanged; a grid switch rewrites both rows
- [ ] Bar commands (add, duplicate, delete, copy and paste, yank and put) carry both rows. Tested
- [ ] Sticking is computed from the snare row only. Tested
- [ ] Staff parts write the kick row in the feet part under ADR 0004. Tested: a kick off the hands' hits gives two voices; a kick on hand hits gives one voice
- [ ] Schedule plays both rows, and a groove bass drum is dropped under a kick-row hit. Tested
- [ ] The beat cards show and edit the kick row (click, drag), with the count labels between the two rows
- [ ] The Exercise › Voice control is removed; CONTEXT.md replaces **Voice** with **Snare row** / **Kick row**
- [ ] Checked in the browser: enter a *Syncopation* line with a bass drum part, then hear it and read it with and without the jazz groove
