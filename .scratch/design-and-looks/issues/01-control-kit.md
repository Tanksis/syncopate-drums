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

**Status:** done

- [x] `Segmented` (`role="radiogroup"`, roving tabindex, arrow keys) replaces `Choice`, the swing presets, the theme group, the lead hand and the grid's 16ths/trip buttons
- [x] `Menu`:
  - [x] Tab reaches its button; Enter, Space or ↓ opens it on the checked item
  - [x] ↑/↓, Home and End move; Enter chooses; Esc and Tab close and return focus
  - [x] A mouse click still keeps focus where it was
- [x] `Switch` replaces the lowercase `count-in` and `mute` toggles, and button variants replace one-off button classes
- [x] Space pauses playback only when the focused control doesn't use Space
- [x] Studio dark:
  - [x] blue accent
  - [x] AA for text and 3:1 for control edges and states, in both modes
  - [x] visible focus rings
- [x] Checked in the browser, keyboard and real mouse, at 1280 px and 390 × 844, light and dark

**Notes:**
- The editor keeps plain Tab for switching rows. Shift+Tab moves focus into the controls, and Esc on a control gives the keyboard back to the editor. The user chose this.
- The exercise's mute is a `Switch` with its label hidden, because the Volume row has no room for it. Ticket 03 rebuilds Mix.
- The round Play buttons, the BPM ± buttons, the rail's Open button and the folder chevron keep their own styling.
