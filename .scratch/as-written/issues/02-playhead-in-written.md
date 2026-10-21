# 02: The playhead in the written version

**What to build:** While an exercise plays in Written, the playhead marks the moment being heard. On a written note it's on that note. On a hit the written line doesn't have (the ride, a foot, a groove hit), it's between the written notes around it, in proportion to the time. See [spec](../spec.md), story 8, and Implementation Decisions › The playhead between written notes. The prototype's variant B (branch `prototype/as-written`) shows the idea.

**Blocked by:** 01

**Note from 01:** Written's playhead now finds only hits on a written note's own tick. So with swing on, a swung offbeat (heard on the triplet's last third, written on the straight &) gets no line either, not just the ride and the feet. The interpolation covers it.

**Status:** done

- [x] The interpolation from a bar's (tick, x) anchors, a pure function in the core, unit-tested: on an anchor, between anchors, before the first, at the bar's end
- [x] `playheadMark` uses it in Written; Played is unchanged
- [x] Checked in the browser on jazz comping and rock beat. Playing in Written, the line follows every hit and sits on each written note.
