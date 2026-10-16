# 01: Time signatures in simple time: 4/4, 3/4 and 2/4

**What to build:** An exercise has a time signature, picked in a new **Time** group above Groove: 4/4, 3/4 or 2/4 for now (6/8 and 12/8 come in 02). The editor, the notation, playback, the click, the count-in, the beat count and the position label all follow the bar's beats. Changing the time signature cuts or pads each bar and can be undone. The groove presets and the hi-hat foot play the bar's beats, and the hi-hat foot drops 2 & 4 outside 4/4. Schema 5 adds the time signature, and old exercises come in as 4/4. Desktop and phone. See [spec](../spec.md), stories 1–7, 18 and 20, and Implementation Decisions › Model, Changing the time signature, Schedule, Timeline and Transfer.

**Blocked by:** none

**Status:** done

- [x] `TimeSignature`, `TIME_SIGNATURES`, `meter()`, `barBeats()`, `restBar(beats)`; `BEATS_PER_BAR` and `TICKS_PER_BAR` gone
- [x] `Exercise.timeSignature` as an undoable exercise setting; the `setTimeSignature` editor command and a pure `withTimeSignature`, unit-tested (cut, pad, ties, undo)
- [x] Editor, speller, sticking, pattern fill, kicks in the gaps, schedule, timeline and notation work for any number of beats, with tests for 3/4 and 2/4
- [x] Groove presets and the hi-hat foot built for the bar's beats; `hihatFootOptions`; a hi-hat foot that doesn't fit is turned off
- [x] Schema 5 migration and import validation, with tests
- [x] The Time group's time signature chips on desktop, and in the phone's Groove tab
- [x] `CONTEXT.md`: Time signature for exercises
- [x] Checked in the browser at 1280 and 390 × 844: change with notes, Undo, play

## Comments

- 2026-10-16: Built. The core reads a bar's beats from `meter(exercise.timeSignature)` where it has the exercise, and from the bars themselves (`barBeats`) where it only has bars, such as in the speller and the staff parts. Import checks that every bar matches its time signature. The time-signature edit snapshots the hi-hat foot, so Ctrl+Z brings back a 2 & 4 that the change turned off. The review found that paste kept bars of the old length; pasted bars are now cut or padded to the current bar. The spec's line on ties over the barline was wrong: a change always drops or pads the last beat, so the next bar's first note is struck. Checked headless at 1280 (4 → 3 cards, 3/4 drawn, Undo, the count reading 1 2 3 while playing) and at 390 × 844 (Time signature first in the Groove tab, 3/4 drawn). The jazz preset's own hi-hat foot still plays on beat 2 in 3/4 and 2/4 until ticket 04 removes it.
