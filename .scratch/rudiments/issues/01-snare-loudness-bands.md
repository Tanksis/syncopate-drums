# 01: The snare's loudness bands and varied strokes

**What to build:** Replace the three snare files rotated today (vl18, vl21, vl24, which are three loudness levels, not round robins) with Virtuosity Drums' overhead snare-center bands for **normal**, **accent** and **grace**, plus the **buzz** articulation's layers. Each stroke picks a file at random from its band, never the one just played, with about ±1 dB of random gain. Normal notes get a little softer than today. Only normal plays until accents land (02). See [spec](../spec.md), Samples and playback, and story 10.

**Blocked by:** none

**Status:** ready-for-agent

- [ ] The band files added under `public/samples/` (FLAC), listed in `LICENSE.txt`
- [ ] Random pick within a band, never the last file, ±1 dB; the logic in the core where it's pure, unit-tested
- [ ] Exercises play from the normal band; nothing else changes
- [ ] Left to the user: by ear, the normal level and fast singles (no machine-gun)
