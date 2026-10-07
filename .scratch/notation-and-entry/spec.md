# Spec: Grid entry, playhead, and hands up / feet down

Status: ready-for-agent

Source: the grilling session of 2026-10-07 that followed v1 ([v1 spec](../drum-app-v1/spec.md)). Vocabulary follows [`CONTEXT.md`](../../CONTEXT.md). Decisions: [ADR 0002 Hands up, feet down](../../docs/adr/0002-hands-up-feet-down.md) and [ADR 0003 Grid positions and drag-to-hold](../../docs/adr/0003-grid-positions-and-drag-to-hold.md).

## Problem Statement

I've used v1 to enter and practise lines from *Syncopation*, and three things get in my way.

Entering a line means translating the rhythm I see in the book into a palette key. I keep stopping to think "is it 1 or 5?", because nothing about a key tells me the rhythm it writes. Groove Scribe lets me click where the hits fall, and that feels far more direct. I also can't write a line exactly as the book prints it, because I can only shorten a beat's last note, and only to one fixed length.

During playback only the sounding snare note lights up. When the line rests and only the ride or hi-hat is playing, nothing moves, and I lose my place in the count.

With a groove on, the notation is cluttered. The snare line has its own stems-down voice with its own rests, which is wrong for a drum-set chart. Those rests sit tangled with the hi-hat foot below the staff, even where the ride is keeping time anyway. A real chart (or Groove Scribe) writes the hands together stems up and the feet stems down, with no rests where a hand is already playing.

## Solution

The **beat strip** becomes the main way to enter a line. Each beat box shows its **grid positions**: four sixteenths, or three triplet eighths when the beat is on the triplet grid. I click a grid position to turn a hit on or off, and click a small 3/16 toggle on the box (or right-click it) to switch the beat's grid. I press on a note and drag to set its **hold**: shorter, so a rest follows it, or longer, tying on into the next beats and bars. The app still spells everything. The figure keys stay as a fast keyboard shortcut, and the on-screen palette folds into a panel that's closed by default.

During playback a **playhead** line runs across the staff and jumps to every hit from any instrument, groove included. Notes no longer change colour.

The notation writes drum-set notation by limb. Everything played with the hands (snare, ride, hi-hat) is one **hands part**, stems up: a snare hit on a ride note shares its stem, and a rest appears only where no hand is playing. Everything played with the feet (bass drum, hi-hat foot) is the **feet part**, stems down. A bare snare line is a hands part on its own (stems up, as the book prints it), and a bare bass drum line is a feet part on its own. Swing is still written as plain eighths.

## User Stories

### Entering hits on grid positions

1. As a drummer, I want each beat box in the beat strip to show its grid positions (four for a sixteenth beat, three for a triplet beat), so that I can see where hits can fall.
2. As a drummer, I want to click an empty grid position to put a hit there, so that I can enter the rhythm I see in the book without remembering a key.
3. As a drummer, I want to click a hit to remove it, so that I can fix a mistake with the same gesture.
4. As a drummer, I want a click on a grid position to move the cursor to that beat without advancing, so that I can click several positions in one beat.
5. As a drummer, I want each click to be one undo step, so that Ctrl+Z takes back exactly one change.
6. As a drummer, I want clicking a grid position to work in both Insert and Normal mode and never change the mode, so that the mouse and keyboard don't fight.
7. As a drummer, I want a new hit to hold until the next hit or the end of the beat, so that clicking positions gives me the same result as typing the matching figure.
8. As a drummer, I want a new hit placed inside another note's hold to split that hold (the earlier note now stops at the new hit, and the new note takes the rest), so that adding a hit never changes anything else.
9. As a drummer, I want removing a hit that the previous note ran right up to to let the previous note hold on through the removed note's span, so that removing the "&" from two eighths gives me a quarter, just as typing the figure would.
10. As a drummer, I want removing a hit after a note that was already shortened to leave that span empty, so that a rest I set on purpose stays.
11. As a drummer, I want removing a note with a sticking override to drop the override, so that overrides follow the existing rule (dropped when their note goes).
12. As a drummer, I want clicking the downbeat of a tied-into beat to strike it again (ending the tie), so that I can undo a tie from the grid.
13. As a drummer, I want removing a beat's downbeat hit to remove any tie into that beat, so that a tie never points at a rest.
14. As a drummer, I want a beat box with no hits to look empty (no "rest" label), so that the beat strip reads as a clean grid.

