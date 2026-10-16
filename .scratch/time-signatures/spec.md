# Spec: Time signatures and the Groove redesign

Status: ready-for-agent

Source: the settings-redesign prototype's verdict (branch `prototype/groove-settings`, commit `bb5d7e8`, never merged). The parts that were not about time signatures went into the [new-user-polish spec](../new-user-polish/spec.md). In that prototype the time signature only changed the controls: the notation and the audio stayed in 4/4, and the compound patterns made no sound. On 2026-10-16 the user settled the three questions it left open:

- In 6/8 and 12/8 each beat is **three eighths only**: the three positions of today's triplet grid, written in compound style. There are no sixteenths inside a compound beat for now.
- Changing the time signature of an exercise that has notes **cuts or pads each bar**, and can be undone.
- In compound time the **BPM, the click and the beat count follow the dotted quarter**.

Vocabulary follows [`CONTEXT.md`](../../CONTEXT.md).

## Problem Statement

Every exercise is in 4/4. A drummer working on a waltz, a march in 2/4, or a 6/8 or 12/8 groove can't enter it. The Groove group is also harder to read than it should be. "Groove preset" mixes a pattern with a foot (the jazz ride and the feathered bass drum are two entries). Swing has a slider and a cramped row of presets. And picking the jazz ride changes the swing without saying so (new-user finding 7).

## Solution

- An exercise has a **time signature**: 4/4, 3/4, 2/4, 6/8 or 12/8. A new exercise starts in 4/4. The time signature is picked in a new **Time** group, above Groove.
- 3/4 and 2/4 work like 4/4 with fewer beats. 6/8 and 12/8 have two or four beats of three eighths. They are written with eighths beamed in threes and no triplet brackets, and they are counted and clicked in dotted quarters.
- **Swing** moves into the Time group as chips: Straight, Triplet, Dotted, and Custom (which shows the slider and the %). It is hidden in 6/8 and 12/8, where each beat is already three eighths.
- **Groove** becomes one **Pattern** picker: a list grouped by style, filtered by the time signature, each row with a short description and a strip of dots. Under it, a **Feet** sub-heading holds **Bass drum** (Off / Feathered) and **Hi-hat foot**. The hi-hat foot only offers what fits the meter.
- Picking a pattern may also set its feet and its swing. When it does, a quiet line under the picker says what changed and offers **Undo**.
- New patterns: **Bell** in 6/8 and **Shuffle** in 12/8.

## User Stories

### Time signature

1. As a drummer, I can set an exercise's time signature to 4/4, 3/4, 2/4, 6/8 or 12/8, on the desktop and the phone.
2. As a drummer, a new exercise starts in 4/4.
3. As a drummer, the notation shows the time signature at the start, and every bar has its beats.
4. As a drummer, the grid editor shows each bar's beats: three cards in 3/4, two in 2/4.
5. As a drummer, changing the time signature keeps each bar's first beats. Going 4/4 to 3/4 drops beat 4, and going 3/4 to 4/4 adds a rest beat. Ctrl+Z (or Undo) brings back what was there.
6. As a drummer, the click, the count-in, the beat count and the playback position all follow the bar's beats.
7. As a drummer, exporting and importing keep the time signature. An exercise from before this change imports in 4/4.

### Compound time

8. As a drummer in 6/8 or 12/8, each beat card has three positions: the three eighths of a dotted quarter. There is no 16ths | trip switch.
9. As a drummer in 6/8 or 12/8, the notation writes the beat as eighths beamed in threes, with no "3" bracket. A full beat is a dotted quarter, and two eighths held together are a quarter.
10. As a drummer in 6/8 or 12/8, the BPM counts dotted quarters, the click plays on each one, and the beat count reads 1 2 (6/8) or 1 2 3 4 (12/8).
11. As a drummer, moving an exercise between simple and compound time keeps each beat's downbeat and clears the rest of the beat, as the 16ths | trip switch does, and can be undone.
12. As a drummer, sticking works in compound time. Natural sticking puts the hands on the eighths, as on a run of triplet beats.

### Swing

