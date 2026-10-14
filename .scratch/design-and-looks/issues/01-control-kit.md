# 01: Control kit

**What to build:**
- One set of shared controls in `src/components/`, styled in Studio:
  - `Segmented`;
  - `Menu`, reachable with the keyboard;
  - `Switch`;
  - buttons (primary, secondary, ghost, icon);
  - `Slider` and `ValueField`.
- Swap them in wherever the app now builds its own.
- Studio's dark accent becomes blue, so a selected option and Play keep their colour in dark mode.
- See [spec](../spec.md) stories 1–4 and the canvas's Control kit board.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `Segmented` (`role="radiogroup"`, roving tabindex, arrow keys) replaces `Choice`, the swing presets, the theme group, the lead hand and the grid's 16ths/trip buttons
- [ ] `Menu`:
  - [ ] Tab reaches its button; Enter, Space or ↓ opens it on the checked item
  - [ ] ↑/↓, Home and End move; Enter chooses; Esc and Tab close and return focus
  - [ ] A mouse click still keeps focus where it was
- [ ] `Switch` replaces the lowercase `count-in` and `mute` toggles, and button variants replace one-off button classes
- [ ] Space pauses playback only when the focused control doesn't use Space
- [ ] Studio dark:
  - [ ] blue accent
  - [ ] AA for text and 3:1 for control edges and states, in both modes
  - [ ] visible focus rings
- [ ] Checked in the browser, keyboard and real mouse, at 1280 px and 390 × 844, light and dark