### Switching a beat's grid

15. As a drummer, I want a small 3/16 toggle on each beat box that switches the beat between the sixteenth and the triplet grid, so that I can enter triplet beats with the mouse.
16. As a drummer, I want right-clicking a beat box to do the same as the toggle, so that I have a quick shortcut.
17. As a drummer, I want switching the grid to keep a hit on the downbeat and clear the others (only the downbeat is on both grids), with holds back to their defaults, so that switching is predictable.
18. As a drummer, I want an empty beat (or one with only a downbeat hit) that I switched to the triplet grid to stay on the triplet grid while I place its hits, so that I can switch first and click second.
19. As a drummer, I want each grid switch to be one undo step, so that I can take it back.

### Dragging a hold

20. As a drummer, I want to press on a note (its hit or its hold bar) and drag right or left to set where its hold ends, so that I can make it as long or as short as the book prints it.
21. As a drummer, I want a hold to be at least one grid position, so that a note can't be dragged to nothing.
22. As a drummer, I want the drag to stop at the next hit and never delete it, so that dragging can't lose notes.
23. As a drummer, I want positions after a shortened note to become empty, written as rests, so that I can enter a sixteenth followed by a sixteenth rest anywhere in the beat, not only on the beat's last note.
24. As a drummer, I want dragging past the beat line to tie the note on into the next beat, and on across several beats and over a bar line, so that I can enter quarters, dotted quarters, half notes and syncopated long notes.
25. As a drummer, I want the beats a drag passes through to become tied continuations (not struck, no hand), so that ties follow the existing rules.
26. As a drummer, I want a drag's hold to run through the grid position under the pointer, snapped to the grid (sixteenth or triplet) of the beat under it, so that holds always end on a real position. (Clarified 2026-10-07 during code review: the hold takes in the position under the pointer, rather than ending at the nearest position.)
27. As a drummer, I want a whole drag to be one undo step, so that undo takes back the whole gesture.
28. As a drummer, I want a note's hold drawn as a bar from its hit through the positions it holds, running on into the next box when it's tied, so that I can see each note's length at a glance.
29. As a drummer, I want the ⌒ mark to stay on a tied-into beat box as a read-only sign, so that ties remain visible.
30. As a drummer, I want the app still to spell the notes, rests, dots and ties from the hits and holds I set, so that I never pick note values myself.
31. As a drummer, I want a hold to change only how the note is written, not how it sounds, so that playback is the same whatever lengths I choose.

### Figures and keys alongside the grid

32. As a drummer, I want the figure keys to keep working exactly as before (enter, advance, `r` replace, `T` tie, `.` cut short, Space rest), so that keyboard entry stays fast.
33. As a drummer, I want typing a figure key over a beat with custom holds to reset its holds to the figure's defaults, so that a figure always means the same thing.
34. As a drummer, I want a beat with custom holds to show no figure (no palette tile lit), so that the palette never claims a beat is something it isn't.
35. As a drummer, I want the on-screen palette tiles in a collapsible "Figures" panel, closed by default and remembered per device, so that the grid gets the space and I can still open the tiles to learn the keys.
36. As a drummer, I want no tie or cut-short buttons on the beat boxes, so that dragging is the one mouse gesture for length.
37. As a vim user, I want grid clicks, grid switches and drags not to become the change that `.` repeats, so that `.` keeps repeating my last keyboard change.

### Playhead

