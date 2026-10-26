# 18. The rudiments are a built-in set, and the Lead hand mirrors overrides

Date: 2026-10-26

Status: accepted

The 40 PAS rudiments come into the app. Two ways were considered:

- **Their own screen**, beside Practice and Metronome, with a rudiment player.
- **Exercises in a third sidebar tab**: Library, Examples and Rudiments. They're read-only like the examples, with Copy to Library.

A rudiment is an exercise: bars, sticking, a tempo, a loop with the click. So the user chose the tab on 2026-10-26. The notation, the playback, the editor's read-only state and Copy to Library all come for free.

A rudiment's sticking is the rudiment. It is stored as an override on every note and always printed. On a rudiment, the settings sidebar shows Lead hand, Swing and the Feet, and hides Sticking mode and Pattern: the hands are fixed and busy.

Drummers practise rudiments leading with either hand. Overrides were stored as absolute hands, so the Lead hand couldn't flip them. Now an override is stored as for a right lead, and Lead hand L mirrors it. This applies to every exercise, not just the rudiments, because a hand that refuses to flip with the Lead hand reads as a bug.

## Consequences

- Exercises stored with Lead hand L and overrides are migrated once, each override flipped, so they show exactly what they did.
- A rudiment's grace hands mirror with it.
- The rudiments are our own notation of the standard patterns. They don't copy the PAS chart's engraving.
- They ship family by family as their marks are built. A rudiment not yet built is listed greyed, marked "coming soon".
- "Sticking pattern" keeps "Avoid: rudiment"; a rudiment is now its own term.
