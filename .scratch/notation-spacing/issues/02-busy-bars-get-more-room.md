# 02: Busy bars get more room on a small screen

**What to build:** The minimum bar width grows with how busy the music is, so a dense groove (sixteenth hi-hats, triplets) drops to fewer bars a line sooner, while a simple one keeps up to four. See [spec](../spec.md) story 5.

**Blocked by:** 01

**Status:** needs-triage

Decide after living with ticket 01: if small screens still feel cramped, settle these first, then make it ready-for-agent.

- How to measure busyness: the most events (notes and rests) in one beat across both parts of any bar (`staffParts`), or the finest grid used (quarters, eighths, triplets, sixteenths).
- The minimum width for each level, e.g. 190 for eighths or coarser, about 240 for triplets or sixteenths. Tune it by eye on a 900 px window.
- Whether it's the busiest bar in the whole exercise (one width for all, keeping the aligned grid) or per line. The aligned grid suggests the whole exercise.

Criteria once triaged:

- [ ] A pure core function gives the minimum bar width for an exercise, and `notationFit` uses it. Tested at the agreed seam
- [ ] Checked in the browser at 900 px: a four-bar sixteenth groove gets fewer bars a line, and a four-bar quarter-note exercise still gets four
