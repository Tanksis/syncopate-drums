# 24: Sticking modes, lead hand and voice

**What to build:** R or L is printed under each note in the notation view. The Sticking sidebar group picks the mode (natural, alternate, off) and the lead hand (R/L). The Exercise group switches the voice between snare and bass drum.
- **Natural sticking** ties each hand to a grid position, chosen per beat from its finest subdivision. Straight beats start on the lead hand, and a run of back-to-back triplet beats alternates continuously, also across bar lines.
- **Alternate sticking** strictly alternates over struck notes, across bar lines.
- Tied continuations get no hand.
- Mode off, or the bass drum voice, prints no hands. Under bass drum, the exercise plays on the bass drum.

See [spec.md](../spec.md): Sticking in the core, with its worked examples.

**Blocked by:** 20 (Ties and cut short)

**Status:** done (merged in PR #11, 2026-10-06)

- [x] The core's `sticking(exercise)` returns the computed hand, override (if any) and shown hand for each struck note. It is computed once from bar 1, regardless of the loop range
- [x] Tests cover the worked examples (lead R): `3♪♪♪ | ♪♪ | 3♪♪♪ | 3♪♪♪` → `RLR | RL | RLR | LRL`; dotted eighth + sixteenth → `R . . L`; triplet ♩♪ → `R . R`; 7 notes under alternate → `RLRLRLR`. Tests also cover lead L, rests, ties and the bass drum voice
- [x] The notation view prints R/L as annotations below the notes, and nothing under off or bass drum
- [x] Sidebar controls for mode, lead hand and voice; each change autosaves and is undoable
- [x] The bass drum voice plays the bass drum sample and draws bass drum noteheads, stems down

## Comments

- 2026-10-06: Squash-merged as PR #11. Choices where the spec was silent: the hands are drawn as one aligned row of text below the stems and tuplets rather than VexFlow `Annotation`s, which collided with the triplet "3"s, so lines of music are a little taller; each hand sits in an SVG group tagged `data-note-id` for ticket 25's clicks. With sticking off, `computed` is null; under the bass drum voice it is still computed, only hidden. The sidebar uses button rows rather than selects, so a click never takes the editor's keys. Settings changes go through the editor as `setExerciseSettings`, one undo step each. A rest beat ends a natural-sticking triplet run. Bass drum noteheads sit on f/4.
