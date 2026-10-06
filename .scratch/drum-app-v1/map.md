# Map: Drum practice app v1

Label: wayfinder:map

## Destination

A v1 spec for a laptop-first web app, with the platform, data model, notation rendering, audio/playback approach and feature scope all decided, ready to hand to `/to-spec` → `/to-tickets` → `/implement`.

## Notes

- **Domain**: drum practice. Use the vocabulary in `CONTEXT.md` (Exercise, Bar, Note, Voice, Sticking, Groove layer, Swing feel, Notation view, Grid editor, Click, Count-in).
- **Skills**: grilling tickets call `grilling` + `domain-modeling`; prototype tickets call `prototype`; research tickets call `research`. Keep `CONTEXT.md` a glossary only.
- **Prior research**: [OMR / camera import](../../docs/research/omr-drum-notation.md): no off-the-shelf drum OMR; camera import deferred.
- **User**: a single user (the author) for now; may become a public app later, so avoid choices that block that, but don't build for it.
- **Practice setup**: laptop + e-drum kit with headphones. (iPhone + practice pad is a later effort.)
- Research findings go in `docs/research/<name>.md` (the repo has no commits yet, so no `research/*` branches).

### Settled while charting

- **Platform**: web app, laptop first. iPhone support is out of scope for this map.
- **User**: just the author; no accounts.
- **v1 core loop**: enter an exercise in the grid editor → pick sticking mode (R/L shown under notes) → optionally add a groove preset → play it, loop it, set BPM, practice along with the click. Includes a count-in and a saved list of exercises.
- **Exercise** = one line of a method book (several bars); you can loop the whole thing or a bar range.
- **Sticking**: alternate, natural, or off (as defined in `CONTEXT.md`), computed automatically, with per-note overrides and a lead-hand setting.
- **Groove layer**: shown on the same staff above the exercise (stems up). v1 is a preset list: jazz ride + hi-hat on 2 & 4 (default); the same + feathered bass drum on all 4; straight eighths on hi-hat.
- **Swing feel**: one setting with an adjustable amount; applies to the exercise *and* the groove layer, independent of whether a groove layer is on.
- **Notation scope**: 4/4 only; quarters, eighths, sixteenths, eighth-note triplets, rests, ties, dotted notes.
- **Voice**: an exercise has one voice (snare by default, switchable to bass drum).
- **Views**: notation view (for reading) + grid editor (for input, by beat figure), mirrored live. Current note highlighted during playback.
- **Metronome**: click on every quarter note with beat 1 accented, one-bar count-in, 30–300 BPM, separate volumes for click / exercise / groove layer (the exercise can be muted).
- **Sound**: built-in drum samples; no MIDI in v1.
- **Storage**: each device keeps its own exercises; no sync.

## Decisions so far

