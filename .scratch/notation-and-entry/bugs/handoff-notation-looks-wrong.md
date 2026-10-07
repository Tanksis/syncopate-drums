# Handoff: the merged notation doesn't look right

**Date:** 2026-10-07. **Status:** done. Fixed on `fix/notation-merged-parts` (ADR 0004): a bar where the feet only play with the hands is one voice, and a groove note holds until its own part's next note.

## What the user reported

"This does not look right to me … the notation does not look right at all."

Screenshots, all in this folder:

- `ours-after-pr25.png`: the app now (jazz groove; snare on the & of 2 and on beat 4; cursor on beat 4).
- `ours-v1.png`: the same bar before this feature (exercise voice stems down, its own rests).
- `groove-scribe-reference.png`: the look the user is aiming for. Hands stems up, sharing stems; kick and hi-hat foot stems down below the staff as plain quarters; no clutter.

The user hasn't yet said exactly what looks wrong. **Start by asking them to name each problem against the Groove Scribe picture before changing code.** Then confirm what's below.

## What I can see in `ours-after-pr25.png` (unconfirmed, ranked)

1. **Hi-hat foot drawn as flagged eighths.** On 2 and 4 the hi-hat foot is drawn as eighths with flags; it should be quarters (Groove Scribe draws plain stems). Likely cause, confirmed by reading: `staffParts` (`src/core/staffParts.ts`) gives groove notes the length that `grooveChords` (`src/core/groove.ts`) gives them. `grooveChords` measures holds across *all* groove instruments together, so the hi-hat foot on 2 only lasts until the ride's & of 2. In the feet part, a note should hold until the feet part's next note (or the end of its beat or bar, whichever the spelling rules want), not until the next ride hit.
2. **Sticking (R/L) is missing under the snare notes.** v1 showed L and R here. This may just be sticking set to off on that exercise. Check it, and if sticking is on, check where the sticking labels are attached in `src/features/notation/staff.ts` (they were moved to attach by note id inside chords in ticket 06).
3. **Feet part has nothing on 1 and 3.** That's by design: a part with only groove notes shows no rests. It may still read oddly next to flagged eighths. Re-judge it once (1) is fixed.
4. Anything else the user names: accents, spacing, stem lengths, the beam on 4-&, the x notehead on the hi-hat foot sitting on the bottom line.

## Context to read (pointers, don't re-derive)

- Spec: `.scratch/notation-and-entry/spec.md`, the "Staff parts" and "Notation renderer" decisions. Story 54 was changed during the build: no ties under later chords.
- ADR: `docs/adr/0002-hands-up-feet-down.md`.
- Glossary: `CONTEXT.md` (hands part, feet part, hold, groove layer).
- Code: `src/core/staffParts.ts` (+ `staffParts.test.ts`), `src/core/groove.ts` (`grooveChords`), `src/features/notation/staff.ts` (the VexFlow adapter).
- The core is the only test seam; `staffParts.test.ts` asserts onsets and rests but evidently not the feet part's durations under jazz. Lock the fix down with a failing test there first. For example: jazz, any snare line → the feet part's hi-hat foot on 2 and 4 are quarters.
- Check by eye in the browser (`npm run dev`) with real mouse clicks. The memory note "verify clicks with a real mouse" applies to anything clickable in the SVG.

## Suggested way in

New session → `/mattpocock-skills:diagnosing-bugs` pointed at this file. It wants a tight feedback loop (a failing core test) before theorising, which fits (1). Ship the fix as `fix/notation-merged-parts` with a PR (self-merge on green CI is fine per the user's standing rule).
