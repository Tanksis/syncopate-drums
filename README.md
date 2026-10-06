# Syncopate!

A laptop-first drum practice app for working through rhythm books such as Ted Reed's *Syncopation*. Type in a line one beat at a time, see it on a drum staff with the sticking printed under the notes, add a jazz groove on top, and play along with a metronome: looping hard bars, at any tempo, with swing.

It will run in the browser as an installable, offline PWA at **https://tanksis.github.io/syncopate-drums/**. The skeleton is live there now.

## Status

Planning is done and the build has started. Ticket 15 put up the app skeleton (the empty three-column layout) and the test-and-deploy pipeline; the remaining build tickets (16–34) fill it in.

## What v1 does

- **Grid editor**: enter a bar in four keystrokes by picking a beat figure per beat from a keyboard-shaped palette (all 22 sixteenth and triplet figures, plus ties and "cut short"). The app spells the notation for you. Optional vim-style keys.
- **Notation view**: a drum staff, four bars per line like the book, redrawn as you type.
- **Sticking**: natural, alternate or off, from either lead hand, with per-note overrides.
- **Groove layer and swing**: jazz ride/hi-hat presets drawn above the line and played with it; one swing amount that straightens out at fast tempos.
- **Playback**: count-in, click on every quarter, BPM 30–300, loop the whole exercise or a range of bars, the sounding note highlighted.
- **Exercise library**: autosaved locally in the browser, with filter, duplicate, and JSON export/import to move exercises between computers. No accounts, no sync.

## Planned stack

TypeScript, Vite and React with Zustand; VexFlow 5 for notation; a custom Web Audio scheduler with CC0 drum samples (Virtuosity Drums); IndexedDB via `idb`; `vite-plugin-pwa`; Vitest. All dependencies are MIT, ISC or CC0. GitHub Actions runs the tests and deploys to GitHub Pages.

## Development

Needs Node 22.

```sh
npm install
npm run dev          # dev server at http://localhost:5173/syncopate-drums/
npx vitest           # tests, in watch mode (npx vitest run for a single run)
npm run typecheck    # TypeScript across the core, app and config
npm run build        # type check + production build into dist/
npm run preview      # serve the production build
```

The exercise core lives in `src/core/`. It must not import React, the DOM, Web Audio or IndexedDB: its TypeScript project has no DOM library, and a test checks its imports. It is the one place covered by tests.

GitHub Actions (`.github/workflows/ci.yml`) runs the type check, a licence check (every shipped dependency must be MIT, ISC or CC0) and Vitest on every pull request into `main` and every push to it. A push to `main` deploys to GitHub Pages only if those pass.

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