<!-- one line per closed ticket: [title](link): gist -->
- [Notation rendering library](issues/01-notation-rendering-library.md): VexFlow 5 (MIT), drawn directly from our exercise model; we do line wrapping ourselves. alphaTab is the heavier fallback.
- [Browser audio engine and drum sounds](issues/02-browser-audio-engine.md): our own Web Audio lookahead scheduler (Tone.js as fallback, since its swing moves triplets); swing is a per-beat warp of binary-grid notes only; highlight via getOutputTimestamp; Virtuosity Drums (CC0) samples plus a synthesized click.
- [Exercise data model and sticking rules](issues/03-exercise-data-model.md): symbolic bars (durations, dots, one-beat triplet groups, ties) with derived 12-per-beat ticks; practice settings remembered per exercise; natural sticking uses a per-beat grid (straight beats start on lead, triplet runs alternate); overrides stored on the note and affect only that note.
- [Swing and groove playback check](issues/04-swing-groove-playback-check.md): default swing 66.7%, automatically straighter as tempo rises (full to 120 BPM, straight by 320); triplets never swung; sixteenths swung proportionally; Virtuosity samples and own scheduler confirmed; groove layer louder by default.
- [Grid editor interaction](issues/05-grid-editor-interaction.md): beat figures only (pick one figure per beat from a palette; tie into a beat for longer notes); spelling is always automatic; no step grid or typed entry.
- [Tech stack and storage](issues/06-tech-stack-and-storage.md): TypeScript + Vite SPA, React + Zustand; IndexedDB via `idb` (versioned, persistent storage requested); static host + PWA; pure timing/sticking core tested with Vitest, no end-to-end tests.
- [Beat figure palette](issues/07-beat-figure-palette.md): all 22 hit-only figures on keyboard rows (1–0 straight, A–H triplets, Z–B rarer straight, Space rest), T tie, `.` cut short; vim-style modal editor opening in Insert mode, with arrows/Ctrl keys working in both modes and a `?` legend.
- [Export and import](issues/08-export-and-import.md): one JSON format for any selection of exercises (content + practice settings, no global settings), versioned and migrated like the database; newer or malformed files refused whole; id conflicts asked once (Replace / Keep both / Skip); import only merges, never deletes.
- [Exercise library](issues/09-exercise-library.md): free-text, non-unique names; autosave; new = one bar of rests with fixed defaults, "Untitled", discarded if left unchanged; flat list by last opened with a name filter; checkbox selection for export/delete (confirm dialog); import matches by id only; launch opens the last exercise.
- [Screen layout](issues/10-screen-layout.md): layout A, three columns (library sidebar | header, notation, editor panel with strip + palette | settings sidebar); 4 bars per line; click bar numbers to loop; Ctrl+Space plays. Also: library order stable while open, sticking mode "off", swing presets, vim keys can be turned off, ✕ to delete a bar.
- [Sticking override input](issues/11-sticking-override-input.md): click the R/L (or Alt+1–4 on the cursor beat) to flip to the other hand, click again to clear; overrides in an accent colour; "Reset overrides (n)" in the Sticking sidebar; hidden but kept when sticking is off.
- [Alternate sticking and looping](issues/12-alternate-sticking-and-looping.md): sticking is computed once over the whole exercise and always played as printed; loop repeats restart (an odd count gives a double at the seam) and a narrowed loop range keeps the printed hands.

## Not yet specified

- **Static host choice**: GitHub Pages vs. Cloudflare Pages/Netlify for the PWA. Deferred by the user; decide when the repo gets a remote.
- **Assembling the spec**: every ticket is now settled, so the way is clear. The final pass combines the decisions above into the v1 spec (`/to-spec`).

## Out of scope

- **Camera/photo import**: deferred until after v1. A separate effort should start with the Claude-vision trial and the 30-photo test set from the [research](../../docs/research/omr-drum-notation.md).
- **iPhone / mobile support**: the user chose laptop first; mobile adds too many decisions for now.
- **MIDI in (timing feedback) and MIDI out (e-drum module sounds)**: after v1.
- **Sync between devices / accounts**: to be discussed later (possibly with the public-app question).
- **Time signatures other than 4/4**.
- **Editable groove layer** (beyond presets).
- **Swing on the groove layer only** (exercise straight): the alternative to the chosen swing approach.
- **Step-grid and typed-line entry**: the user tried both in the [Grid editor interaction](issues/05-grid-editor-interaction.md) prototype and chose beat figures only.
- **Multi-voice exercises** (splitting a line between snare and bass drum).
- **Tags, folders or book grouping in the exercise library**: a flat list with a name filter was chosen in [Exercise library](issues/09-exercise-library.md).
- **"Swap hands each pass" practice option** (lead hand flips at every loop repeat): sticking always plays as printed, per [Alternate sticking and looping](issues/12-alternate-sticking-and-looping.md); flip the lead hand by hand instead.
- **Tempo ramp** (BPM rising automatically across loops): the user changes the BPM by hand as they practise; see [Tempo ramp](issues/13-tempo-ramp.md).
