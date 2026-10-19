# 02: The playhead in the written version

**What to build:** While an exercise plays in Written, the playhead marks the moment being heard. On a written note it's on that note. On a hit the written line doesn't have (the ride, a foot, a groove hit), it's between the written notes around it, in proportion to the time. See [spec](../spec.md), story 8, and Implementation Decisions › The playhead between written notes. The prototype's variant B (branch `prototype/as-written`) shows the idea.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] The interpolation from a bar's (tick, x) anchors, a pure function in the core, unit-tested: on an anchor, between anchors, before the first, at the bar's end
- [ ] `playheadMark` uses it in Written; Played is unchanged
- [ ] Checked in the browser on jazz comping and rock beat. Playing in Written, the line follows every hit and sits on each written note.
