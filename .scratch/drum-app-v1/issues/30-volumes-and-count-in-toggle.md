# 30: Volumes and count-in toggle

**What to build:** The Volume sidebar group has separate volumes for the click, the exercise (with a mute) and the groove layer, and the header has a count-in toggle. These are kept per device, not per exercise: they're set once and survive switching exercises and relaunching. With the exercise muted, the drummer can play the line over just the click and the groove.

See [spec.md](../spec.md): the device-settings store and the engine's three GainNodes.

**Blocked by:** 29 (Groove layer presets), 18 (Exercise autosaves and reopens at launch)

**Status:** ready-for-agent

- [ ] The click, exercise and groove volume sliders drive their gains live; the exercise mute silences only the exercise
- [ ] The count-in toggle turns the one-bar count-in on and off (honoured by `schedule`, tested)
- [ ] All four settings are stored in the device-settings store, not in the exercise, and come back after a reload
- [ ] Switching exercises doesn't change them
