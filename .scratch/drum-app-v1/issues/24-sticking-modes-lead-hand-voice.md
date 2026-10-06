# 24: Sticking modes, lead hand and voice

**What to build:** R or L is printed under each note in the notation view. The Sticking sidebar group picks the mode (natural, alternate, off) and the lead hand (R/L). The Exercise group switches the voice between snare and bass drum.
- **Natural sticking** ties each hand to a grid position, chosen per beat from its finest subdivision. Straight beats start on the lead hand, and a run of back-to-back triplet beats alternates continuously, also across bar lines.
- **Alternate sticking** strictly alternates over struck notes, across bar lines.
- Tied continuations get no hand.
- Mode off, or the bass drum voice, prints no hands. Under bass drum, the exercise plays on the bass drum.

See [spec.md](../spec.md): Sticking in the core, with its worked examples.

**Blocked by:** 20 (Ties and cut short)

**Status:** ready-for-agent

- [ ] The core's `sticking(exercise)` returns the computed hand, override (if any) and shown hand for each struck note. It is computed once from bar 1, regardless of the loop range
- [ ] Tests cover the worked examples (lead R): `3♪♪♪ | ♪♪ | 3♪♪♪ | 3♪♪♪` → `RLR | RL | RLR | LRL`; dotted eighth + sixteenth → `R . . L`; triplet ♩♪ → `R . R`; 7 notes under alternate → `RLRLRLR`. Tests also cover lead L, rests, ties and the bass drum voice
- [ ] The notation view prints R/L as annotations below the notes, and nothing under off or bass drum
- [ ] Sidebar controls for mode, lead hand and voice; each change autosaves and is undoable
- [ ] The bass drum voice plays the bass drum sample and draws bass drum noteheads, stems down
