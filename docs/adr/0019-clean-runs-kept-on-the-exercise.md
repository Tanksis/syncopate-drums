# 19. Clean runs are kept on the exercise, and a built-in's on the side

Date: 2026-10-28

Status: accepted

A drummer logs the tempos they've played an exercise cleanly at, with the day (a **Clean run**), on every exercise: their own, the examples and the rudiments. The user asked for an own exercise's runs to go with it on export.

Two places were considered:

- **One store of runs by exercise id**, for every exercise. Export would need a map of runs beside the exercises, and import would have to follow an exercise's id when "Keep both" gives the copy a new one.
- **On the exercise**, as `cleanRuns`, for the drummer's own. Export, import, Keep both and delete carry them with no code of their own. A built-in exercise is never stored (ADR 0008), so its runs go in a small IndexedDB store of their own, by its id.

The second was chosen: what's practised on an exercise belongs with it, as its practice settings do.

## Consequences

- Schema version 10. An older app refuses an export with clean runs rather than dropping them.
- The database is version 3, with the `builtInCleanRuns` store.
- A copy (Duplicate, or Copy to Library) starts with no clean runs.
- `cleanRunsOf` in the store reads either place; nothing else needs to know which.
