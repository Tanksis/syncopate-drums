# Spec: The 40 rudiments, and the marks they need

Status: ready-for-agent

Source: grilled with the user on 2026-10-26, plus the note-marks prototype's verdict (branch `prototype/note-marks`, never merged; `PROTOTYPE-VERDICT.md` there). The decisions are recorded in [ADR 0017](../../docs/adr/0017-note-marks-entered-with-a-tool-palette.md) and [ADR 0018](../../docs/adr/0018-rudiments-and-a-mirroring-lead-hand.md). The sample-pack research is summarised under Further Notes.

Vocabulary follows [`CONTEXT.md`](../../CONTEXT.md).

## Problem Statement

A drummer practises the rudiments at the laptop with a practice pad. Syncopate! can play an exercise with its sticking against a click, but it can't write most rudiments. It has no accents, no flams or drags, and no roll strokes, so only the plain single strokes and paradiddles can be entered, and even those without their accents. The drummer reads the PAS chart and keeps time with a separate metronome.

## Solution

- **Three note marks**, available in every exercise and on the snare row only:
  - an **accent**, drawn `>` and played louder;
  - a **grace note**: a **flam** (one grace) or a **drag** (two). It is drawn small before the note and played soft just ahead of it, by the other hand;
  - a **roll stroke**: a **double** (one slash across the stem; plays two strokes in the note's time) or a **buzz** (a Z across the stem; plays a buzz stroke).
- They are entered with a **tool palette** over the beat cards: Hit, Accent, Flam, Drag, Double, Buzz. With Hit held, the grid works as it does today. With a mark held, tapping a cell toggles that mark on its note, adding the hit if the cell is empty.
- The snare plays at three loudness levels: grace, normal and accent. Normal notes are a little softer than today, so accents stand out.
- A **Rudiments** tab joins Library and Examples in the exercises sidebar. It lists the 40 PAS rudiments, numbered, under their four families. Each one is a read-only exercise that plays with the click, with its hands printed. Copy to Library makes your own version.
- The **Lead hand** mirrors the sticking overrides, so a rudiment (or any exercise) can be practised leading with the left.
- It ships in stages. A rudiment that isn't built yet is listed greyed, marked "coming soon". The launch doesn't wait for it.

## User Stories

1. As a drummer, I see a palette of tools over the beat cards: Hit, Accent, Flam, Drag, Double and Buzz. Hit is held at first.
2. As a drummer holding a mark tool, tapping a snare cell with a hit toggles that mark on its note. Tapping an empty snare cell adds the hit with the mark.
3. As a drummer holding Hit, the grid works as it does today: tap to toggle, drag a hold, long-press to flip the hand.
4. As a drummer, a note can have an accent, a grace note and a roll stroke together (a flam accent is an accented flam). It has at most one grace (flam or drag) and one roll stroke (double or buzz). Choosing the other one replaces it.
5. As a drummer, a marked cell shows its marks in small print, so I can see them in the grid as well as on the staff.
6. As a drummer, an accent is drawn `>` close above its note's stem, and it plays clearly louder than the notes around it.
7. As a drummer, a flam is drawn as one small slashed grace note tucked just before its note, and a drag as two small beamed grace notes, without a slur. Both play soft and just ahead of the note.
8. As a drummer, a grace note is played by the other hand from its note, and the sticking prints it small before the main hand: `lR` for a flam, `llR` for a drag.
9. As a drummer, a double is drawn as one thin slash across the middle of the stem and plays as two strokes, same hand, in the note's time. A buzz is drawn as a Z across the stem and plays a buzz stroke.
10. As a drummer, normal snare notes vary a little from stroke to stroke, as a real drummer's do, and a run of fast singles doesn't sound machine-gunned.
11. As a drummer, the exercises sidebar has three tabs: Library, Examples and Rudiments.
12. As a drummer, the Rudiments tab lists the 40 rudiments by PAS number and name under the headings Rolls, Diddles, Flams and Drags. A rudiment that isn't built yet is listed greyed, marked "coming soon", and doesn't open.
13. As a drummer, opening a rudiment shows it as a read-only exercise: the fewest bars that bring it back to the starting hand, at a sensible tempo, with its hands always printed. Play loops it with the click.
14. As a drummer on a rudiment, the settings sidebar shows Lead hand, Swing and the Feet (Bass drum, Hi-hat foot), and hides Sticking mode and Pattern.
15. As a drummer, switching Lead hand to L mirrors every hand of the rudiment (RLRR LRLL becomes LRLL RLRR), the grace hands too.
16. As a drummer, the Lead hand mirrors my own exercises' sticking overrides the same way. An exercise I saved before this change looks exactly as it did.
17. As a drummer, Copy to Library on a rudiment makes an ordinary exercise with its notes, marks and hands, which I can edit.
18. As a drummer, an exported exercise keeps its marks when imported. An older version of the app refuses a file with marks rather than silently dropping them.

## Implementation Decisions

### Exercise core (the test seam)

- **The note marks** are optional fields on `Note`: `dynamic?: 'accent'` (ghost notes will add `'ghost'`), `grace?: 'flam' | 'drag'` and `roll?: 'double' | 'buzz'`. A note without them is unmarked, so stored exercises need no change. Only the snare row's notes carry marks. A tied continuation carries none, and neither does a hold.
- **Editing**: an edit command toggles a mark at a grid point, adding the hit if the position is empty. Flam and drag replace each other, and so do double and buzz. Clearing a hit clears its marks. Marks move with their notes through the existing edits (copy, paste, duplicate, regrid), and rest with them.
- **Schedule**: an exercise event carries its snare level: `grace`, `normal` or `accent`, with a buzz as its own kind of stroke. A flam adds one grace event a short fixed time before the note, and a drag adds two. The times are constants tuned by ear, about 25 ms for a flam and about 50 ms and 25 ms for a drag. A double adds a second stroke halfway through the note's time. Grace events are not struck notes: they move no playhead and light no beat.
- **Sticking**: a struck note's sticking gains its grace hands, the other hand from the note, one per grace note. A rudiment's hands are stored as overrides on every note.
- **The Lead hand mirrors overrides.** An override stores the hand as for a right lead, and with Lead hand L it is shown and played mirrored. Exercises stored with Lead hand L and overrides are migrated once, flipping each override, so nothing they show changes. This needs a schema version bump.
- **Rudiments** live in `src/core/rudiments.ts` as a built-in, read-only set, like the examples. Each has a PAS number, name, family, time signature, tempo and bars. They are written in a compact text form that holds each note's hand and marks, and parsed into exercises. Unit-tested: every rudiment's bars add up, its sticking matches its PAS sticking, Lead hand L mirrors it, and it ends back on its starting hand.
- **Export and import** carry the marks. `SCHEMA_VERSION` goes up, so an older app refuses the file. `transfer.ts` validates each mark's value.

### Samples and playback (`src/features/playback/engine.ts`)

- Keep Virtuosity Drums (CC0), overhead mic, snare center. Replace today's three snare files (vl18, vl21, vl24, which are three loudness levels and not round robins) with bands:
  - **normal**: softer than today, starting around vl13 to vl17;
  - **accent**: today's level or above, starting around vl24 to vl30;
  - **grace**: starting around vl8 to vl12;
  - **buzz**: the buzz articulation, around vl4, vl7 and vl10.
  The user sets the final bands by ear.
- Each stroke picks a file at random from its band, never the one just played, with about ±1 dB of random gain. The files stay FLAC under `public/samples/`, and `LICENSE.txt` lists them.

### Renderer (`src/features/notation/staff.ts`)

The marks are added as VexFlow modifiers before the bar is formatted, so the spacing makes room for them. Each fixes one of the prototype's faults:
- **Accent**: an `a>` articulation sitting just above the stem tip, the same height across a beam group.
- **Flam**: one small grace note with a slash, close to its note. **Drag**: two small beamed grace 16ths with no slur. Both are drawn at grace-note size and kept clear of the previous note.
- **Double**: one thin slash across the middle of the stem (a tremolo of one), not a block at the stem tip. On a beamed note, the slash goes across the stem below the beam.
- **Buzz**: a Z across the stem.
- **Sticking**: the grace hands print small, in lower case, before the main hand.

### UI

- **The tool palette** sits over the beat cards: on the desktop between the bar header and the cards, and on the phone at the top of the editor sheet. It's a row of pill buttons with a glyph and a name, one held at a time. It stays on Hit until changed, and it's disabled on an example or a rudiment.
- **The Rudiments tab**: the families as headings, the rudiments as rows ("16 · Single paradiddle"), with no folding. Opening one shows the example notice ("read-only; Copy to Library to edit"), worded for a rudiment.
- **The settings sidebar on a rudiment** hides Sticking mode and Pattern.

## Build Order (tickets)

1. The snare's loudness bands and varied strokes. They replace the three files rotated today.
2. Accents: model, palette (Hit and Accent), drawing, playback, export.
3. The Lead hand mirrors overrides, with the migration.
4. The Rudiments tab, with the singles (1–3) and diddles (16–19).
5. Grace notes: flams and drags, with their sticking.
6. The flam rudiments (20–30).
7. The drag rudiments (31–40).
8. Roll strokes: doubles and buzz.
9. The roll rudiments (4–15).

## Testing Decisions

- **Core, Vitest:** the mark edits (toggle, replace, clear with the hit, carried through copy and regrid); the schedule's grace, double and buzz events and their levels; the grace hands in the sticking; mirroring and its migration; import and export with marks, and an older version refused; every rudiment (bars, PAS sticking, mirror, back to the start).
- **In the browser:** a close-up screenshot of each mark, checked against the six faults the prototype showed. Check the palette with real mouse clicks on the desktop and the phone.
- **By ear (the user):** the loudness bands, the flam and drag spacing, the buzz, and fast singles.

## Out of Scope

- Ghost notes. They're on the roadmap, and the dynamic field leaves room for them.
- Entering marks from the keyboard, including vim mode.
- Marks on the kick row.
- 32nd notes. Rolls are written with slashes.
- The PAS chart's own engraving and layout: we write our own.
- A practice-pad sound.
- A native iOS app (parked).

## Further Notes

- **Samples.** Virtuosity's overhead snare center has 36 velocity layers and no round robins, about 190 KB each. It also has buzz (12 layers), flam (12) and a continuous roll. Its recorded flam isn't used, because its grace spacing is fixed. Grace notes are scheduled instead, so they follow the tempo. If fast singles still sound mechanical, the fallback is to move the whole kit to Karoryfer's Big Rusty Drums (CC0, 10 layers × 4 round robins, no buzz). Never take a snare from one kit and the rest from another. Avoid SM Drums (no licence) and the share-alike packs (Salamander, AVL). The full research was a session note and isn't kept.
- **`CONTEXT.md`** gains **Rudiment**, **Accent**, **Grace note** (Flam, Drag), **Roll stroke** (Double, Buzz) and **Tool palette**. The **Sticking override** entry changes: an override is stored as for a right lead and mirrored by the Lead hand. **Sticking pattern** keeps "Avoid: rudiment", since a rudiment is now its own term.
- **The PAS 40.**
  - Rolls: 1 Single stroke roll, 2 Single stroke four, 3 Single stroke seven, 4 Multiple bounce roll, 5 Triple stroke roll, 6 Double stroke open roll, 7 Five stroke roll, 8 Six stroke roll, 9 Seven stroke roll, 10 Nine stroke roll, 11 Ten stroke roll, 12 Eleven stroke roll, 13 Thirteen stroke roll, 14 Fifteen stroke roll, 15 Seventeen stroke roll.
  - Diddles: 16 Single paradiddle, 17 Double paradiddle, 18 Triple paradiddle, 19 Single paradiddle-diddle.
  - Flams: 20 Flam, 21 Flam accent, 22 Flam tap, 23 Flamacue, 24 Flam paradiddle, 25 Single flammed mill, 26 Flam paradiddle-diddle, 27 Pataflafla, 28 Swiss army triplet, 29 Inverted flam tap, 30 Flam drag.
  - Drags: 31 Drag, 32 Single drag tap, 33 Double drag tap, 34 Lesson 25, 35 Single dragadiddle, 36 Drag paradiddle #1, 37 Drag paradiddle #2, 38 Single ratamacue, 39 Double ratamacue, 40 Triple ratamacue.
- **The grid.** It has 16ths and 8th triplets, but no 16th-note triplets. Rudiments usually written in sextuplets (the triple stroke roll, the paradiddle-diddle) are written in 8th triplets instead: the same sticking, at half the speed per tempo.
