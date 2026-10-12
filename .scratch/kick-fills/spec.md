# Spec: Kick fills

Status: ready-for-agent

Source: a grilling with the user on 2026-10-12. The clean-tempo tracker and practice log were deferred for it. The user practises fills with the GRID method: every sixteenth is a hand (`RLRL RLRL…`), and the shape of the fill comes from the hands left out (`RLRL RL.L RLR. RLRL`). They want help adding the bass drum to such fills, for example `RLRK RLRK RLRK RLRK` or `RLKK RLKK RLKK RLKK`, and a hi-hat foot to count against. Vocabulary follows [`CONTEXT.md`](../../CONTEXT.md).

## Problem Statement

A kick fill such as `RLRK` repeated can be entered on the grid today, but only by clicking every position of every beat, and the sticking line leaves a gap where the kick is, so the drummer can't read `R L R K` under the staff. A GRID line already entered with its gaps can't be turned into its kick version without re-clicking each gap on the kick row. There's no way to have the hi-hat foot keep time (on 1, or on quarters) without also turning on a jazz ride groove.

## Solution

- **Pattern fill:** type a sticking pattern of R, L, K and `.` (rest), on sixteenths or triplets, and it fills a bar (from the bar ⋯ menu) or a new exercise (New from pattern in the Library).
- **Kicks in the gaps:** one action turns every empty grid position of a bar, or of every bar, into a kick.
- **K in the sticking line:** a kick that doesn't land with a hand shows K.
- **Hi-hat foot:** a practice setting that plays the hi-hat foot on 1, quarters, 2 & 4 or the &s, in every bar, with or without a groove ([ADR 0010](../../docs/adr/0010-hi-hat-foot-is-a-practice-setting.md)).

## User Stories

### Pattern fill

1. As a drummer, I want to type a sticking pattern such as `RLRK` and have the bar filled with it, so that I don't click every position of a kick fill.
2. As a drummer, I want R and L to land on the snare with exactly the hands I typed, so that the sticking under the staff is my pattern.
3. As a drummer, I want K to land on the kick row, so that the fill is played and written with the bass drum.
4. As a drummer, I want `.` to be a rest, so that I can type GRID shapes with gaps such as `RL.L`.
5. As a drummer, I want a pattern of any length to repeat through the bar and carry on across beats and barlines, so that odd groupings such as `RLK` drift over the beat as they do on the kit.
6. As a drummer, I want to choose sixteenths or triplets for the pattern, so that I can practise `RLK` as triplets too.
7. As a drummer, I want lower case and spaces accepted (`rlrk rlkk`), so that I can type quickly.
8. As a drummer, I want a pattern with anything other than R, L, K, `.` and spaces refused with an inline message, so that a typo can't fill the bar with something I didn't mean.
9. As a drummer, I want a fill to replace both rows of the bar, and undo to bring them back, so that filling is predictable and safe.
10. As a drummer with sticking off, I want a fill to turn natural sticking on, so that I see the hands I just typed.
11. As a drummer, I want "Fill with pattern…" in the bar ⋯ menu on the phone as well, so that I can make a fill away from the computer.

### New from pattern

12. As a drummer, I want a New from pattern button in the Library, so that I can set up a kick drill in one step.
13. As a drummer, I want it to make 4 bars on sixteenths by default, named after the pattern, so that `RLKK` is ready to play at once.
14. As a drummer, I want to change the number of bars and the grid before it's made, so that I can make a longer drill or a triplet one.
15. As a drummer with a folder open, I want the new exercise filed in that folder, so that my drills stay together.

### Kicks in the gaps

16. As a drummer, I want "Kicks in the gaps" to turn every gap in a bar into a kick, so that a GRID line becomes its kick version (`RLRL RL.L RLR. RLRL` → `RLRL RLKL RLRK RLRL`).
17. As a drummer, I want to do it to every bar at once, so that a whole GRID line changes in one step.
18. As a drummer, I want it to follow the grid each beat is on, so that a triplet beat gets triplet kicks.
19. As a drummer, I want a gap covered by a snare note's hold to get a kick too, with the hold cut short, so that the result matches what I hear.
20. As a drummer, I want it to leave my sticking mode alone, so that a line I play with sticking off stays that way.

### K in the sticking line

21. As a drummer, I want a K under each kick that isn't played with a hand, so that `RLRK` reads as `R L R K`.
22. As a drummer, I want a kick under a hand note to show only the hand, so that there are never two letters in one place.
23. As a drummer with sticking off, I want no K either, so that the line stays clear for comping.

### Hi-hat foot

24. As a drummer, I want the hi-hat foot on 1 of every bar, so that I can count while I play a fill.
25. As a drummer, I want the hi-hat foot on quarters, on 2 & 4 or on the &s, so that I can build independence against other ostinatos.
26. As a drummer, I want it to work with any groove or none, so that I don't need the jazz ride on to hear it.
27. As a drummer with a jazz groove on, I want my hi-hat foot setting to replace the groove's own 2 & 4, so that the foot never plays two patterns.
28. As a drummer, I want it written on the staff in the feet part, so that the notation shows what's played.
29. As a drummer, I want it remembered per exercise and exported with it, so that a drill keeps its ostinato.
30. As a drummer, I want it to follow the groove volume, so that the settings don't get another slider.

## Implementation Decisions

### Exercise core (the test seam)

