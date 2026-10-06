# Notation rendering library for the notation view

Research for ticket [01 Notation rendering library](../../.scratch/drum-app-v1/issues/01-notation-rendering-library.md). Checked on 2026-10-05 against npm, GitHub, the published package tarballs and the official docs.

## TL;DR

**Use VexFlow 5 (`vexflow` on npm, MIT), driven directly from our own exercise model.**

- It is a low-level drawing API: we build `StaveNote`s (with `keys`, `duration`, `stemDirection`), `Voice`s, `Beam`s, `Tuplet`s, `StaveTie`s and `Annotation`s from the exercise model ourselves. Nothing has to be serialised to MusicXML or a text format first.
- It has everything v1 needs for a drum staff: a `percussion` clef, x noteheads (`g/5/x2`), two voices on one stave with forced stem directions, triplets, ties, dots, rests, and `Annotation` text that can sit below a note (VexFlow's own percussion tests draw R/L sticking this way).
- Every rendered note is an `Element` with an id, an SVG group lookup (`getSVGElement()`) and `setStyle()`/`addClass()`. That makes it easy to highlight the current note from our own audio clock without using any library player.
- The cost: VexFlow does **no layout above the bar**. We choose how many bars go on a line and split the bars into rows ourselves. For 4/4-only exercises with a fixed number of bars per line, that is a small amount of code.

Runner-up: **alphaTab** (MPL-2.0). It does full layout, drum articulations, per-beat lyrics (could carry sticking), a bounds lookup and an external-clock cursor. But it is a whole-score engine with its own data model, player and worker setup, and it re-lays out the whole score on every change. It is heavier than this app needs. **OpenSheetMusicDisplay** is a poor fit: the input must be MusicXML (we would generate and re-parse XML on every grid edit) and it ships an old VexFlow 1.2.93. **abcjs** (MIT) is a workable text-based fallback.

## What v1 needs (from the ticket)

One percussion staff with two voices (groove layer stems up, using x noteheads for ride and hi-hat and the hi-hat foot below the staff; exercise stems down on snare or bass drum). 4/4 with quarters, eighths, sixteenths, eighth-note triplets, rests, ties and dots, beamed correctly for drum reading. R/L sticking under each exercise note. The current note highlighted by our own clock. Live re-rendering from the grid editor across several wrapped lines. A licence that allows a future paid app, active maintenance and a reasonable bundle size.

## Comparison

| | **VexFlow 5** | **alphaTab** | **OpenSheetMusicDisplay** | **abcjs** | Verovio |
|---|---|---|---|---|---|
| npm / version | `vexflow` 5.0.0 (2025-03-05); repo `main` is at 5.1.0, not yet released | `@coderline/alphatab` 1.8.4 (2026-07-05) | `opensheetmusicdisplay` 2.2.0 (2026-10-02) | `abcjs` 6.7.1 (2026-09-21) | `verovio` 6.3.0 |
| Licence | MIT | MPL-2.0 (file-level copyleft) | BSD-3-Clause | MIT | LGPL-3.0-or-later |
| Input | JS/TS object API (and `EasyScore` strings) | Its own `Score` model, alphaTex, Guitar Pro, MusicXML | MusicXML only | ABC text | MEI / MusicXML / Humdrum / ABC |
| Percussion clef, x noteheads | Yes (`clef: 'percussion'`, `x0`–`x3` noteheads) | Yes (GP drum articulations, e.g. ride, hi-hat, pedal hi-hat) | Yes (from MusicXML `<unpitched>` / `<notehead>`) | Yes (`clef=perc`, `!style=x!`, `%%percmap`) | Yes |
| Two voices with stem directions | Yes (`stemDirection`, several `Voice`s per stave) | Yes (`\voice`) | Yes (from MusicXML) | Yes (`V:` voices) | Yes |
| Sticking text under notes | `Annotation` with `VerticalJustify.BOTTOM` | Per-beat `lyrics` | MusicXML `<lyric>` | `"_R"` annotations / `w:` lyrics | Yes |
| Layout / line wrapping | **Manual** (we place bars into rows) | Automatic | Automatic | Automatic | Automatic |
| Per-note highlight from our clock | `getSVGElement()`, `setStyle`, `addClass` per note | `boundsLookup` + `customCursorHandler`, external-media mode | Cursor API + per-note SVG lookup | Per-element SVG classes + timing callbacks | SVG ids per element |
| Live re-render cost | Clear and redraw SVG synchronously; we control what changes | Full re-layout, async (worker) | Re-parse MusicXML, then re-layout | Re-parse ABC, then re-layout | WASM re-render |
| Size (minified, gzipped by me) | core 91 KB + font; all-in `vexflow-bravura` 387 KB (font embedded as base64) | 278 KB JS + Bravura woff2 313 KB (+ optional soundfont) | 352 KB (includes VexFlow 1.2.93) | 148 KB | ~27 MB unpacked (WASM) |
| Maintenance | Active community org (`vexflow/vexflow`, last push 2026-09-16); release cadence is slow | Very active (pushed 2026-10-05) | Very active (pushed 2026-10-05) | Active (6.7.1, 2026-09) | Active |

Sources for every cell are listed in the sections below.

## Details

### VexFlow 5 (recommended)

- **Status and licence.** VexFlow development moved from `0xfe/vexflow` (README: "To follow the current work on VexFlow 5, see https://github.com/vexflow/vexflow"; last push 2025-03-05) to `vexflow/vexflow`, which is MIT and was last pushed on 2026-09-16. The npm `latest` tag is 5.0.0 (2025-03-05), while the repo's `package.json` already says 5.1.0, so the next release is unpublished. [0xfe README](https://github.com/0xfe/vexflow/blob/master/README.md), [vexflow/vexflow](https://github.com/vexflow/vexflow), [LICENSE](https://github.com/vexflow/vexflow/blob/main/LICENSE), [package.json](https://github.com/vexflow/vexflow/blob/main/package.json), [npm](https://www.npmjs.com/package/vexflow)
- **API.** It offers a high-level `Factory`/`EasyScore` API and a low-level native API (`Renderer`, `Stave`, `StaveNote`, `Voice`, `Formatter`). Output is SVG or Canvas. [README](https://github.com/vexflow/vexflow/blob/main/README.md)
- **Drum features** (checked in the 5.0.0 tarball, `build/esm/src` and `build/esm/tests`):
  - A `percussion` clef exists (`clef.js`).
  - Notehead codes are added as a key suffix: `X0`–`X3` (X whole, half, black, circle-X), plus diamond, triangle and square heads (`tables.js`, `codeNoteHead`). Example: `keys: ['g/5/x2']`.
  - `percussion_tests.js` draws drum grooves: an x-head voice with stems up over a snare/kick voice with `stemDirection: -1`, chords that mix heads (`['d/4/x2','c/5']`), dotted 8th + 16th, and **R/L sticking via `Annotation({ text: 'R' })`**. [percussion_tests.ts](https://github.com/vexflow/vexflow/blob/main/tests/percussion_tests.ts)
  - `Annotation` supports `VerticalJustify.TOP | CENTER | BOTTOM | CENTER_STEM`, so sticking can go under the staff. [annotation.ts](https://github.com/vexflow/vexflow/blob/main/src/annotation.ts)
  - `Beam.generateBeams(notes, { groups, stemDirection, beamRests, maintainStemDirections })` beams automatically with configurable groups (for example one beam group per quarter for drum reading). Beams can also be built by hand. [beam.ts](https://github.com/vexflow/vexflow/blob/main/src/beam.ts)
  - `Tuplet` (bracketed or ratioed options), `StaveTie`, `Dot` and `GhostNote` (an invisible spacer) are available. [src/](https://github.com/vexflow/vexflow/tree/main/src)
- **Highlighting.** `Element.getSVGElement(suffix)` looks up the note's SVG group by id. `Element.setStyle()`, `addClass()` and `StaveNote.setKeyStyle()` restyle a note. So our clock can map "note index → element" and toggle a CSS class without redrawing. [element.ts](https://github.com/vexflow/vexflow/blob/main/src/element.ts), [stavenote.ts](https://github.com/vexflow/vexflow/blob/main/src/stavenote.ts)
- **Layout.** OSMD's README states the limitation directly: "each measure and symbol has to be created and positioned by hand in Javascript". VexFlow formats notes within a bar or `System`, but it does not break a score into lines. [OSMD README](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/blob/develop/README.md)
- **Fonts and bundle.** There are three entry points: `vexflow` (all fonts), `vexflow/bravura` (Bravura + Academico), and `vexflow/core` (no fonts; load them with `VexFlow.loadFonts`/`setFonts`). The bravura entry calls `Font.load(...)` asynchronously, so the first render should wait until the font has loaded. Sizes I measured (min + gzip -9): core 91 KB, bravura 387 KB, full 690 KB. [package.json exports](https://github.com/vexflow/vexflow/blob/main/package.json), [entry/vexflow-bravura.ts](https://github.com/vexflow/vexflow/blob/main/entry/vexflow-bravura.ts)

### alphaTab (runner-up)

- MPL-2.0. Ships JS, .NET and Kotlin from one codebase. Supports Guitar Pro, MusicXML, Capella and alphaTex input, and draws standard notation, drum tabs, lyrics and more. [README](https://github.com/CoderLine/alphaTab), [alphatab.net](https://alphatab.net/)
- **Percussion.** A track set to `\instrument percussion` takes articulation names as notes, for example `(KickHit RideBell).16`. `\articulation defaults` registers the GP7 list (for example `Snare (hit)` 38 and `Kick (hit)` 36). The docs say custom noteheads cannot be defined in alphaTex. [staff metadata docs](https://github.com/CoderLine/alphaTabWebsite/blob/main/docs/alphatex/_staff-metadata.mdx), [percussion](https://alphatab.net/docs/alphatex/percussion)
- **Voices** come from `\voice`, and **sticking** could use the per-beat property `{lyrics "R"}`. [document structure](https://github.com/CoderLine/alphaTabWebsite/blob/main/docs/alphatex/document-structure.mdx), [beat properties](https://github.com/CoderLine/alphaTabWebsite/blob/main/docs/alphatex/_beat-properties.mdx)
- **Highlighting.** `boundsLookup` exposes `staffSystems > bars > beats > notes` bounds (since 1.5). `customCursorHandler` exists since 1.8.1. Player mode "External Media" syncs alphaTab's cursor to an outside clock. [boundsLookup](https://github.com/CoderLine/alphaTabWebsite/blob/main/docs/reference/api/boundslookup.mdx), [customCursorHandler](https://github.com/CoderLine/alphaTabWebsite/blob/main/docs/reference/api/customcursorhandler.mdx), [playerMode](https://alphatab.net/docs/reference/settings/player/playermode)
- **Downsides for us.** Our model would have to be converted into its `Score` model or alphaTex, and every edit re-lays out the whole score. Its articulation mapping follows Guitar Pro, not our own staff positions. Bundle: 278 KB gz JS + 313 KB Bravura woff2 (from the 1.8.4 tarball). MPL-2.0 is fine for a closed-source app as long as we don't modify alphaTab's own files; any changes to those files must stay MPL ([MPL-2.0 FAQ](https://www.mozilla.org/en-US/MPL/2.0/FAQ/)). **Unverified:** whether alphaTab's beaming can be set per quarter for drum reading in every case.

### OpenSheetMusicDisplay

- BSD-3-Clause. It "renders MusicXML sheet music in the browser" and "Uses Vexflow for rendering and (partly) layout". [README](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/blob/develop/README.md)
- It has percussion options (`percussionOneLineCutoff`, `PercussionUseXMLDisplayStep` in `OSMDOptions`/`EngravingRules`) and per-note SVG access (`VexFlowGraphicalNote.getSVGGElement`). Checked in the 2.2.0 tarball's `.d.ts` files.
- It depends on `vexflow` **1.2.93** (`package.json`), not VexFlow 5. Every grid edit would mean generating MusicXML, then `load()` (async parse), then `render()`. That is the wrong shape for a live editor. 352 KB gz. [npm](https://www.npmjs.com/package/opensheetmusicdisplay)

### abcjs

- MIT, 148 KB gz. In the 6.7.1 source: percussion clef `perc`, `%%percmap`, and notehead decorations `!style=x!`, `harmonic`, `triangle` and `rhythm`. [abcjs repo](https://github.com/paulrosen/abcjs), [npm](https://www.npmjs.com/package/abcjs)
- We would serialise the exercise to an ABC string. In ABC, beaming is set by whitespace between notes, which is easy to generate. Lyrics and annotations work for sticking. Rendering is automatic, with line breaks. A reasonable fallback if VexFlow's manual layout turns out to be painful. **Unverified:** how well two-voice drum staves engrave (rest placement, stem collisions).

### Verovio (ruled out)

- LGPL-3.0-or-later, a WASM build of about 27 MB unpacked. That is too heavy, and the licence is more restrictive than needed for a single staff. [npm](https://www.npmjs.com/package/verovio)

## Facts for the Exercise data model ticket

- VexFlow takes durations as strings: `'4'`, `'8'`, `'16'`, dotted `'8d'`, rests `'8r'`. It takes pitches as `'c/5'` plus an optional notehead code (`'g/5/x2'`). Our model should store **rhythmic position + duration in grid ticks** and the **drum** (snare, kick, ride, hi-hat, hi-hat foot). A small render adapter maps each drum to a staff position and notehead. The model should never store VexFlow strings.
- Triplets are a `Tuplet` over three notes that share a beat. The model needs a per-beat subdivision (straight 16th grid vs 8th-triplet grid) or a tick resolution that holds both (for example 12 ticks per quarter).
- Ties go between two notes (`StaveTie`). Store a "tied to next" flag on a note, or let the adapter derive ties when a duration crosses a beat or bar.
- Sticking is plain text attached per note (`Annotation`), so computed sticking plus overrides can stay entirely in our model.
- Highlighting needs a stable id per note. Keep a `noteId` in the model and pass it as the VexFlow element id (or keep a map). Then playback can map scheduled audio events to SVG elements.
- Rests: the exercise voice needs explicit rests (or `GhostNote`s) so each voice fills the bar. The adapter can generate them from gaps.

## Facts for the Tech stack ticket

- `npm i vexflow` (TypeScript types are bundled). Import `vexflow/bravura` for a single font, or `vexflow/core` and load fonts yourself. Wait for the font promise before the first draw.
- Rendering is synchronous and framework-agnostic: give it a `div`, and it writes an SVG. Wrap it in one component that redraws from the exercise state. A full redraw of a few bars should take milliseconds (**unverified**, worth a quick prototype).
- Our own code has to do line wrapping, bar width and system spacing. With 4/4 and N bars per row, this is a simple loop.
- No player is bundled, which suits the plan to use our own audio clock (Web Audio).
- Licence: MIT, so there is no obstacle to a future public or paid app.

## Risks

- **VexFlow release cadence.** npm has had no release since 2025-03 although `main` is active. Mitigation: pin 5.0.0, which already has every feature listed above.
- **Engraving details in two-voice drum staves.** Rest positions and collisions between voices may need manual `setKeyLine`/offsets. VexFlow's percussion tests show that the basic case renders, but we have not checked edge cases against Ted Reed-style layouts. Recommend a one-hour prototype bar (groove layer + syncopated snare + triplet + sticking).
- **Manual layout** is extra code compared with alphaTab or abcjs. If it grows (multiple widths, responsive reflow), alphaTab or abcjs are the fallbacks.

## Sources

- npm registry metadata (versions, licences, publish dates): https://registry.npmjs.org/vexflow, https://registry.npmjs.org/@coderline/alphatab, https://registry.npmjs.org/opensheetmusicdisplay, https://registry.npmjs.org/abcjs, https://registry.npmjs.org/verovio
- Bundle sizes: measured locally from `npm pack` tarballs (`gzip -9` of the shipped minified builds).
- VexFlow: https://github.com/vexflow/vexflow, https://github.com/0xfe/vexflow, https://github.com/vexflow/vexflow/blob/main/LICENSE, https://github.com/vexflow/vexflow/tree/main/src, https://github.com/vexflow/vexflow/blob/main/tests/percussion_tests.ts
- alphaTab: https://github.com/CoderLine/alphaTab, https://alphatab.net/, https://github.com/CoderLine/alphaTabWebsite/tree/main/docs, https://alphatab.net/docs/reference/settings/player/playermode
- OSMD: https://github.com/opensheetmusicdisplay/opensheetmusicdisplay
- abcjs: https://github.com/paulrosen/abcjs
- MPL-2.0 FAQ: https://www.mozilla.org/en-US/MPL/2.0/FAQ/
- GitHub API activity: https://api.github.com/repos/vexflow/vexflow, https://api.github.com/repos/CoderLine/alphaTab, https://api.github.com/repos/opensheetmusicdisplay/opensheetmusicdisplay, https://api.github.com/repos/paulrosen/abcjs
