# Spec: Straight by default, and example exercises

Status: ready-for-agent

Source: the review after [ticket 04 of kick-row-and-beat-cards](../kick-row-and-beat-cards/issues/04-swing-written-as-triplets.md) (2026-10-08). Once swing was written as triplets ([ADR 0006](../../docs/adr/0006-swing-written-as-triplets.md)), the 66.7% default swing meant a fresh exercise showed any & as a triplet. A first launch also opens on an empty "Untitled" exercise that teaches nothing. Decisions: [ADR 0007 New exercises start straight](../../docs/adr/0007-new-exercises-start-straight.md). Vocabulary follows [`CONTEXT.md`](../../CONTEXT.md).

## Problem Statement

I enter a line from the book on a new exercise, say `x.x.` on beat 1, and the notation draws a triplet. ADR 0006 meant that to happen only once I turn swing on, after I've checked the line against the book. But every new exercise starts at 66.7% swing, so it happens straight away, with no groove on, and it looks like the app misread me.

When someone opens the app for the first time, they get one empty bar called "Untitled". Nothing shows what an exercise looks like, what the kick row or a groove is for, or how swing and sticking read.

## Solution

New exercises start straight (swing 50%), so the notation is the book's until I choose a feel. Picking a jazz groove preset on an exercise that is straight turns swing to triplet (66.7%), since a jazz ride is never played straight. Picking any other preset leaves swing as it is. Exercises already saved keep their swing.

On a device's first launch with an empty library, the app adds a small set of example exercises and opens the first. They are ordinary exercises: original lines written in the style of a syncopation method book (not copied from one), each showing one part of the app. An "Add examples" button in the library adds a fresh copy of the set at any time.

## User Stories

### Straight by default

1. As a drummer, I want a new exercise to start with swing off (50%), so that the notation shows my line as the book prints it.
2. As a drummer, I want picking a jazz groove on a straight exercise to turn swing to triplet, so that the jazz ride sounds and reads swung without a second step.
3. As a drummer, I want picking a jazz groove to leave swing alone when I've already set an amount, so that my choice isn't overridden.
4. As a drummer, I want picking the hi-hat groove, or turning the groove off, to leave swing as it is, so that only the jazz grooves change the feel.
5. As a drummer, I want my saved exercises to keep their swing amount, so that nothing I've practised changes under me.
6. As a drummer, I want an untouched new exercise still recognised as untouched (and not saved), so that the library doesn't fill with blank exercises.

### Example exercises

7. As a first-time user, I want the library to open with a few example exercises, so that I can see and hear what the app does before I enter anything.
8. As a first-time user, I want the first example opened at launch, so that the first screen shows notation, sticking and the beat cards filled in.
9. As a drummer, I want the examples to be ordinary exercises that I can edit, rename, duplicate, export or delete, so that they work like everything else.
10. As a drummer, I want the examples added only once per device, so that deleting them is final unless I ask for them again.
11. As a drummer, I want an "Add examples" button in the library, so that I can get a fresh copy of the examples back, or see them on a device that already had exercises.
12. As a drummer, I want each example named for what it shows ("Example: …"), so that I can tell them from my own lines.
13. As a drummer, I want an example of syncopated eighths on the snare, swing off, natural sticking, so that I see how a book line is entered and read.
14. As a drummer, I want an example of jazz comping split between the snare and kick rows over the jazz ride, swing on, sticking off, so that I see the rows, the groove, and swing written as triplets.
15. As a drummer, I want an example rock beat (a kick row and a snare backbeat under the hi-hat eighths), so that I see a groove and both rows together.
16. As a drummer, I want an example on the triplet grid with alternate sticking, so that I see triplet beats and how sticking runs through them.

## Implementation Decisions

### Exercise core (the test seam)