- **`parsePattern(text)`:** returns the pattern as a list of steps (`'R' | 'L' | 'K' | '.'`), or an error.
  - Case doesn't matter, and whitespace is ignored.
  - Any other character, or a pattern with no steps, is an error.
- **Pattern fill** (an `EditCommand` such as `fillPattern { bar, pattern, grid }`, plus a pure helper the New-from-pattern path shares):
  - Every beat of the bar goes on the chosen grid (sixteenths: 4 positions, triplets: 3). The pattern steps are laid on the positions in order, starting from step 0 on beat 1, repeating.
  - R and L are snare notes, K a kick-row note, `.` a rest in both rows. Each note holds until the next hit in its row or the end of the beat (the default holds).
  - It replaces both rows of the bar and is one undo step.
  - Sticking: if the exercise's mode is off, it becomes natural. Then each snare note whose computed hand differs from the typed one gets a sticking override, and any override that matches the computed hand is dropped. In a full sixteenth stream, natural sticking matches most patterns, so few overrides are written.
- **New from pattern:** `exerciseFromPattern({ id, now, folderId, pattern, grid, bars })` makes a new exercise: the pattern carried on across all its bars (bar 2 starts where bar 1 stopped), named after the pattern as typed with spaces tidied, natural sticking, and the usual new-exercise defaults otherwise (ADR 0007: straight).
- **Kicks in the gaps** (an `EditCommand` such as `kicksInGaps { bars: 'cursor' | 'all' }`):
  - In each beat, on the grid that beat is already on, every grid position where neither row strikes becomes a kick.
  - A snare or kick note's hold covering that position is cut short there.
  - An empty beat (rests in both rows) is on the sixteenth grid and gets four kicks.
  - The sticking mode and overrides are untouched. It is one undo step.
- **K in the sticking line:** the sticking (`sticking.ts`) also lists struck kick-row notes that don't share a tick with a struck snare note, shown as `'K'` (a `Hand | 'K'` or a separate kind), except with sticking off. Kick notes never carry an override; long-press and flip skip them as now.
- **Hi-hat foot:**
  - A new practice setting `hihatFoot: 'off' | 'one' | 'quarters' | 'twoAndFour' | 'ands'`, `'off'` by default.
  - The schema version goes up. Migration and import give stored exercises `'off'`. Export carries it.
  - The playback schedule and the notation take the groove's hits with any hi-hat foot hits removed when the setting isn't off, plus the setting's hits (instrument `hihatPedal`, the groove's `HIHAT_FOOT` notation). It plays at the groove volume.
  - It is written in the feet part by the existing rules (ADR 0004).
  - Examples take it like other practice settings: changeable, not kept.

### App

- **Pattern dialog:** one small dialog shared by both entry points. It has:
  - a text field for the pattern, with the inline error under it and the Fill (or Create) button disabled while it's invalid;
  - a 16ths | triplets segmented control (default 16ths);
  - in New from pattern only, a Bars field (default 4, 1–64).
  - Enter submits, Escape cancels. On the phone the field is 16 px (iOS focus zoom) and the dialog is full width.
- **Bar ⋯ menu:** gains "Fill with pattern…", "Kicks in the gaps: this bar" and "Kicks in the gaps: every bar". Hidden on examples, as other editing items.
- **Library:** a **New from pattern** button beside New. The new exercise opens, filed in the open folder if there is one.
- **Hi-hat foot control:** in the Settings sidebar's Groove section, under the preset, a segmented control or select: Off / On 1 / Quarters / 2 & 4 / &s.

## Testing Decisions

- **One seam: the exercise core's public interface**, as before. For example:
  - "`parsePattern('rlrk rlkk')` is `RLRKRLKK`, and `'RLX'` is an error";
  - "filling bar 1 with `RLKK` on sixteenths gives snare on the 1st and 2nd sixteenths and kicks on the 3rd and 4th of every beat, and no overrides under natural sticking";
  - "`RLK` on sixteenths starts beat 2 on L";
  - "a fill on an exercise with sticking off turns natural sticking on";
  - "`exerciseFromPattern` with `RLK` and 2 bars starts bar 2 where bar 1 stopped";
  - "kicks in the gaps turns `RLRL RL.L RLR. RLRL` into kicks on the 7th and 12th sixteenths and cuts a hold short";
  - "a lone kick shows K, and a kick under a snare note shows the hand";
  - "with `hihatFoot: 'one'` and the jazz groove, the schedule has one hi-hat foot hit per bar, on 1";
  - "an exercise stored at the previous schema version migrates with `hihatFoot: 'off'`".
- **Not tested automatically:** the dialog, the menu items and the hi-hat foot control. These are checked in the browser with real pointer and keyboard events at 1280 px and at 390 × 844 (touch). The hi-hat foot sound is checked by ear by the user.

## Out of Scope

- A hand and a kick at the same time (`R+K`). A separate feature.
- A clickable hi-hat foot row, or `H` in patterns (ADR 0010 keeps the door open).
- A live preview in the pattern dialog.
- Accents and orchestrating the hands round the toms.
- Built-in kick drill examples (they can be made with New from pattern).
- The clean-tempo tracker and the practice log, deferred until after this feature.

## Further Notes

- The tickets for this spec are in `issues/`. 01, 02, 04 and 05 can start at once; 03 comes after 02.