38. As a drummer, I want a playhead line across the staff during playback that jumps to each hit as it sounds, so that I can see where I am in the count.
39. As a drummer, I want the playhead to move on groove hits too (ride, hi-hat, hi-hat foot, feathered bass drum), so that it keeps moving when the line rests.
40. As a drummer, I want the playhead not to move on click-only beats or during the count-in, so that it marks only notes on the staff.
41. As a drummer, I want the playhead to stay in time with what I hear (the same audio-clock timing as v1's highlight), so that I can trust it.
42. As a drummer, I want sounding notes no longer coloured, so that there's one clear playback marker.
43. As a drummer, I want the view to keep scrolling to the playhead's line as before, so that long exercises can still be followed hands-free.

### Notation: hands up, feet down

44. As a drummer, I want the snare written stems up, in the hands part, always (groove on or off), so that the line reads like a drum-set chart and like the book.
45. As a drummer, I want a bass drum line written stems down, in the feet part, so that the feet read where feet belong.
46. As a drummer, I want, with a groove on, the snare notes to share stems with the ride or hi-hat where they land together, so that the chart is compact and correct.
47. As a drummer, I want the groove's ride and hi-hat in the hands part and its hi-hat foot and bass drum in the feet part, so that each limb has its own line.
48. As a drummer, I want the part that holds the exercise to show a rest only where nothing in that part is sounding or held, so that rests appear only where I actually stop.
49. As a drummer, I want a part with only groove notes in it to show no rests, so that the groove layer stays uncluttered (as in v1).
50. As a drummer, I want a bare snare line (groove off) to show its rests as now, so that a line on its own still reads exactly.
51. As a drummer, I want a bass drum exercise hit and a groove bass drum hit at the same position drawn as one notehead and played as one sound (the exercise's), so that one drum isn't written or played twice.
52. As a drummer, I want the sticking under the staff to label only the exercise's notes, even where they share a stem with the groove, so that the hands I read are the line's.
53. As a drummer, I want overrides still clickable on the exercise's notes in a merged chord, so that the notation stays where I set sticking.
54. As a drummer, I want an exercise note held on past the next chord of its part to end at that chord, with no tie through it (a snare quarter under hi-hat eighths reads as a plain eighth in the hi-hat chord), and its exact hold and ties shown only where nothing else in the part strikes in between, so that the merged part stays uncluttered. (Changed 2026-10-07 after seeing ticket 06: it was a tied notehead in each later chord.)
55. As a drummer, I want swing still written as plain eighths with no change to the spacing, so that the chart stays standard notation.
56. As a drummer, I want the cursor beat highlight, current-bar shading, bar numbers and loop-range clicks to keep working on the merged parts, so that nothing I rely on from v1 is lost.

## Implementation Decisions

### Exercise core (the only test seam)

- **Model unchanged.** An exercise is still bars of items (notes and rests with duration, dot, triplet membership, tie-to-next and optional override). Custom holds are already representable as spelled items (a note followed by rests, or tied on). `SCHEMA_VERSION` doesn't change; export/import is untouched.
- **Beat view gains positions.** The editor's per-beat view adds, for each grid position of the beat, whether it is a **hit**, a **hold** (a note sounding on, including a tied continuation on the downbeat) or **empty**. It keeps `figure` (now undefined when the holds aren't the figure's defaults, as well as for unwritable beats), `hits`, `tiedInto` and `cutShort`, and adds which grid the beat is on. The beat view is derived from the per-tick hit / hold / rest timeline the speller already builds.
- **New speller operations**, each re-spelling through the existing timeline: toggle a hit at a grid position (stories 7–13); set a beat's grid (story 17); set a note's hold end to a grid position in the same or a later beat (stories 20–26). Each returns the same bars when the request is impossible (for example, a drag past the next hit is clamped to stop before it, and a zero-length hold is refused).
- **New editor commands** through `applyEdit`: toggle grid position (bar, beat, position), set beat grid (bar, beat, triplet), and set hold (from bar, beat, position, to bar, beat, position). Each moves the cursor to the beat acted on, never advances, never changes the mode, records one undo step, and is not recorded as the change `.` repeats.
- **Pending grid.** A beat's grid is only stored through its notes: an empty beat, or one with only a downbeat hit at its default hold, reads the same on either grid. The editor state therefore keeps a per-beat "pending grid" for beats switched to triplet but not yet given a triplet hit. It isn't saved with the exercise, and it's cleared when the beat gets a hit that fixes its grid, or when the beat's content changes by any other command.
- **Playhead.** The playback timeline records, for every exercise and groove event (not clicks, not the count-in), its position in the bar and that it's a staff hit. `playheadAt` returns the latest staff hit's position (bar, tick) for the renderer to place the line, alongside the existing position used by the header. The sounding-note id is no longer needed for colouring.
- **Staff parts.** A new pure function takes an exercise, its groove preset and its voice, and returns, per bar, the **hands part** and the **feet part**. Each part is a run of chords and rests with durations, dots, triplet grouping and ties, ready to draw. Each chord note carries its drum, notehead, whether it is an exercise note (with its note id for sticking and overrides), and whether it's a tied continuation (drawn, not struck). Rules:
  - Snare exercise notes and groove ride / hi-hat hits go in the hands part (stems up); bass drum exercise notes and groove hi-hat foot / bass drum hits go in the feet part (stems down).
  - A bar where the feet play but every foot hit lands with a hand hit is one voice: the feet's notes join the hands part's chords and the feet part is empty (ADR 0004, decided 2026-10-07 after the user compared PR #25 with Groove Scribe).
  - Hits at the same tick in a part form one chord. A chord holds until the next chord in that part, or until all its notes' holds have ended if that's sooner. A groove note holds to the end of its beat, so it ends at its own part's next chord, not another limb's (ADR 0004).
  - A part rests where nothing in it sounds or is held if it contains the exercise or has a note in the bar. Otherwise it is empty space (ADR 0004: in two voices each voice has its rests).
  - An exercise note held on past the next chord in its part ends at that chord: it is not tied on through it. Its exact hold and ties are written only where nothing else in the part strikes before it ends (a bare snare line, or a tie across a beat where the part has no onset). Decided 2026-10-07 after seeing ticket 06; it replaces "appears in that chord as a tied continuation".
  - A bass drum exercise hit and a groove bass drum hit at the same tick become one note: the exercise's. The schedule plays one bass drum there.
  - It reuses the speller's spelling rules for the exercise part (beam groups by beat, triplet groups within a beat, dotted values where legal).
  - In a triplet beat of the exercise, a groove hit falling between the beat's triplet positions is written on the next triplet position. It is still struck at its real time (the playhead lands on that chord then), and hits that land on the same position form one chord. Clarified 2026-10-07 during code review.
- **Schedule.** Unchanged except that a groove bass drum hit is dropped where a bass drum exercise hit falls at the same tick.

### Notation renderer

- Draws the parts the core returns: hands part stems up, feet part stems down (none in a bar of one voice), parts with no notes in a bar padded with invisible notes. It no longer decides which voice a note belongs to, and no longer forces the exercise stems down.
- Sticking annotations and override clicks attach to exercise notes inside chords, by note id.
- Keeps a map from (bar, tick) to x so the playhead line can be placed, and draws the line in the existing requestAnimationFrame loop from the core's `playheadAt`. The sounding-note colour is removed. Line scrolling is unchanged.

### Beat strip and editor panel

- Each beat box renders its grid positions from the beat view: hit, hold bar (continuing across a tied box edge), or empty. There's no "rest" label. The ⌒ mark stays, read-only.
- Pointer handling: a click on a position dispatches toggle grid position. A press on a hit or hold bar followed by movement starts a drag. The hold runs through the grid position under the pointer, snapped to the grid of the beat under it, and stops before the next hit (clarified 2026-10-07 during code review: it takes in the position under the pointer, rather than ending at the nearest one). Release dispatches one set-hold command, and the strip shows the hold live while dragging. A drag that doesn't leave the starting position is a click. Right-click on a box, or its 3/16 toggle, dispatches set beat grid; the browser context menu is suppressed on the strip.
- Hit-testing must use the real pointer position over each position's element (see the memory about real mouse clicks: dispatched clicks skip hit-testing).
- The palette tiles move into a collapsible "Figures" panel. Its open state is a new device setting, `figuresPanelOpen`, defaulting to false. Device settings load with defaults merged in, so no migration is needed. The figure keys, `T`, `.` and the cheat sheet are unchanged.

### Build order

1. Grid entry: grid positions, the grid switch, drag-to-hold and the folded palette (ADR 0003).
2. Playhead line. It's independent of 1, so it can be built in parallel or first.
3. Hands up, feet down (ADR 0002), the largest change to the renderer.

## Testing Decisions

- **One seam: the exercise core's public interface**, as in v1. Tests import only the core and assert on what it returns: spelled bars and beat views after editor commands, the playhead for a timeline and a time, and the staff parts for an exercise with a groove. No test reaches into speller internals, so the timeline representation can change freely.
- **A good test** puts a *Syncopation*-style example in and checks a musical fact out. Examples:
  - "click the & of beat 1 on an empty bar, then the downbeat → beat 1 reads `x.x.` with figure `2`";
  - "remove the & from `x.x.` → a quarter (figure `1`)";
  - "drag the note on 1 to the & of 2 → it is written as a dotted quarter, beat 2 is tied into, and the & of 2 is a rest";
  - "a drag past the next hit stops just before it";
  - "switch a `x.xx` beat to triplets → `x..` on the triplet grid, holds at their defaults";
  - "a figure key over a custom-hold beat resets the holds";
  - "one drag is one undo step; `.` after a click repeats the previous keyboard change";
  - "at the time of the ride's & of 2 in a jazz groove with the line resting, the playhead is at bar 1, tick 18";
  - "jazz groove plus a snare on the & of 2: the hands part has one chord (ride + snare) at tick 18 and no rests";
  - "a bass drum exercise on beat 1 with the feathered preset: one bass drum in the feet part and one scheduled bass drum event".
- **Modules covered:** speller (new operations and the beat view's positions), editor (`applyEdit` with the new commands, undo, `.` exclusion, pending grid), timeline (`playheadAt` with groove and click events), staff parts (every preset × snare and bass voice, holds ending at the next chord, rests only where the rules say), and schedule (bass drum de-duplication).
- **Prior art:** `speller.test.ts` and `editor.test.ts` (command sequences in, bars, views and cursor out), `timeline.test.ts` (`playheadAt`), `groove.test.ts` (`grooveChords`), `schedule.test.ts` (event lists).
- **Not tested automatically (checked by eye and ear, with real-mouse checks in the browser):** the beat strip's pointer handling and drawing, the VexFlow adapter, the playhead line's placement and timing, and the Figures panel.

## Out of Scope

- Editable or user-defined groove layers, and right-click instrument changes (ride ↔ hi-hat, hi-hat foot, kick + hi-hat foot). Syncopate! stays a line reader; this may be a later feature.
- Showing swing in the notation (swung noteheads, a swing marking or a timing lane). The swing mockup (branch `prototype/swing-notation`, `.scratch/notation-and-entry/prototypes/swing-notation/`) was tried and none were wanted.
- A keyboard or vim way to set custom holds; the keys keep the figure defaults plus `T` and `.`.
- Multi-voice exercises (a line split between snare and bass drum), and new instruments for the exercise voice.
- Rests in groove-only parts; accents.
- The installable offline PWA (v1 ticket 34), deferred until the user feels the app is ready.

## Further Notes

- ADR 0003 reverses v1's "beat figures only" decision (v1 ticket 05). The step grid lost then, but after real use the user prefers clicking where hits fall.
- The pending-grid rule (story 18) was settled while writing this spec rather than in the session: the model can't store a grid for a beat whose hits fit both grids, so the choice lives in the editor state until a hit fixes it.
- The merged-part spelling (story 54 and the chord-hold rule) is the starting point and may be tuned once real lines are drawn. The constraint is ADR 0002: hands up, feet down, rests only where the part is silent.
- A grid switch (story 17) or a figure key (story 33) resets the beat's own holds to the defaults, but a tie out of the beat into the next one is kept (unless the beat is left with no note), as in v1. Clarified 2026-10-07 during code review.
- The swing mockup is kept as a primary source on the `prototype/swing-notation` branch, not on `main`.
