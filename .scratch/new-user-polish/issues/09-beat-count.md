# 09: The beat count

**What to build:** Variant B from `prototype/beat-flash`, rebuilt for main. While an exercise plays, a large count in the notation card's top-right corner shows each beat of the bar. The current beat is enlarged, beat 1 is in the accent colour, and **count-in** shows beside it during the count-in. It counts the bar's real beats through a pure `beatCountAt`, ready for time signatures. It is on by default, with a switch in General › Appearance and the phone's Theme tab. See [spec](../spec.md), stories 18–22.

**Blocked by:** 02

**Status:** needs-info

- [ ] `beatCountAt` in `src/core/`, unit-tested (count-in, each beat, between beats, the loop wrap)
- [ ] `DeviceSettings.beatCount` (default on), validated, with tests; the switch on desktop and phone
- [ ] Renders `beats` numbers, not a fixed four; `text-3xl` on desktop and `text-2xl` on a phone; never covers the staff
- [ ] With reduced motion, the beat changes colour without scaling
- [ ] Add **Beat count** to `CONTEXT.md`
- [ ] Checked playing at 390 × 844 and 1280, light and dark; the by-ear sync is left to the user

## Comments

- 2026-10-16: The user wants to see this mocked or prototyped before agreeing to it. It waits for the `prototype/new-user-polish` verdict.
- 2026-10-16: Prototype verdict (`prototype/new-user-polish`, commit 53472b9): the user is torn between the corner count and the strip of beat blocks across the top of the card, and dislikes that the strip pushes the page down when Play starts. `?count=fixed` (the strip always there, dim when stopped) and `?count=over` (the strip floats over the card's top while playing) were added to settle it. Still needs-info.
