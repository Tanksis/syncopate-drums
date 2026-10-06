# Sticking override input

Type: grilling
Status: resolved
Blocked by: 10

## Question

How does the user set, change and clear a sticking override on a note?

- Mouse: click the R/L under a note to cycle auto → R → L (as in the grid editor prototype)?
- Keyboard: a Normal-mode key (`r` is taken by replace-beat) or the free Insert-mode top-row keys (Q W E R Y)? How is a single note within a beat targeted when the cursor moves by beat?
- How an override is shown so it's distinguishable from computed sticking, and how to clear all overrides in an exercise.
- With sticking mode **off** (see [Screen layout](10-screen-layout.md)), are overrides hidden, or do they still print on their own notes? Where the override controls sit in layout A (notation view vs. beat strip).

## Answer

Decided with the user in a grilling session (2026-10-06). The user accepted every recommendation.

- **Click flips.** Clicking the R/L under a note in the notation view sets the *opposite* hand as an override. Clicking again clears the override back to the computed hand. There are two states, so there's never an override that changes nothing you can see. Hovering shows "override, click to reset".
- **Keyboard: Alt+1–4** flips note 1–4 of the beat under the cursor, the same action as a click. It counts notes actually struck: rest positions and tied continuations aren't counted, so `.x.x` uses Alt+1 and Alt+2. It does nothing if the beat has fewer notes. Works in Insert and Normal mode and with vim keys off. The top letter row stays free.
- **Display**: an override is printed in an accent colour, in the same font and size as computed sticking.
- **Clear all**: a "Reset overrides (n)" button in the right sidebar's Sticking group, disabled when n = 0. No confirm dialog: it's one undo step.
- **Sticking mode off**: overrides are hidden but kept (as with the bass drum voice), and clicking under notes does nothing.
- **Where**: overrides are set only in the notation view (click) and with the keyboard chord on the cursor beat. The beat strip shows no sticking.
- **Undo and saving**: each flip is one undo step and counts as a change for autosave and for the "discard an unchanged new exercise" rule.