13. As a drummer, swing reads **Straight**, **Triplet** or **Dotted**, and **Custom** shows the slider and the %.
14. As a drummer, an amount that isn't one of the three shows as Custom.
15. As a drummer in 6/8 or 12/8, swing isn't offered. A line says each beat is already three eighths, and nothing is swung.

### Groove

16. As a drummer, I pick a **Pattern** from one list grouped by style (Jazz, Rock & pop, Afro-Cuban, Blues), showing only the patterns that fit the time signature. Each row has a one-line description and a strip of dots, and the current one is ticked.
17. As a drummer, the bass drum (Off / Feathered) and the hi-hat foot are their own rows under **Feet**, and they play with any pattern, or with none.
18. As a drummer, the hi-hat foot offers only what fits the meter: everything in 4/4; no 2 & 4 in 3/4 or 2/4; and Off, 1 and Beats in 6/8 and 12/8.
19. As a drummer, picking **Ride** on a straight exercise also sets Triplet swing, and sets the hi-hat foot to 2 & 4 if it was off (4/4 only). A line under the picker says so, with **Undo**, and it can be dismissed.
20. As a drummer, changing the time signature turns off a pattern or a hi-hat foot that doesn't fit the new meter.
21. As a drummer in 6/8, I can play along with the **Bell** pattern. In 12/8 I can play along with **Shuffle**.
22. As a drummer, my exercises saved with the jazz ride, with or without the feathered bass drum, sound as they did.

### Examples

23. As a user, the examples are unchanged. They stay in 4/4.

## Implementation Decisions

### Exercise core (the test seam)

- **Model.** A `TimeSignature` type, `'4/4' | '3/4' | '2/4' | '6/8' | '12/8'`, and `TIME_SIGNATURES` in picker order. `meter(timeSignature)` gives `{ beats, compound }`: 4, 3, 2 simple; 2 and 4 compound. A beat is always `TICKS_PER_BEAT` (12) ticks. In compound time the beat is a dotted quarter, and its three eighths fall on the triplet grid's ticks 0, 4 and 8. So playback, the speller and sticking treat a compound beat as a triplet beat. Only the notation and the editor know the difference.
- `Exercise.timeSignature` sits at the top level beside `sticking`. It is what the exercise contains, not how it is practised. It is one of the `ExerciseSettings`, so undo and redo restore it.
- `BEATS_PER_BAR` and `TICKS_PER_BAR` go. Functions that only have the bars read the bar length from them (`barBeats(bars)`, the beats of the first bar: every bar of an exercise has the same length). Those that have the exercise use its meter. `restBar(beats)` and `restItems(beats)` take the number of beats.
- **Changing the time signature** is an editor command, `setTimeSignature`, recorded in the undo history like the sticking settings. `withTimeSignature(bars, from, to)` is pure. Each bar keeps its first `min(old, new)` beats. Each row's items are cut at that beat's end; a tie into a dropped beat is untied. A tie over the barline always comes from the bar's last beat, which a change of time signature either drops or follows with padded rests, so the next bar's first note is struck instead. Missing beats are filled with quarter rests. Between simple and compound time, each kept beat goes through `clearBeatToDownbeat` unless its grid already fits: a triplet beat fits compound time, and a sixteenth-grid beat fits simple time. The loop range is unchanged, since the bars stay. The pending grid is cleared.
- **The editor in compound time:** every beat reads on the triplet grid. `editorBeatViews` passes all beats as triplet beats. `toggleGridPosition`, `setHold`, `fillPattern` and `kicksInGaps` all treat every beat as triplet. `setBeatGrid` is refused, and `exampleAccepts` is unaffected. A pattern fill's grid is forced to triplets.
- **Schedule:** the click falls on every beat (`tick % 12 === 0`), so a compound bar clicks its dotted quarters. The count-in is one bar of the exercise's meter, and `advance` wraps at the exercise's bar length. Swing is ignored in compound time (`effectiveSwing` is straight). The triplet grid is never swung anyway.
- **Timeline:** `beatCountAt(position, beats)` takes the bar's beats. `positionLabel` reads only the tick, so it is unchanged.
- **Staff parts:** `staffParts(bars, groove, { … })` is unchanged in shape; the groove hits come for the meter (below). With `compound` set, `swung` is false. In compound time every beat is a triplet beat, so a groove's eighths are written on it.
- **Transfer:** `SCHEMA_VERSION` becomes 5. The v4 → v5 step adds `timeSignature: '4/4'`. Import refuses an unknown time signature, and a bar whose rows don't add up to its meter's bar.
- **Swing presets:** `SWING_PRESETS = [{ name: 'Straight', swing: 0.5 }, { name: 'Triplet', swing: 2/3 }, { name: 'Dotted', swing: 0.75 }]` live in the core, with `swingPreset(swing)`, which returns the matching preset (to within 1e-6) or undefined.
- **Patterns** replace groove presets. `GroovePresetId` becomes `PatternId`: `'off' | 'ride' | 'hihatEighths' | 'bell68' | 'shuffle128'`. Each `Pattern` has a `family`, `name`, `description` and `strip` (one character per eighth, `x` a hit), and the meters it fits. `patternHits(id, meter)` builds the bar's hits for that many beats:
  - **Ride:** ride on every beat, plus the & of beats 2 and 4. In 3/4 that's the & of beat 2 only, and in 2/4 the & of beat 2. Louder on the backbeats. No hi-hat foot of its own.
  - **Hi-hat 8ths:** eighths on the closed hi-hat in any simple meter.
  - **Bell** (6/8 only): the 6/8 bell on the ride bell (`rideBell`), `x.xxx.` over the bar's six eighths (1, 3, 4, 5), as the prototype's strip has it. Drawn as an x on the ride's line.
  - **Shuffle** (12/8 only): ride on the first and third eighth of each beat: `x.xx.xx.xx.x`.
  `patternsFor(timeSignature)` lists the families and their patterns that fit. None is always first.
