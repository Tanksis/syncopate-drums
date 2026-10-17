# Syncopate!

A drum practice app for working through rhythm books such as Ted Reed's *Syncopation*, on a laptop or a phone. You enter a line on a grid, one beat at a time, and see it on a drum staff with the sticking printed under the notes. You can add a jazz groove or a hi-hat foot on top and play along: looping hard bars, at any tempo, with swing. A separate Metronome screen covers practice that isn't an exercise.

It runs in the browser at **https://tanksis.github.io/syncopate-drums/**.

## Status

The app is live, released as v0.1.0; v1.0.0 will be the public launch. Since v0.1.0 the work has come in feature batches, each with its own spec and tickets under `.scratch/<feature>/`: the phone layout, kick fills, library folders and examples, themes, the Metronome, and most recently time signatures (3/4, 2/4, 6/8 and 12/8). The installable offline PWA from the original plan was dropped.

## What it does

- **Grid editor**: each exercise has a snare row and a kick row. Click or tap a beat card's grid positions to add hits, and drag a note to set how long it holds. A beat is on sixteenths or triplets, and its ⋯ menu switches the grid, rests the beat, or ties a bar's first beat over the barline. Bars have their own ⋯ menu (add after, duplicate, copy, paste over, delete), and there are undo and redo buttons. The app spells the notation for you. Keyboard users have shortcuts too; press `?` to list them.
- **Pattern fills**: type a sticking pattern of R, L, K and `.` (for example `RLRK` or `RL.L`) to fill a bar, or start a new exercise with New from pattern. One action turns every gap in a bar into a kick.
- **Notation view**: a drum staff, four bars per line like the book, redrawn as you edit. Hands are written stems up and feet stems down. Swing is written as triplets, and the note being played is highlighted.
- **Sticking**: natural, alternate or off, from either lead hand. Kicks that don't land with a hand show K. Long-press a hit to flip its hand.
- **Groove, hi-hat foot and swing**: jazz ride and hi-hat presets drawn above the line and played with it, a hi-hat foot on 1, quarters, 2 & 4 or the &s, and a swing amount from straight to 75%.
- **Practice playback**: Play on the staff (or in the bottom transport bar on a phone), BPM 30–300, count-in, a click you can mute, and looping of the whole exercise or a range of bars. There's a separate mute for Click, Exercise and Groove. On a phone the screen stays awake while playing, and sound plays even with the silent switch on.
- **Metronome**: its own screen, switched from the header. Tap the beat blocks to cycle each beat through Accent, Normal, Soft and Off. Drag the dial to set the tempo (20–300 BPM), or use tap tempo. It takes time signatures up to 16 beats, 12 subdivision patterns, and Beep or Wood block sounds.
- **Exercise library**: autosaved in the browser, with Library and Examples tabs. You can organise exercises in folders (natural A–Z order), filter, duplicate, and export or import JSON to move them between computers. The built-in examples are read-only; Copy to Library makes an editable version. No accounts, no sync.
- **Layout and themes**: a three-column desktop Workstation and a phone layout below 640 px (sideways too). Two themes, Warm (the default) and Studio, each in light or dark.

## Stack

TypeScript, Vite and React 19 with Zustand; Tailwind CSS 4; VexFlow 5 for notation; a custom Web Audio scheduler (timed by a worker) with CC0 drum samples from Virtuosity Drums; IndexedDB via `idb`; self-hosted Fontsource fonts; Vitest. All shipped dependencies are MIT, ISC or CC0, and the fonts OFL-1.1. GitHub Actions runs the tests and deploys to GitHub Pages.

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

The code is split into:

- `src/core/`: the pure exercise core (model, speller, sticking, timing, metronome, import/export). It must not import React, the DOM, Web Audio or IndexedDB. Its TypeScript project has no DOM library, and a test checks its imports. This is where the unit tests live.
- `src/app/`: the app shell and app-wide wiring (the Zustand store, storage, themes).
- `src/features/<area>/`: one folder per screen area (`editor`, `notation`, `playback`, `library`, `metronome`, `settings`).
- `src/components/`: small shared presentational components.
- `src/styles/index.css`: the Tailwind entry and the theme tokens.

GitHub Actions (`.github/workflows/ci.yml`) runs the type check, a licence check and Vitest on every pull request into `main` and every push to it. A push to `main` deploys to GitHub Pages only if those pass.

## Repo guide

| Path | What's there |
|---|---|
| [`CONTEXT.md`](CONTEXT.md) | Domain glossary: the words the code and tickets use (exercise, beat card, sticking, groove layer, ...) |
| [`.scratch/`](.scratch/) | One folder per feature, each with a `spec.md` and an `issues/` folder of tickets. [`drum-app-v1/`](.scratch/drum-app-v1/) holds the original v1 spec, planning map and prototypes. |
| [`docs/adr/`](docs/adr/) | Architecture decision records (grid-only entry, swing written as triplets, themes as skins, the Metronome as its own screen, ...) |
| [`docs/research/`](docs/research/) | Research notes (notation library, audio engine, camera import) |
| [`docs/agents/`](docs/agents/) | How the issue tracker, triage labels and domain docs work |

## Working on it

Work follows [GitHub Flow](docs/adr/0001-branching-and-releases.md): `main` always deploys. Each ticket gets a `feature/<NN>-<slug>` branch (or `fix/`, `chore/`, `docs/`) and lands as a squash-merged PR once the tests pass. Releases are `vX.Y.Z` tags on `main`. To pick up work, find a ticket marked `ready-for-agent` or `ready-for-human` in a feature's `issues/` folder whose blockers are all done.
