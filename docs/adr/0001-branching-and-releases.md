# 1. Branching and releases: GitHub Flow with version tags

Date: 2026-10-06

Status: accepted

## Context

Syncopate! has one developer (plus agents working from tickets) and one live copy: the static PWA on GitHub Pages, which Actions deploys on every push to `main` after the Vitest suite passes ([Static host](../../.scratch/drum-app-v1/issues/14-static-host.md)). Installed PWAs update themselves to whatever is deployed, so there is never an older release to keep patching. Release branches and a `develop` branch (Git Flow) would add merges without protecting anything.

## Decision

**`main` is always releasable, and every push to it deploys.** All other work happens on short-lived branches that merge into `main` through a pull request.

### Branches

| Branch | For | Example |
|---|---|---|
| `feature/<NN>-<slug>` | a build ticket; `NN` is the ticket number | `feature/16-straight-beat-figures` |
| `fix/<slug>` | a bug fix (`fix/<NN>-<slug>` if it has a ticket) | `fix/tie-across-bar-line` |
| `chore/<slug>` | tooling, dependencies, CI, refactors with no behaviour change | `chore/bump-vexflow` |
| `docs/<slug>` | planning, specs, ADRs, glossary | `docs/branching-adr` |

- Branch from the latest `main`. One ticket per branch.
- Keep branches short: merge within a ticket's work, not across several. If `main` moves on, rebase onto it.
- No long-lived branches other than `main`.

### Pull requests

- Every code change reaches `main` through a PR. The PR runs the Vitest suite; it merges only when that passes.
- PR title says what changes for the user, in the ticket's vocabulary; the body links the ticket and ticks its acceptance criteria.
- **Squash merge**, so each ticket lands as one commit on `main` whose message is the PR title. Delete the branch after merging.
- Small docs-only changes (`.scratch/`, `docs/`, `CONTEXT.md`) may be committed straight to `main`; they deploy an unchanged app.
- No Claude co-author or session trailers in commits or PRs.

### Fixes

There's no separate hotfix process: a fix is a `fix/` branch off `main`, merged by PR like anything else, and deployed on merge. If it fixes something already released, tag a patch version after it merges.

### Releases

Deploys happen on every merge; a **release** is a named point on `main` for the user's own reference.

- Version tags follow semver: `vMAJOR.MINOR.PATCH`, tagged on `main` after the merge that completes them, with a GitHub Release whose notes list the tickets and fixes since the last tag.
- `v0.x` while v1 is being built: tag a minor version when a useful chunk works end to end (e.g. after tickets 16–18, you can enter, play and keep an exercise). `v1.0.0` when tickets 15–34 are all done.
- After 1.0: minor for new features, patch for fixes, major only if old exports can no longer be imported.
- The app version is separate from the exercise **schema version**. A schema bump needs a migration in the core's shared chain, and gets called out in the release notes.

## Consequences

- What's on `main` is what users run, so CI must stay green; a failing test blocks the deploy, as already decided.
- Squash merging keeps `main`'s history one line per ticket, so a bad change is one commit to revert.
- Without release branches, a half-finished feature can't sit on `main` visibly. Keep each ticket's slice complete (the tickets are vertical slices for this reason), or hide the unfinished part until its ticket is done.
- If the app ever has a second deployed copy (a public build or a beta), revisit this: a tag-triggered production deploy would then be the next step.
