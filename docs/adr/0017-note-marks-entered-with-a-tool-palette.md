# 17. Note marks belong to the note, and are entered with a tool palette

Date: 2026-10-26

Status: accepted

The rudiments need accents, grace notes (flams, drags) and roll strokes (doubles, buzz). Each could be a note of its own or a mark on a note, and each could be written out or written in shorthand:

- **Grace notes as notes of their own** would put them in the grid and the timing. A flam's grace note isn't on any grid position, so the speller, the editor and the schedule would all have to place it. As a mark on its note, it's drawn and scheduled from that note.
- **Rolls written out in 32nds** would mean 32nds in the grid, the figures, the speller and the editor: a large change. With tremolo slashes, as the PAS chart and most method books write rolls, the grid stays at 16ths and a double is a mark on its note.

So all three are optional fields on a snare note: a dynamic (accent), a grace (flam or drag) and a roll stroke (double or buzz). They work in every exercise, not just the rudiments. They aren't a special case, since accents matter in plenty of exercises.

How to enter them was prototyped (branch `prototype/note-marks`, never merged):

- **A**: pick a note in the notation; a popover of marks opens, with keys.
- **B**: a tool palette over the beat cards; the held tool applies to the cell you tap.
- **C**: three mark lanes over each card's snare row, tapped to cycle.

The user chose B on 2026-10-26, finding A's popover janky to deal with. C makes the cards taller, which moves the notation.

The snare gets loudness levels so the accents stand out. Of the two ways offered, the user chose to make the normal notes softer than today and give the accents today's level or more. Making the accents alone louder was the other.

## Consequences

- The palette is a mode. With a mark held, a tap no longer toggles a hit, so it starts on Hit and shows which tool is held.
- Marks are snare-only. A tied continuation or a hold can't carry one.
- Ghost notes can be added later as another dynamic, without a migration.
- Grace notes are scheduled ahead of their note, so their spacing follows the tempo. Recorded flam samples aren't used.
- Older app versions refuse an export with marks (schema version bump) rather than drop them.
- Entering marks from the keyboard is left for later.
