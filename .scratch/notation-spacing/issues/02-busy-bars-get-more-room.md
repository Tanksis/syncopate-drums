# 02: Busy bars get more room

**What to build:** The minimum bar width grows with how busy the music is, so a dense exercise (sixteenths, triplets) drops to fewer bars a line sooner, while a simple one keeps up to four. Where even one bar a line is narrower than that minimum (the phone), the notation is drawn smaller than usual so the bar fits. See [spec](../spec.md) story 5.

**Blocked by:** 01 (done)

**Status:** done

Closed as wontfix on 2026-10-08, after the user found ticket 01 good enough. Reopened on 2026-10-13: kick fills (`RLKK`, 16 sixteenths with a sticking letter each) overflow the barline in any bar that isn't first on its line. On the desktop, four bars of `RLKK` clip bars 2 and 4. On the phone, bar 1's last kick touches the barline.

Decided with the user on 2026-10-13:

- **Busyness** is the most events (notes and rests) in one beat of either part (`staffParts`), across the whole exercise. One or two a beat keeps 190 (`minBarWidth`). Three (triplets) gets about 260, and four (sixteenths) about 330. Tune the numbers by eye.
- **One minimum width for the whole exercise**, set by its busiest beat, so bars stay equal and beat 1 lines up from line to line.
- **Below 1x where needed:** when even one bar a line at scale 1 is narrower than the minimum, the scale goes down (no lower than about 0.8) until the bar fits. Otherwise the scale rule is unchanged.

Criteria:

- [x] A pure core function gives an exercise's minimum bar width from its staff parts, and `notationFit` takes it in place of the fixed 190 (tested at the core seam: "four bars of sixteenths at 860 px get 2 bars a line", "quarters still get 4", "one sixteenth bar at 390 px is drawn below 1x").
- [x] Four bars of `RLKK` don't overflow at 1280 px or at 390 × 844, and a four-bar quarter-note exercise still gets four bars a line. Checked in the browser.
