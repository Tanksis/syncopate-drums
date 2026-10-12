# 04: Desktop header fit

**What to build:** The header shows the exercise name, and its labels stay on one line. Below 900 px the BPM slider is hidden. See [spec](../spec.md) stories 13–15.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] The "Syncopate!" title stays. The BPM slider is about w-24. "count-in" and the loop readout don't wrap
- [x] The exercise name takes the remaining width and shows at least about 12 characters before truncating. "Example: syncopated eighths" shows in full at 1280 px with both sidebars open, or if it can't, says why in the ticket
- [x] From 640 px to 900 px the BPM slider is hidden and the field stays. The header is one line at 640 px, 800 px and 1280 px
- [x] Checked in the browser at those widths, with both sidebars open and collapsed

**Built:** the header measures its own width (window minus open sidebars), not the window's. Hiding only the BPM slider below 900 px wasn't enough: at 640 px the header is 576 px wide, and the rest of the transport alone is about 490 px. So there are three steps, by header width:
- 860 px and up: everything shows, with the slider at w-24.
- 750 to 860 px: the slider goes.
- Under 750 px: the count-in and loop readout move to a Playback group at the top of the Settings sidebar, as on the phone.

The thresholds leave the name its 12 characters even with a loop range set ("Loop bars 1–2 all" is about 50 px wider). At 1280 px with both sidebars open the header is 800 px, so the slider goes and "Example: syncopated eighths" shows in full; with a loop set, it's cut to "Example: syncopate…". Checked headless at 640, 800, 900, 1000 and 1280 px, both sidebars open and collapsed, with and without a loop.
