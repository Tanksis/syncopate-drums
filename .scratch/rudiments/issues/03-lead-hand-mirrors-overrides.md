# 03: The Lead hand mirrors sticking overrides

**What to build:** An override is stored as for a right lead, and with Lead hand L it is shown and played mirrored. Exercises stored with Lead hand L and overrides are migrated once, each override flipped, so nothing they show changes. See [spec](../spec.md), stories 15-16, and [ADR 0018](../../../docs/adr/0018-rudiments-and-a-mirroring-lead-hand.md).

**Blocked by:** none

**Status:** ready-for-agent

- [ ] `sticking()` mirrors overrides under Lead hand L; flipping an override under L stores the right-lead hand, unit-tested
- [ ] The migration (schema version bump) flips stored overrides of Lead-hand-L exercises; an exercise shows the same hands before and after, unit-tested
- [ ] Import of an older file migrates the same way
- [ ] `CONTEXT.md`: Sticking override and Lead hand updated
