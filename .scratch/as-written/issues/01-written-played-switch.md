# 01: The Written | Played switch, at a fixed height

**What to build:** When an exercise is played differently from how it is written, a small Written | Played switch shows at the top left of the notation card, on the desktop and the phone. Written draws the exercise alone, straight, with no pattern or feet. Each line is laid out to fit either version, so switching moves nothing. The choice is a device setting that starts on Played. The sticking, the cursor, clicks and the loop band work in both versions. See [spec](../spec.md), stories 1–7 and 9, and [ADR 0016](../../../docs/adr/0016-written-or-played-one-staff-at-a-time.md).

**Blocked by:** none

**Status:** done

- [x] `playedAsWritten(practice, timeSignature)` in the core, unit-tested
- [x] `DeviceSettings.notationShows`, default `'played'`, through `deviceSettingsFrom`, unit-tested
- [x] `drawExercise` lays every line out to the larger of the two versions' height and bar width, and draws the chosen one, with the sticking in both
- [x] The switch on desktop and phone, hidden when the exercise is played as written
- [x] `CONTEXT.md`: As written, As played; Device settings lists the notation's version
- [x] Checked in the browser with real mouse clicks: no bar number moves on switching (jazz comping and rock beat, 1440 × 900 with Fit on and off, and 390 × 844)
