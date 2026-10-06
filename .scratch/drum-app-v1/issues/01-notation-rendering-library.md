# Notation rendering library

Type: research
Status: resolved
Blocked by: (none)

## Question

Which browser library should draw the **notation view**? Compare VexFlow, OpenSheetMusicDisplay and alphaTab (plus any strong alternative) against what v1 needs:

- A single drum-set staff (percussion clef) with two voices: the groove layer stems up (ride and hi-hat with x noteheads, hi-hat foot below the staff) and the exercise stems down (snare or bass drum).
- Quarters, eighths, sixteenths, eighth-note triplets, rests, ties, dotted notes in 4/4; beaming that is correct for drum reading.
- Sticking text (R/L) under each exercise note.
- Highlighting the currently playing note during playback, driven by our own audio clock (we may not use the library's own player).
- Re-rendering live as the grid editor changes the exercise; several bars, wrapping across lines.
- Input format: does it take its own API, MusicXML, alphaTex, or something else? How easily does our own exercise model map to it?
- Licence (must allow a possible future public/paid app), maintenance status, bundle size.

Answer with a recommendation plus the facts the **Exercise data model** ticket and the **Tech stack** ticket need.

## Answer

Use **VexFlow 5** (`vexflow`, MIT) and drive it directly from our own exercise model through a small render adapter. No MusicXML or text format sits in between.

- It has a percussion clef, x noteheads (`g/5/x2`), two voices with forced stem directions, tuplets, ties, dots, configurable beam groups, and `Annotation` text below notes for R/L sticking.
- Each note is an SVG element with an id (`getSVGElement`, `setStyle`, `addClass`), so our own audio clock can highlight it.
- Downside: VexFlow doesn't wrap lines, so we place N bars per row ourselves. It also hasn't published to npm since 5.0.0 (2025-03), though the repo is active.
- Runner-up: alphaTab (MPL-2.0, automatic layout, heavier). OSMD is ruled out: MusicXML-only input and it bundles the old VexFlow 1.2.93. abcjs (MIT) is the text-based fallback.

Details: [notation-rendering-library.md](../../../docs/research/notation-rendering-library.md)
