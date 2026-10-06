# 29: Groove layer presets

**What to build:** In the Groove sidebar group the drummer picks a groove preset:
- off
- "Jazz ride + hi-hat 2 & 4"
- the same plus feathered bass drum on all 4
- "Straight eighths on hi-hat"

The groove layer is drawn on the same staff above the exercise (stems up, x noteheads, hi-hat foot below the staff). It plays and swings with the exercise, and by default it's loud enough to sit level with the snare. The preset is remembered per exercise.

See [spec.md](../spec.md):
- groove presets as core data (id, display name, per-bar hits with tick, instrument and notation position/notehead)
- `schedule` emitting groove hits for each played bar
- the groove gain's default

**Blocked by:** 28 (Swing feel)

**Status:** ready-for-agent

- [ ] The four presets are data in the core
- [ ] `schedule` emits groove events for every played bar (including loop wraps), swung like the exercise; tests cover each preset's hits
- [ ] The notation view draws the groove as a second voice (stems up, x noteheads, hi-hat foot below the staff), with the exercise stems down
- [ ] The groove gain's default is raised so the groove sits level with the snare
- [ ] The preset selector autosaves with the exercise, and the preset comes back on reopen
