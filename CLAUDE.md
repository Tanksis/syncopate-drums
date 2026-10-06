# Syncopate!

## Branching

GitHub Flow: `main` always deploys; work on `feature/<NN>-<slug>` (ticket number), `fix/`, `chore/` or `docs/` branches and squash-merge by PR once Vitest passes. Releases are `vX.Y.Z` tags on `main`. See `docs/adr/0001-branching-and-releases.md`.

## Code layout

- `src/core/` — the pure exercise core (model, speller, sticking, timing). No React, DOM, Web Audio or IndexedDB; `tsconfig.core.json` enforces it. Unit-tested with Vitest.
- `src/app/` — the app shell (`App.tsx`, the Workstation layout) and app-wide wiring such as the Zustand store.
- `src/features/<area>/` — one folder per screen area (`library`, `notation`, `editor`, `settings`), holding its components and hooks.
- `src/components/` — small presentational components shared across features.
- `src/styles/index.css` — the Tailwind entry and the `@theme` design tokens (`bg-panel`, `text-mute`, `border-line`…). Style with Tailwind utilities in JSX; add no other CSS files.

Import across folders with the `@/` alias (`@/features/editor/GridEditor`).

## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
