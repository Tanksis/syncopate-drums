# 03: Swing as Straight, Triplet, Dotted and Custom

**What to build:** Swing moves into the Time group, under the time signature. Its slider and cramped preset row become chips: Straight, Triplet, Dotted and Custom. Custom shows the slider and the % field. An amount that isn't one of the three reads as Custom. Desktop and phone. See [spec](../spec.md), stories 13–14, and Implementation Decisions › Swing presets and Time group.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] `SWING_PRESETS` and `swingPreset()` in the core, unit-tested
- [ ] The chips and Custom's slider and % on desktop and phone; the old presets row gone
- [ ] `CONTEXT.md`: Swing amount's presets
- [ ] Checked in the browser at 1280 and 390 × 844
