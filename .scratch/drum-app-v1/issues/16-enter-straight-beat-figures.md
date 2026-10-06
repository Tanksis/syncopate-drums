# 16: Enter straight beat figures and see them on the staff

**What to build:** A new exercise opens with the fixed defaults (one bar of rests, "Untitled", snare voice, natural sticking, lead R, 80 BPM, groove off, swing 66.7%). The drummer enters it in the grid editor one beat at a time, picking a beat figure from a keyboard-shaped palette: the 16 sixteenth-grid figures (number row 1–0, bottom row Z–B) or Space for a rest beat, by key or by clicking a tile. The cursor moves to the next beat by itself, and typing past the last beat adds a bar.

The notation view redraws on every edit as a drum staff:
- percussion clef, 4/4, snare noteheads stems down
- beaming that is correct for drum reading
- notes, rests and dots spelled automatically
- 4 bars per line (fewer on a narrow window; a short last line keeps the bar width and is left aligned)
- bar numbers above each bar
- the cursor beat's notes highlighted and the current bar shaded
- scrolling when the line is long

It is held in memory only; nothing is saved yet. Triplet figures, ties and cut short come in later tickets.

See [spec.md](../spec.md): the exercise core's model types, the auto-speller, the 22 figures and their keys, the `applyEdit` reducer, and the notation renderer. Prototype references: [grid editor](../prototypes/05-grid-editor/index.html) and [screen layout](../prototypes/10-screen-layout/index.html).

**Blocked by:** 15 (App skeleton deployed to GitHub Pages)

**Status:** done (merged in PR #3, 2026-10-06)

- [x] The core's exercise model matches the spec: bars of note/rest items with duration, dot, triplet membership, tied-to-next and an optional override slot; ticks derived at 12 per beat, not stored. A new-exercise factory gives the fixed defaults
- [x] The core derives each beat's view (figure or rest) from the bars, and writing a figure back re-spells the bar; tests cover a round trip for all 16 straight figures and the rest beat
- [x] `applyEdit` handles entering a figure (advance the cursor, grow the exercise past the last beat). The key → command mapping is a pure core function, and the UI only dispatches
- [x] The palette is laid out like the keyboard, each tile shows its key, clicking a tile enters that figure, and the current beat's figure is highlighted on its tile
- [x] The beat strip shows the bars and beats with the cursor
- [x] The notation view draws the exercise with VexFlow straight from the model (no MusicXML in between): percussion clef, snare stems down, beams grouped by beat, bar numbers, 4 bars per line with the narrow-window and short-last-line rules, cursor-beat highlight and current-bar shading, scrolling within the free height
- [x] Four keystrokes enter a bar, and the staff reads as a drummer would expect for, say, `2 3 7 Space`

## Comments

- 2026-10-06: Implemented on `feature/16-enter-straight-beat-figures`. Core: `model.ts` (types, `itemTicks`, `newExercise`), `figures.ts` (the 15 straight figures + Space; the A–H triplets come with ticket 19), `speller.ts` (`beatViews`, `setBeat`, re-spelling on a sixteenth-cell timeline as in the prototypes; overrides ride on a hit's position) and `editor.ts` (`applyEdit` with `enterFigure`, `commandForKey`). Items carry no ids; a note is identified by bar + start tick. Typing the 4th beat of the last bar adds a bar of rests at once and puts the cursor on it, as the prototype did. UI: Zustand store holding the editor state in memory, the VexFlow adapter `features/notation/staff.ts` (`vexflow/bravura`, so the fonts are bundled for offline), the beat strip and the keyboard-shaped palette with mini-notation tiles. Bar numbers use VexFlow's measure numbers for now; ticket 26 makes them clickable. Checked in Chrome: `2 3 7 Space` reads ♪♪ | 𝄾♪ | ♪.𝅘𝅥𝅯 | 𝄽, tile clicks enter and advance, the narrow window drops to 2 bars per line.

- 2026-10-06: Squash-merged as PR #3 once CI passed.
