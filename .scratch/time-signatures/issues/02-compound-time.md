# 02: Compound time: 6/8 and 12/8

**What to build:** 6/8 and 12/8 join the time signature chips. A compound beat is a dotted quarter of three eighths, on the triplet grid's ticks. Every beat card is on that grid with no 16ths | trip switch. The notation writes eighths beamed in threes, with no triplet "3"s, a full beat as a dotted quarter, and the 6/8 or 12/8 time signature. The BPM, the click and the beat count follow the dotted quarter. Swing is not played and its control is replaced by a line. Moving between simple and compound time keeps each beat's downbeat. Ride and Hi-hat 8ths don't fit compound time, so they turn off. The hi-hat foot offers Off, 1 and Beats. See [spec](../spec.md), stories 8–12 and 15, Implementation Decisions › The editor in compound time and Notation, and ADR 0015 (new).

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] `meter()` for 6/8 and 12/8; the editor treats every compound beat as a triplet beat; `setBeatGrid` refused, with tests
- [ ] `withTimeSignature` between simple and compound time, with tests
- [ ] No swing in compound time in the schedule and the staff parts, with tests
- [ ] The compound notation: written values from ticks × 3/2, no tuplets, beamed in dotted quarters, 6/8 and 12/8
- [ ] Swing hidden in compound time; "beats in threes" hint; beat cards with no grid switch
- [ ] ADR 0015, *Compound time is the triplet grid, written in eighths*; `CONTEXT.md`: Compound time
- [ ] Checked in the browser at 1280 and 390 × 844, light and dark
