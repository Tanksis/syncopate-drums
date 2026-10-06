# Syncopate!

A laptop-first drum practice app for working through rhythm books such as Ted Reed's *Syncopation*. Type in a line one beat at a time, see it on a drum staff with the sticking printed under the notes, add a jazz groove on top, and play along with a metronome: looping hard bars, at any tempo, with swing.

It will run in the browser as an installable, offline PWA at **https://tanksis.github.io/syncopate-drums/** (not live yet).

## Status

Planning is done; the app hasn't been built yet. The v1 spec and its build tickets are ready, and implementation starts with ticket 15 (the app skeleton and deploy pipeline).

## What v1 does

- **Grid editor**: enter a bar in four keystrokes by picking a beat figure per beat from a keyboard-shaped palette (all 22 sixteenth and triplet figures, plus ties and "cut short"). The app spells the notation for you. Optional vim-style keys.
- **Notation view**: a drum staff, four bars per line like the book, redrawn as you type.
- **Sticking**: natural, alternate or off, from either lead hand, with per-note overrides.
- **Groove layer and swing**: jazz ride/hi-hat presets drawn above the line and played with it; one swing amount that straightens out at fast tempos.
- **Playback**: count-in, click on every quarter, BPM 30–300, loop the whole exercise or a range of bars, the sounding note highlighted.
- **Exercise library**: autosaved locally in the browser, with filter, duplicate, and JSON export/import to move exercises between computers. No accounts, no sync.

## Planned stack

TypeScript, Vite and React with Zustand; VexFlow 5 for notation; a custom Web Audio scheduler with CC0 drum samples (Virtuosity Drums); IndexedDB via `idb`; `vite-plugin-pwa`; Vitest. All dependencies are MIT or CC0. GitHub Actions runs the tests and deploys to GitHub Pages.

Setup and dev commands will be added here with ticket 15.

## Repo guide

| Path | What's there |
|---|---|
| [`CONTEXT.md`](CONTEXT.md) | Domain glossary: the words the code and tickets use (exercise, beat figure, sticking, groove layer, ...) |
| [`.scratch/drum-app-v1/spec.md`](.scratch/drum-app-v1/spec.md) | The v1 spec: user stories, implementation and testing decisions |
| [`.scratch/drum-app-v1/issues/`](.scratch/drum-app-v1/issues/) | Tickets: 01–14 are resolved planning questions; 15–34 are the build tickets, each with its blockers and acceptance criteria |
| [`.scratch/drum-app-v1/map.md`](.scratch/drum-app-v1/map.md) | The planning map: decisions so far and what's out of scope |
| [`.scratch/drum-app-v1/prototypes/`](.scratch/drum-app-v1/prototypes/) | Throwaway prototypes (playback, grid editor, screen layout) used as reference |
| [`docs/research/`](docs/research/) | Research notes (notation library, audio engine, camera import) |
| [`docs/adr/`](docs/adr/) | Architecture decision records |

## Working on it

Work follows [GitHub Flow](docs/adr/0001-branching-and-releases.md): `main` always deploys; each ticket gets a `feature/<NN>-<slug>` branch and lands as a squash-merged PR once the tests pass. Releases are `vX.Y.Z` tags on `main`. Pick up the lowest-numbered ticket whose blockers are all done.
