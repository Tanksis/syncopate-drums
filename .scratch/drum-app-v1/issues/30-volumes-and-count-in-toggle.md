# 30: Volumes and count-in toggle

**What to build:** The Volume sidebar group has separate volumes for the click, the exercise (with a mute) and the groove layer, and the header has a count-in toggle. These are kept per device, not per exercise: they're set once and survive switching exercises and relaunching. With the exercise muted, the drummer can play the line over just the click and the groove.

See [spec.md](../spec.md): the device-settings store and the engine's three GainNodes.

**Blocked by:** 29 (Groove layer presets), 18 (Exercise autosaves and reopens at launch)

**Status:** ready-for-agent

- [x] The click, exercise and groove volume sliders drive their gains live; the exercise mute silences only the exercise
- [x] The count-in toggle turns the one-bar count-in on and off (honoured by `schedule`, tested)
- [x] All four settings are stored in the device-settings store, not in the exercise, and come back after a reload
- [x] Switching exercises doesn't change them

## Comments

- The count-in was already honoured by `schedule` and tested ("goes straight to bar 1 when the count-in is off"). This ticket adds the header toggle for it.
- Volumes run from 0 to 150%, where 100% is each layer's usual level (the groove's raised default from ticket 29). The core's `layerLevels` turns the device settings into a level per layer, with the mute zeroing only the exercise, and tests cover it. On every tick the engine multiplies its base gains by those levels, easing over a few ms so slider moves don't crackle. The by-ear check is left to the user.
- Like the BPM and swing sliders, a slider drag saves once it settles, and switching exercises saves the device settings at once.
