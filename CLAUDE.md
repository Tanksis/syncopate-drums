# Syncopate!

## Branching

GitHub Flow: `main` always deploys; work on `feature/<NN>-<slug>` (ticket number), `fix/`, `chore/` or `docs/` branches and squash-merge by PR once Vitest passes. Releases are `vX.Y.Z` tags on `main`. See `docs/adr/0001-branching-and-releases.md`.

## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
