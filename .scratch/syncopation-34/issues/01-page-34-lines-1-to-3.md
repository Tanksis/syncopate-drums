# 01: Syncopation page 34, lines 1–3, in a "Syncopation 34" folder

**What to build:** Three Library exercises, one per numbered line in the user's photo of the page (`C:\Users\eyadh\EyadDev\preview.webp`), filed in a folder named **Syncopation 34**. The rhythms must match the page exactly. The exercises are delivered as an **import file** that the user imports with the Library's Import button. No app code changes.

**Blocked by:** none

**Status:** needs-info: the photo is cropped at the right edge, so only bar 1 of each line can be read. The user needs to supply the rest of each line before this can be built exactly (see Open questions).

## Why an import file, not built-in examples

*Syncopation* is still in copyright and the app and repo are public (that's why the built-in examples are original; see ADR 0007/0008). So these exercises go only into the user's own Library, through import. The `.json` file is written **outside the repo** (to `C:\Users\eyadh\EyadDev\syncopation-34.json`) and is never committed.

## What the photo shows

- 4/4, written in bass clef as two voices: the snare is the upper voice (stems up) and the bass drum is the lower voice (stems down, a quarter note on every beat).
- Lines 2 and 3 open with a start-repeat barline. The app loops playback, so there's nothing to add for that.
- No sticking, accents or tempo are marked.

Transcription of bar 1 of each line, on the app's beat grid (one character per sixteenth, `x` = hit). The snare's quarters and eighths come from each hit lasting until the next one:

| Line | Snare, as written | Snare beats | Kick beats |
|---|---|---|---|
| 1 | e q e q q: hits on 1, 1&, 2&, 3, 4 | `x.x. ..x. x... x...` | `x... x... x... x...` |
| 2 | q e q e q: hits on 1, 2, 2&, 3&, 4 | `x... x.x. ..x. x...` | `x... x... x... x...` |
| 3 | q q e q e: hits on 1, 2, 3, 3&, 4& | `x... x... x.x. ..x.` | `x... x... x... x...` |

In every bar the kick has a beat with no snare hit (line 1: beat 2; line 2: beat 3; line 3: beat 4), so by ADR 0004 the app draws two voices, which matches the page.

## Acceptance criteria

- [ ] All bars of lines 1–3 are transcribed from the full page, not just the cropped bar 1, and the user confirms the transcription before the file is made
- [ ] The import file is a valid export (`format: 'drum-app-exercises'`, current `SCHEMA_VERSION`, one folder `Syncopation 34`), built with the core's own `newExercise` / `exportFile` so it passes `parseImport`. A throwaway script lives in the session scratchpad, not the repo
- [ ] Three exercises, named "Syncopation 34 · line 1" to "line 3" (or whatever the user picks), each in the folder
- [ ] Practice settings are the new-exercise defaults: straight (50% swing), no groove, sticking off
- [ ] Imported in the browser: the folder appears with the three entries, and each staff reads note for note like the page (the same snare rhythm with kick quarters, in two voices)
- [ ] The `.json` is outside the repo, and `git status` shows nothing from it

## Open questions

1. **The rest of each line.** The photo ends after bar 1 (line 3's barline is just visible at the right edge). How many bars does each line have? A photo of the full width of the page is needed.
2. **Folder name.** The request said "Syncopatation 34". Assumed to mean **Syncopation 34**.
3. **Exercise names.** Assumed "Syncopation 34 · line N".

## Comments
