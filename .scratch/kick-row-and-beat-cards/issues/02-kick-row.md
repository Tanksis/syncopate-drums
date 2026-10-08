# 02: Kick row

**What to build:** Every exercise gets a kick row under the snare row (ADR 0005). It's stored, migrated from v1, edited by mouse in the beat cards, written in the feet part and played on the bass drum. The Voice setting is removed. See [spec](../spec.md) stories 11–13 and 16–23.

**Blocked by:** 01

**Status:** done (merged in PR #30, 2026-10-08)

- [x] `Bar` is `{ snare, kick }`, `Exercise.voice` is gone and `SCHEMA_VERSION` is 2. Tested: v1 snare and bass drum exercises (stored and imported) migrate as ADR 0005 says
- [x] Speller and editor grid commands take a row. Tested: a click in the kick row leaves the snare row unchanged; a grid switch rewrites both rows
- [x] Bar commands (add, duplicate, delete, copy and paste, yank and put) carry both rows. Tested
- [x] Sticking is computed from the snare row only. Tested
- [x] Staff parts write the kick row in the feet part under ADR 0004. Tested: a kick off the hands' hits gives two voices; a kick on hand hits gives one voice
- [x] Schedule plays both rows, and a groove bass drum is dropped under a kick-row hit. Tested
- [x] The beat cards show and edit the kick row (click, drag), with the count labels between the two rows
- [x] The Exercise › Voice control is removed; CONTEXT.md replaces **Voice** with **Snare row** / **Kick row**
- [x] Checked in the browser: enter a *Syncopation* line with a bass drum part, then hear it and read it with and without the jazz groove

## Comments

- The browser check ran headless (Playwright, real mouse events, at 1600px and 1100px) because no Chrome was connected: clicks and drags in the kick row, the grid switch and undo, and the notation with and without the jazz groove. How it sounds is left to the user's by-ear check.
- Where the spec was silent: a typed figure that puts a beat on the other grid clears the other row's beat to its downbeat (ADR 0005: one beat never mixes grids). The cursor's beat is lit in both staff parts, and any chord there moves the cursor on a click. A kick row with an empty snare row rests in the feet part, as a bass drum exercise did before. Kick notes have ids `kick:bar:tick`; snare ids are unchanged.
- Keyboard edits stay on the snare row until ticket 03.
