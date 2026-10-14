# 03: Settings panel

**What to build:**
- The settings sidebar, and the phone's settings sheet, are rebuilt in four sections:
  - **Groove:**
    - Preset and Hi-hat foot as menus;
    - Swing with Straight / Light / Medium / Triplet / Dotted chips.
  - **Sticking:**
    - current labels;
    - "Reset N changed hands" only when N > 0.
  - **Mix:** a mute button per layer.
  - **Appearance:** what's called Display now.
- Muting the click and the groove is new: two new device settings.
- See [spec](../spec.md) stories 8–12.

**Blocked by:** 01

**Status:** done

- [x] Core: `clickMuted` and `grooveMuted` device settings (default off), honoured by playback like `exerciseMuted`, with tests
- [x] Hi-hat foot menu: Off, On 1, Quarters, 2 & 4, Off-beats, each with a short hint
- [x] Preset as a `Menu`
- [x] Swing chips renamed; the value field and slider kept
- [x] "Reset N changed hands" hidden at 0
- [x] Sections named Groove, Sticking, Mix, Appearance; `CONTEXT.md` updated where it names them
- [x] Checked in the browser at 1280 px and in the phone sheet at 390 × 844
