# 02: Compound time: 6/8 and 12/8

**What to build:** 6/8 and 12/8 join the time signature chips. A compound beat is a dotted quarter of three eighths, on the triplet grid's ticks. Every beat card is on that grid with no 16ths | trip switch. The notation writes eighths beamed in threes, with no triplet "3"s, a full beat as a dotted quarter, and the 6/8 or 12/8 time signature. The BPM, the click and the beat count follow the dotted quarter. Swing is not played and its control is replaced by a line. Moving between simple and compound time keeps each beat's downbeat. Ride and Hi-hat 8ths don't fit compound time, so they turn off. The hi-hat foot offers Off, 1 and Beats. See [spec](../spec.md), stories 8–12 and 15, Implementation Decisions › The editor in compound time and Notation, and ADR 0015 (new).

**Blocked by:** 01

**Status:** done

- [x] `meter()` for 6/8 and 12/8; the editor treats every compound beat as a triplet beat; `setBeatGrid` refused, with tests
- [x] `withTimeSignature` between simple and compound time, with tests
- [x] No swing in compound time in the schedule and the staff parts, with tests
- [x] The compound notation: written values from ticks × 3/2, no tuplets, beamed in dotted quarters, 6/8 and 12/8
- [x] Swing hidden in compound time; "beats in threes" hint; beat cards with no grid switch
- [x] ADR 0015, *Compound time is the triplet grid, written in eighths*; `CONTEXT.md`: Compound time
- [x] Checked in the browser at 1280 and 390 × 844, light and dark

## Comments

- 2026-10-16: Built. A compound beat is stored on the triplet grid's ticks and written from them at ticks × 3/2, so a triplet eighth is printed as an eighth and a beat as a dotted quarter (`compoundValue`). One rule fits bars to a time signature (`fittedBars`), and the time-signature change, paste and import all use it. In compound time a straight beat keeps only its downbeat. Coming from compound time a triplet beat does the same. Between two simple time signatures the drummer's triplets are now kept; before this, 4/4 → 3/4 cleared them. The clipboard remembers the time signature its bars were copied in. Import fits a hand-edited compound bar, groove or hi-hat foot instead of refusing the file. Natural sticking counts every compound beat as a triplet beat, so a beat with only its downbeat no longer restarts the run of eighths. The Groove picker offers only Off in compound time, and `withGroove` refuses a groove the time signature doesn't offer. Checked headless at 1280 (light and dark) and 390 × 844; the Groove picker in 6/8 shows only Off. Left for the user: the compound beat card counts `1 & a`, and the desktop time-signature chips use `text-xs` so five fit.