- **Feet.** `PracticeSettings.bassDrum: 'off' | 'feathered'` is added. A feathered bass drum plays softly on every beat with any pattern, or with none. ADR 0010's rule, that the hi-hat foot replaces a preset's own, goes: no pattern has a hi-hat foot now. The hi-hat foot is only the setting. `hihatFootOptions(timeSignature)` gives the options that fit: all five in 4/4; all but 2 & 4 in 3/4 and 2/4; Off, 1 and Beats in compound time. `HIHAT_FOOT_TICKS` is built for the meter. In compound time, Beats falls on the dotted quarters.
- **Schema 6** (with the patterns): `groove` → `pattern`. `jazz` becomes `ride` with the hi-hat foot set to `twoAndFour` if it was off, so it sounds as before. `jazzFeathered` becomes the same plus `bassDrum: 'feathered'`. `hihatEighths` stays. Every exercise gets `bassDrum` (`'off'` unless it was migrated as feathered).
- **Picking a pattern** goes through `withPattern(exercise, id)`, which returns the exercise and what it also changed: `{ exercise, suggested: ('swing' | 'hihatFoot')[] }`. Ride on a straight exercise sets Triplet swing, as `withGroove` does today (ADR 0007). Ride sets the hi-hat foot to 2 & 4 when it is off and the meter offers 2 & 4. Moving from Ride to Ride changes nothing. The bass drum is never changed. `withTimeSignature` on the exercise also turns off a pattern or hi-hat foot that doesn't fit the new meter.

### App

