# 05: Phone layout: header, drawers and transport bar

**What to build:** Below 640 px wide, the app is a column: a compact header (☰, the exercise name, ⚙), the notation filling the screen, and a transport bar fixed at the bottom (play/pause, BPM −/+ and value, Edit). The sidebars open full-screen. Keyboard hints are hidden on touch devices at any width. See [spec](../spec.md) stories 15–17 and 21–22.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Below 640 px there are no rails. ☰ and ⚙ open the exercises and settings sidebars as full-screen overlays with a close button, and opening an exercise closes it
- [x] The exercise name renames on tap, and the "Not saving" warning still shows when storage fails
- [x] The transport bar is fixed to the bottom with `env(safe-area-inset-bottom)` added to its padding. It holds play/pause, BPM − and + (holding repeats) and the BPM value. Edit stays hidden until 06
- [x] The grid editor isn't shown below 640 px until 06 adds the sheet
- [x] Heights use `dvh`, so iOS's toolbar doesn't cover the bar
- [x] With a coarse primary pointer, the `?` button and the cheat sheet are hidden
- [x] From 640 px up, the layout is unchanged
- [x] Checked in Playwright WebKit at 390 × 844 with touch (the drawers, play/pause, the BPM buttons, rename), and at 900 px and 1280 px for no change

**Decided while building:** the phone's play button is play/pause (`togglePause`), so it resumes where it paused; the playback position readout and Stop aren't on the phone. Count-in and the loop readout show in a Playback group at the top of the full-screen Settings. `index.html` sets `viewport-fit=cover`, which `env(safe-area-inset-*)` needs; the header and the full-screen sidebars also add the top inset. The phone's text inputs are 16 px, so iOS doesn't zoom in on focus. `useNarrowWindow.ts` became `useMediaQuery.ts` (`useNarrowWindow`, `usePhoneWindow`, `useCoarsePointer`). The empty hint still says "below", which is true once 06 adds the sheet. Browser check: Playwright WebKit at 390 × 844 with touch, using real taps; Windows WebKit has no `AudioContext`, so play/pause was checked in Chromium phone emulation. Screenshots at 900 and 1280 px were byte-identical to `main`. Merged in PR #60.
