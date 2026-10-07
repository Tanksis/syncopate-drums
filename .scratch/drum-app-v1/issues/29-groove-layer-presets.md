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

**Status:** done (merged in PR #19, 2026-10-07)

- [x] The four presets are data in the core
- [x] `schedule` emits groove events for every played bar (including loop wraps), swung like the exercise; tests cover each preset's hits
- [x] The notation view draws the groove as a second voice (stems up, x noteheads, hi-hat foot below the staff), with the exercise stems down
- [x] The groove gain's default is raised so the groove sits level with the snare
- [x] The preset selector autosaves with the exercise, and the preset comes back on reopen

## Comments

- From ticket 28: `trimTimeline` and `playheadAt` in `src/core/timeline.ts` assume timeline entries are in time order. Swing moves a straight & later, to tick 9 at 75%, so it can land after a triplet-grid groove hit (tick 8) in the same beat. Sort each window's events by time, or check the order, before they go on the timeline.
- `schedule` sorts each window's events by time. A groove hit can still land before an exercise note scheduled in the previous window, so the engine leaves groove events off the highlight timeline. The timeline holds only clicks and exercise notes, which are in order.
- The spec doesn't give hit velocities. Each groove hit carries one, relative to the instrument's usual level, following the playback prototype: the ride is louder on 2 and 4 and the skip note softer, and the hi-hat is louder on the beats. `ScheduledEvent` gets an optional `velocity` for them.
- The groove gain is 3.5, up from 0.7. Roughly K-weighted over the first 400 ms, the ride sample is about 11 dB quieter than the snare. At this gain, closed hi-hat eighths sit about 7 dB under the snare, and peaks stay well clear of clipping. The by-ear check is left to the user.
- In the notation, grooved lines get three extra stave lines above for the stems. VexFlow moves a rest that collides with a groove chord one line down, onto the hi-hat foot, so the renderer puts it back and shifts it beside the chord instead, as VexFlow does with notes.
- Follow-up (PR #20, 2026-10-07): a quarter rest beside a feathered bass drum chord ran into the bass drum's normal notehead, which is wider than the x heads the shift is based on. Rests now stand 10 px clear. At the user's request, the swing presets also gained an "off" button (50%, straight).
