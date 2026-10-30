# Spec: Ghost notes

Status: ready-for-agent

Source: grilled with the user on 2026-10-30. It builds on [ADR 0017](../../docs/adr/0017-note-marks-entered-with-a-tool-palette.md) (note marks and the tool palette), which left room for ghost notes as another dynamic, and on the [rudiments spec](../rudiments/spec.md) that added the marks. Vocabulary follows [`CONTEXT.md`](../../CONTEXT.md).

## Problem Statement

A drummer working on grooves wants the soft in-between strokes that make a backbeat groove breathe: ghost notes. Syncopate! can mark a snare note as accented, but not as a ghost, so a ghost-note groove plays every snare note at the same level and can't be written as a drummer would read it.

## Solution

- A **ghost note** is a snare note's second dynamic, beside the accent. It is drawn with parentheses around the notehead, and played soft, under a flam's grace note.
- It is entered with a **Ghost** tool in the palette, after Accent: Hit, Accent, Ghost, Flam, Drag, Double, Buzz.
- A note is a ghost or accented, never both: choosing one replaces the other.
- A ghost combines with a grace (flam, drag) and a roll stroke (double, buzz). It sets the level of every stroke the note plays, a double's second stroke too. Grace notes keep their own grace level.
- The Examples tab gains a ghost-note groove.

## User Stories

1. As a drummer, the tool palette has a Ghost tool after Accent, glyph `( )`.
2. As a drummer holding Ghost, tapping a snare hit toggles its ghost, and tapping an empty snare cell adds a ghosted hit.
3. As a drummer, ghosting an accented note takes its accent off, and accenting a ghost takes its ghost off.
4. As a drummer, a ghosted cell shows `( )` in small print.
5. As a drummer, a ghost note is drawn with parentheses around its notehead, and plays clearly softer than the notes around it, and softer than a flam's grace note.
6. As a drummer, a ghosted double plays both strokes soft, and a ghosted buzz is a soft buzz. A ghosted flam's grace note plays at the grace level.
7. As a drummer, an exported exercise keeps its ghost notes when imported. An older version of the app refuses a file with them.
8. As a drummer, the Examples tab has a ghost-note groove: accented backbeats on 2 and 4 with ghosted sixteenths around them, over a hi-hat pattern.

## Implementation Decisions

### Exercise core (the test seam)

- `Dynamic` becomes `'accent' | 'ghost'`. The mark edit already toggles a dynamic; `ghost` joins `MARK_FIELD` under `dynamic`, so ghost and accent replace each other as flam and drag do. A stored exercise needs no migration.
- **Schedule**: an exercise event's snare level gains `ghost`. A ghosted note, its double's second stroke and its buzz play at the ghost level; its grace events stay `grace`.
- **Export and import**: `transfer.ts` accepts `ghost` as a dynamic, on the snare only. `SCHEMA_VERSION` goes up, as for each earlier mark.
- **Examples** (`examples.ts`): the text form of a row's beats gains marks for the snare, `>` before a hit for an accent and `(x)` for a ghost, so the groove can be written. Unit-tested like the others.

### Samples and playback (`src/features/playback/engine.ts`)

- A `snareGhost` band, starting at vl5-vl9 of Virtuosity's overhead snare center, varied like the other bands. vl5-vl7 are added to `public/samples` from Virtuosity Drums (CC0) and listed in `LICENSE.txt`. The user sets the band by ear.
- A ghosted buzz plays the buzz strokes quieter (a gain under 1), since the buzz articulation has only three layers.

### Renderer (`src/features/notation/staff.ts`)

- Parentheses around the notehead, as a VexFlow modifier added before the bar is formatted, so the spacing makes room. On a chord with the hi-hat, they go round the snare head only.

### UI

- The Ghost tool in `ToolPalette.tsx`, glyph `( )`, after Accent, with a title like the other tools'. The mark glyph shows on a ghosted cell.

## Build Order (tickets)

1. Ghost notes end to end: model, edit, schedule, band, drawing, palette, export.
2. The ghost-note groove example.

## Testing Decisions

- **Core, Vitest:** ghost and accent replacing each other; the ghost carried through copy and regrid and cleared with its hit; the schedule's ghost level for a plain, doubled and buzzed note, grace events staying `grace`; import and export with ghosts, an older version refused; the example's bars and marks.
- **In the browser:** a close-up screenshot of ghost notes alone, beamed, on a hi-hat chord and with each other mark; the palette with real mouse clicks on the desktop and the phone; the notation doesn't move when a ghost is toggled.
- **By ear (the user):** the ghost band, against normal notes and grace notes.

## Out of Scope

- Ghost notes on the kick row or the groove's hi-hat.
- Entering marks from the keyboard.
- Ghost notes in the rudiments: the PAS chart has none.

## Further Notes

- **`CONTEXT.md`** gains **Ghost note**: a snare note's soft dynamic, drawn in parentheses, the other of the accent.