- **Time group** (desktop sidebar, above Groove): **Time signature** chips (`Segmented`, 4/4 3/4 2/4 6/8 12/8), with a quiet "beats in threes" hint in compound time. Below them, **Swing**: chips Straight / Triplet / Dotted / Custom. Custom shows the slider and the % field under the chips. In compound time the chips are replaced by the line "Not used in 6/8: each beat is already three eighths." The time signature goes through the editor (undoable). Swing stays a practice setting.
- **Groove group:** the **Pattern** picker is a button styled like `SelectMenu` (`selectButtonClass`, `SelectButtonFace`), showing "Name · Family". It opens a listbox grouped by family, separated by hairlines, with a tick on the current row, its name, its dot strip and its description, as in the prototype. Then a sub-heading **Feet** (small, mute, with a hairline to its right), then **Bass drum** (Off / Feathered, the latter titled "Softly on every beat") and **Hi-hat foot**.
- **The note:** after a pick that changed something, a one-line `text-xs text-mute` line under the picker reads, for example, "Set the swing to Triplet and the hi-hat foot to 2 & 4." It has **Undo** (restores the swing and hi-hat foot as they were) and ✕. It is store state, so it goes away when another exercise opens or the pattern changes again.
- **Phone:** the Groove tab holds the Time rows, then a line, then the Groove rows, `large`, with no group headings. The prototype's `large` sizes are kept.
- **Grid editor:** the bar shows `beats` cards. In compound time, the beat card has no 16ths | trip switch, and its menu has no grid items.
- **Notation:** `stave.addTimeSignature(exercise.timeSignature)`, and the Voice is `numBeats`/`beatValue` from the meter (6/8 is 6 over 8). In compound time each event's written value comes from its ticks × 3/2: 4 ticks is an eighth, 8 a quarter, 12 a dotted quarter, 6 a dotted eighth, 2 a sixteenth. There are no tuplets, and the beams are grouped by dotted quarter (`3/8`). The sticking line uses the feet-without-triplets row.
- **Beat count** renders the meter's beats.
- **Library:** no change. The exercise's time signature isn't shown in the list.

### Docs

- `CONTEXT.md`: **Time signature** gains its exercise meaning (an exercise's own: 4/4, 3/4, 2/4, 6/8 or 12/8, counted in dotted quarters in 6/8 and 12/8), and "Exercises are always 4/4" goes. **Compound time** is added. **Groove preset** becomes **Pattern**. **Bass drum** (the feet's setting) is added. **Swing amount** gets the presets.
- A new ADR 0015, *Compound time is the triplet grid, written in eighths*: why compound beats reuse the triplet grid rather than a new grid, and what that leaves out (sixteenths in 6/8).
- ADR 0010 gets a note: superseded in part. Patterns no longer have a hi-hat foot of their own, so nothing is replaced.

## Testing Decisions

- Unit tests in `src/core/`, through the public interface, as the existing tests do:
  - `meter`, `restBar(beats)`, `barBeats`.
  - `withTimeSignature`: 4/4 → 3/4 cuts beat 4 and unties into it; 3/4 → 4/4 pads; 4/4 → 6/8 keeps triplet beats and clears straight ones to their downbeat; 6/8 → 4/4 keeps downbeats; a tie over the barline is struck instead; bars copied before the change paste in the new bar; and undo restores it through `applyEdit`.
  - The editor in 3/4 and 6/8: moving the cursor wraps at the bar's beats; a click in compound time puts a hit on the triplet grid; `setBeatGrid` is refused in compound time.
  - `schedule`: clicks per bar in 3/4, 2/4, 6/8 and 12/8; the count-in's length; no swing in compound time; the loop wraps at the bar's end.
  - `beatCountAt` with 3 and 2 beats.
  - `staffParts` in 6/8: the beats are triplet beats and the groove's eighths fall on them.
  - Migration v4 → v5 → v6, and import refusing a bad time signature or a bar of the wrong length.
  - `swingPreset`, `patternsFor`, `hihatFootOptions`, `patternHits` for each meter, `withPattern`'s suggestions.
- Browser checks with real mouse events (see the memory on real-mouse checks), at 390 × 844 and 1280 in light and dark: changing the time signature with notes and undoing it, the notation in each of the five, the picker, the note's Undo, and the phone's Groove tab.
- How the patterns and the click sound in each meter is left to the user's ear.

## Out of Scope

- Sixteenths inside a compound beat, and any meter not in the five, such as 5/4, 7/8 or mixed meters. Also a different time signature for each bar.
- Swing in compound time.
- Examples in other meters. The examples stay as they are.
- Filtering or grouping the Library by time signature.
- An editable groove, or more patterns than the four.
- Changing the Metronome screen's own time signature, which stays as it is.

## Further Notes

- The descriptions and the note's wording are drafts. The user may rewrite them in review.
- The 6/8 bell is the prototype's `x.xxx.`. The user may want another bell.