- **Model.** `newExercise` sets `practice.swing` to 0.5 (`MIN_SWING`). `isUnchangedNew` follows it. No schema change and no migration: stored exercises keep their swing.
- **Groove.** `withGroove` turns swing to 2/3 when the new preset is a jazz preset (`jazz`, `jazzFeathered`), the previous one wasn't, and swing is at 50%. Otherwise it changes only the groove, as now.
- **Examples.** A new core module returns the example set, given an id factory and the time: `exampleExercises({ newId, now }): Exercise[]`, in the order below. Each is a valid v2 exercise built through the speller (`setBeat`), so its spelling is the app's own. These lines are the starting point and may be tuned during implementation:
  - *Example: syncopated eighths*: 4 bars, 80 BPM, groove off, swing 50%, natural sticking, lead R. Snare row by beat: `x... x.x. x... x.x.` / `..x. x... ..x. x...` / `x.x. ..x. x.x. ..x.` / `x... ..x. ..x. x...`. Kick row rests.
  - *Example: jazz comping*: 4 bars, 100 BPM, jazz groove, swing 66.7%, sticking off. Snare: `.... ..x. .... ....` / `x... .... ..x. ....` / `..x. ..x. .... ....` / `.... x... .... ..x.`. Kick: `.... .... .... ..x.` / `.... ..x. .... ....` / `.... .... x... ....` / `..x. .... .... ....`.
  - *Example: rock beat*: 2 bars, 90 BPM, hi-hat eighths groove, swing 50%, sticking off. Snare: `.... x... .... x...` in both bars. Kick: `x... .... x.x. ....` / `x... ...x ..x. ....` (bar 2's kick on the a of 2 is off the hi-hat, so that bar writes the feet part; bar 1's kicks all land with the hi-hat and hang on its stems, ADR 0004).
  - *Example: triplets*: 2 bars, 70 BPM, groove off, swing 50%, alternate sticking, lead R. Snare on the triplet grid: `xxx xxx x.x x...` / `xxx .xx xxx x...` (`x...` is a plain quarter). Kick row rests.
- **Device settings.** A new `examplesAdded: boolean` (default `false`) records that this device has had the examples. Device settings are not exported.
- **Launch rule.** A pure function decides, from the stored exercises and the device settings, whether to add the examples at launch: only when the library is empty and `examplesAdded` is false.

### App

- **Launch.** When the rule says so, `launchApp` stores the examples, sets `examplesAdded`, and opens the first example instead of a new Untitled exercise. If storage can't be opened, the app runs on an unsaved Untitled exercise, as now.
- **Add examples.** A library button adds a fresh set (new ids) on top of the list, stores it straight away and opens the first. It also sets `examplesAdded`.

## Testing Decisions

- **One seam: the exercise core's public interface**, as before. Examples:
  - "a new exercise has swing 50%, and is unchanged-new";
  - "picking the jazz groove on a straight exercise sets swing to 66.7%; on one at 58% it stays 58%; picking the hi-hat groove leaves 50%";
  - "every example is a valid exercise whose bars each add up to four beats in both rows";
  - "the jazz comping example's staff, with swing on, writes the snare's & of 2 in bar 1 on the let";
  - "the triplets example's sticking under alternate, lead R, reads R L R L R L …";
  - "two calls give the same examples with different ids";
  - "examples are added at launch with an empty library and `examplesAdded` false; not with exercises stored; not once `examplesAdded` is true".
- **Not tested automatically:** the launch wiring and the button (checked in the browser on a fresh profile, with real mouse clicks).

## Out of Scope

- Lines copied from *Syncopation* or any other published book. The examples are original.
- An onboarding tour, tooltips or an empty-state hint. These belong to a later UI pass, with the notation size, narrow-window layout and vim-off-by-default ideas from the same review.
- Marking examples as read-only, or as a separate kind of exercise.
- Changing the swing of stored exercises.

## Further Notes

- *Syncopation* (Ted Reed) is still in copyright, and the app is public on GitHub Pages, so it ships only original examples. Users entering their own book pages for their own practice is unaffected.
