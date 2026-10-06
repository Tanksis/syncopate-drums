# Exercise data model and sticking rules

Type: grilling
Status: resolved
Blocked by: 01

## Question

How is an **exercise** represented, and exactly how is **sticking** derived from it?

- How notes, durations, rests, ties, dotted notes and eighth-note triplets are stored within bars (a tick grid vs. symbolic durations), and how that maps to the chosen rendering library (from **Notation rendering library**).
- Where voice, groove preset, swing amount, BPM, loop range, lead hand, sticking mode and sticking overrides live (on the exercise vs. practice settings).
- Natural sticking edge cases: bars that mix triplets and straight eighths/sixteenths; tied notes (does the tie get a hand?); a note that starts on a rest position. What is "the exercise's smallest note value" when the grid changes mid-bar?
- Alternate sticking: does it continue across bar lines and loop repeats, or restart each loop?
- What happens to sticking overrides when the notes around them are edited.

Settle the model and the sticking rules with concrete *Syncopation*-style examples; update `CONTEXT.md` with any new terms.

## Answer

Settled in a grilling session (2026-10-05). The terms are in `CONTEXT.md`.

- **Storage**: symbolic. A bar is an ordered list of notes and rests. Each has a duration (quarter / eighth / sixteenth), an optional dot, triplet-group membership and a "tied to next" flag. A bar adds up to 4 beats. A triplet group fills exactly one beat (3 triplet-eighth slots) and may hold triplet eighths, triplet quarters (2 slots), rests, and ties in or out. Tick positions (12 per beat) are derived for playback, sticking and the grid editor. The notation view (VexFlow) is drawn from the symbolic form, so lines look the way the book prints them. Quarter-note triplets spanning two beats are out of scope.
- **Stored on the exercise**: bars, voice, sticking mode, lead hand, and sticking overrides (stored on each note). **Practice settings** (BPM, loop range, groove preset, swing amount) are remembered per exercise. Click/exercise/groove volumes and the count-in are global.
- **Ties**: A tied continuation is not a note. It is not struck, gets no hand, and is skipped by alternate sticking, but it uses up its grid position under natural sticking. Ties may cross bar lines. A rest can't be tied, and the exercise's last note can't be tied forward.
- **Natural sticking**: The grid is chosen per beat (the finest subdivision used in that beat). Straight beats (eighths, sixteenths) always start on the lead hand. A run of back-to-back triplet beats alternates continuously from the lead hand, also across bar lines. Examples, lead R:
  - `3♪♪♪ | ♪♪ | 3♪♪♪ | 3♪♪♪` → `RLR | RL | RLR | LRL`
  - dotted eighth + sixteenth → `R . . L`
  - triplet ♩♪ → `R . R`
  - a note after a rest takes its grid position's hand.
- **Alternate sticking**: Starts from the lead hand on the first note and continues across bar lines, skipping rests and tie continuations. Loop repeats and partial loop ranges don't change it (see [Alternate sticking and looping](12-alternate-sticking-and-looping.md)).
- **Sticking overrides**: An override changes only its own note; the computed sticking of the others doesn't move. It's stored on the note, so it survives edits to the notes around it and is dropped if the note is deleted or turned into a rest (a duration change keeps it). Overrides are kept when the sticking mode is switched.
- **Bass drum voice**: Sticking, sticking mode and overrides are hidden but kept, and come back on switching to snare.

## Comments
- 2026-10-06: Amended by [Screen layout](10-screen-layout.md): a third sticking mode, **off**, prints no sticking.
- 2026-10-06: Resolved by [Alternate sticking and looping](12-alternate-sticking-and-looping.md): sticking is computed once over the whole exercise; loop repeats restart as printed and a narrowed loop range keeps the printed sticking.
