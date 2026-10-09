# 01: Syncopation page 34, lines 1–3, in a "Syncopation 34" folder

**What to build:** Three Library exercises, one per numbered line in the user's photo of the page (`C:\Users\eyadh\EyadDev\preview.webp`), filed in a folder named **Syncopation 34**. The rhythms must match the page exactly. The exercises are delivered as an **import file** that the user imports with the Library's Import button. No app code changes.

**Blocked by:** none

**Status:** done (2026-10-08): `EyadDev/syncopation-34.json` made and checked in the browser

## Why an import file, not built-in examples

*Syncopation* is still in copyright and the app and repo are public (that's why the built-in examples are original; see ADR 0007/0008). So these exercises go only into the user's own Library, through import. The `.json` file is written **outside the repo** (to `C:\Users\eyadh\EyadDev\syncopation-34.json`) and is never committed.

## What the photo shows

- 4/4, written in bass clef as two voices: the snare is the upper voice (stems up) and the bass drum is the lower voice (stems down, a quarter note on every beat).
- Lines 2 and 3 open with a start-repeat barline. The app loops playback, so there's nothing to add for that.
- No sticking, accents or tempo are marked.

Each line is one bar. Below is the transcription on the app's beat grid: one character per sixteenth, `x` = hit, `t` = the note before is tied into the beat. A hit lasts only until the end of its beat, so each syncopated quarter needs a tie into the next beat:

| Line | Snare, as written | Snare beats | Kick beats |
|---|---|---|---|
| 1 | e q e q q: hits on 1, 1&, 2&, 3, 4 | `x.x. t.x. x... x...` | `x... x... x... x...` |
| 2 | q e q e q: hits on 1, 2, 2&, 3&, 4 | `x... x.x. t.x. x...` | `x... x... x... x...` |
| 3 | q q e q e: hits on 1, 2, 3, 3&, 4& | `x... x... x.x. t.x.` | `x... x... x... x...` |

In every bar the kick has a beat with no snare hit (line 1: beat 2; line 2: beat 3; line 3: beat 4), so by ADR 0004 the app draws two voices, which matches the page.

## Acceptance criteria

- [x] Lines 1–3 transcribed. The user confirmed that each line is one bar
- [x] The import file is a valid export (`format: 'drum-app-exercises'`, current `SCHEMA_VERSION`, one folder `Syncopation 34`), built with the core's own `newExercise` / `exportFile` so it passes `parseImport`. A throwaway script lives in the session scratchpad, not the repo
- [x] Three exercises, named "Syncopation 34 · line 1" to "line 3" (or whatever the user picks), each in the folder
- [x] Practice settings are the new-exercise defaults: straight (50% swing), no groove, sticking off
- [x] Imported in the browser: the folder appears with the three entries, and each staff reads note for note like the page (the same snare rhythm with kick quarters, in two voices)
- [x] The `.json` is outside the repo, and `git status` shows nothing from it

## Comments

- 2026-10-08: The user confirmed that each line is one bar. The folder name "Syncopation 34" and the names "Syncopation 34 · line N" were kept as assumed. The first try, without ties, spelled each syncopated quarter as an eighth and an eighth rest. Tying the crossed beat fixed it, and the staffs now read note for note like the page (e q e q q / q e q e q / q q e q e over kick quarters). The file was built with the core's `setBeat`, `toggleTie` and `exportFile`, and validated with `parseImport`. The import was checked headless with Playwright. The script stays in the session scratchpad.
