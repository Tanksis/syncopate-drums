# 04: Busy music stays spread out on a phone

**What to build:** `notationFit` scales up only while a bar stays at least 80% of its minimum width, so the triplets example on a phone looks as spread out as the syncopated eighths. See [spec](../spec.md) 5.

**As built:** `SCALE_UP_SQUEEZE` (0.8) in `notationFit`. At 390 px the triplets example goes from 1.6× with 153-unit bars to 1.3× with 210-unit bars; eighths still reach 1.6×.

**Status:** done

- [x] Tested at `notationFit`
- [x] Triplets at 390 × 844 look like syncopated eighths' spacing
