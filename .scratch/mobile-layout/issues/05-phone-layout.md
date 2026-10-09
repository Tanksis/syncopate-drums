# 05: Phone layout: header, drawers and transport bar

**What to build:** Below 640 px wide, the app is a column: a compact header (☰, the exercise name, ⚙), the notation filling the screen, and a transport bar fixed at the bottom (play/pause, BPM −/+ and value, Edit). The sidebars open full-screen. Keyboard hints are hidden on touch devices at any width. See [spec](../spec.md) stories 15–17 and 21–22.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Below 640 px there are no rails. ☰ and ⚙ open the exercises and settings sidebars as full-screen overlays with a close button, and opening an exercise closes it
- [ ] The exercise name renames on tap, and the "Not saving" warning still shows when storage fails
- [ ] The transport bar is fixed to the bottom with `env(safe-area-inset-bottom)` added to its padding. It holds play/pause, BPM − and + (holding repeats) and the BPM value. Edit stays hidden until 06
- [ ] The grid editor isn't shown below 640 px until 06 adds the sheet
- [ ] Heights use `dvh`, so iOS's toolbar doesn't cover the bar
- [ ] With a coarse primary pointer, the `?` button and the cheat sheet are hidden
- [ ] From 640 px up, the layout is unchanged
- [ ] Checked in Playwright WebKit at 390 × 844 with touch (the drawers, play/pause, the BPM buttons, rename), and at 900 px and 1280 px for no change
