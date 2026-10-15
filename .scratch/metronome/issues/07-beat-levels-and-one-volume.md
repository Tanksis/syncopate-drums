# 07: Beat levels that sound right, and one volume

**What to build:** The user's feedback after tickets 05 and 06 (2026-10-15): "The full bar sounds perfect, and the 1 should default be fully filled. 2 3 and 4 should be 1/3, which is too quiet at the moment. This default 1/3 SHOULD Be the exact same sound as the 'inbetweens' when it comes to the subdivisions, while the 2/3 bar should be an accented hit." Asked about the volumes: "There should just be one volume slider."

- **Accent** (the full block) sounds as it does now.
- **Normal** (2/3) is an accented hit too: the accent's high pitch, a bit quieter (the gain Normal has now, 0.6 of the accent).
- **Soft** (1/3) sounds exactly like a subdivision click: the same low pitch and the same gain.
- **Defaults:** beat 1 Accent and the rest Soft, for fresh settings and on a time signature change. Bars already saved keep their levels (no migration).
- **One Volume** for every click, beats and subdivisions alike, replacing the Beats and Subdivision volumes. A stored setting from before takes the old beats volume.

**Blocked by:** none

**Status:** done, bar the by-ear check

- [x] Soft and subdivision clicks share one gain and the low pitch; Normal plays the high pitch at 0.6
- [x] `freshLevels` gives Accent then Soft; stored levels are padded with Soft
- [x] `MetronomeSettings` has one `volume`; `metronomeSettingsFrom` reads it, or the stored `beatVolume`
- [x] One Volume slider on the desktop page and on the phone (in the Sound sheet; the Rhythm sheet loses its slider)
- [x] `CONTEXT.md` (Beat level, Subdivision) and the spec say so
- [ ] Left to the user: the by-ear check
