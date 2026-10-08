# 02: Example exercises on first launch

**What to build:** The core's example set (four original exercises), and adding it at launch on a device with an empty library that hasn't had the examples, opening the first. See [spec](../spec.md) stories 7–10 and 12–16.

**Blocked by:** None. Easiest after 01, so the swing values read as intended.

**Status:** done

- [x] `exampleExercises({ newId, now })` returns the four examples in the spec's order, named "Example: …", built through `setBeat`. Tested: every bar adds up to four beats in both rows; two calls differ only in ids
- [x] Musical facts tested: the jazz comping example, with swing on, writes the snare's & of 2 in bar 1 on the let; the triplets example's alternate sticking alternates through every note; the rock beat's kick row is in the feet part under the hi-hat
- [x] `DeviceSettings.examplesAdded` (default false); existing stored device settings load with it false
- [x] A pure launch rule: add examples only when the library is empty and `examplesAdded` is false. Tested for all three cases
- [x] `launchApp` stores the examples, sets `examplesAdded`, and opens the first example; storage failure still gives an unsaved Untitled exercise
- [x] Checked in the browser on a fresh profile: the first launch shows the examples with the first one open; deleting them all and reloading gives a new Untitled exercise, not the examples again

## Comments

- 2026-10-08: The rock beat's bar 2 kick line is tuned from `x... ..x. ..x. ....` to `x... ...x ..x. ....`. With every kick on an eighth, ADR 0004 writes both bars as one voice (the kicks hang on the hi-hat's stems), so the kick row never reached the feet part. Now bar 1 shows one voice and bar 2 the feet part. Browser check (headless Chromium, fresh profile, real mouse clicks): first launch lists the four examples with "syncopated eighths" open; deleting all four and reloading gives one Untitled exercise.
