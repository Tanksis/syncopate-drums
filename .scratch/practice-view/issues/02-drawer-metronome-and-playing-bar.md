# 02: Settings drawer at 1024, no library on the Metronome, the playing bar shaded

**What to build:** At 1024 px wide and below, the Practice settings are a drawer from the header's Settings button. The library sidebar isn't shown on the Metronome screen. While the line plays, the bar being heard is shaded in the playhead's colour and the playhead is heavier, drawn over the staff so nothing moves. See [spec](../spec.md), stories 5-7.

**Blocked by:** 01

**Status:** done (merged in PR #PRNUM, 2026-11-16)

- [x] Practice settings a drawer at 1024 px and below (the Metronome's stay docked down to 1000 px), unit-tested in `workstationLayout`
- [x] The library sidebar hidden on the Metronome; its state on Practice kept
- [x] The playing bar shaded (`fill-play/12`) behind the music, the playhead 3 units wide, on the desktop and the phone
- [x] Checked at 1024 x 768 (the drawer from the header button, Esc closing it), on the Metronome at 1440 and 1024, and on a 390 x 844 phone, light and dark
