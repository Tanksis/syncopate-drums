# 15: App skeleton deployed to GitHub Pages

**What to build:** Opening `https://tanksis.github.io/syncopate-drums/` shows the Syncopate! shell: the empty three-column layout A (library sidebar | header, notation view, editor panel | settings sidebar). Behind it are a TypeScript + Vite + React + Zustand single-page app, an exercise core with no React/DOM/Web Audio/IndexedDB imports and its own Vitest suite, and a GitHub Actions workflow that deploys every push to `main` only if the tests pass. See [spec.md](../spec.md), "Stack and hosting" and "Modules".

**Blocked by:** None (can start immediately)

**Status:** done (merged in PR #1, 2026-10-06)

- [x] The app builds with Vite `base` set to `/syncopate-drums/` and loads at the Pages URL with no broken asset paths
- [x] The page shows the three empty columns of layout A at laptop width
- [x] The exercise core is its own module with no React, DOM, Web Audio or IndexedDB imports, and has at least one passing Vitest test
- [x] The Actions workflow runs Vitest on every push to `main` and deploys only if it passes; a deliberately failing test blocks the deploy
- [x] The same Vitest check runs on every pull request into `main` (without deploying), so PRs can't merge red, per the [branching ADR](../../../docs/adr/0001-branching-and-releases.md)
- [x] Every dependency is MIT or CC0

## Comments

- 2026-10-06: Implemented on `feature/15-app-skeleton-deployed`. Vite 8 + React 19 + Zustand 5 + TypeScript 7, Vitest 5. The core (`src/core/`) is its own TypeScript project with no DOM lib and no ambient types, plus a test that checks its imports. It holds only the tick constants and `clampBpm` for now; ticket 16 brings the model. One workflow (`.github/workflows/ci.yml`): a `test` job (type check, licence check, Vitest) on PRs and pushes to `main`, and a `deploy` job to Pages that needs `test` and runs only on `main`. The licence check covers shipped (non-dev) packages; dev tooling such as TypeScript (Apache-2.0) isn't shipped. One-time repo setting needed: Settings → Pages → Source = "GitHub Actions".
- 2026-10-06: Merged as PR #1 (a merge commit, not a squash). Deploy run 37467498203 went green, and https://tanksis.github.io/syncopate-drums/ serves the page, with the JS, CSS and favicon all returning 200 under `/syncopate-drums/`. The user then checked that a deliberately failing test turns CI red.
