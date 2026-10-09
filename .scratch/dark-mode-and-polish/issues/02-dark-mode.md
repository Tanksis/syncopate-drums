# 02: Dark mode

**What to build:** An Auto / Light / Dark switch in a new Display section of Settings, a warm near-black dark theme with dark notation, and no white flash at launch. See [spec](../spec.md) stories 1–6.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Core: the device settings have `theme: 'auto' | 'light' | 'dark'`, defaulting to `'auto'`, and a stored unknown value is dropped (tested)
- [ ] A Display section at the bottom of Settings holds an Auto / Light / Dark segmented control, remembered on this device
- [ ] `data-theme` on `<html>` switches the tokens. Auto follows `prefers-color-scheme` live
- [ ] Dark tokens: background ≈ #1c1917, cards ≈ #292524, text ≈ #e7e5e4. Accent, play, kick and loop are retuned and meet the spec's AA targets
- [ ] The notation draws light lines and notes on the dark background, and redraws when the theme changes
- [ ] The choice is mirrored to `localStorage`, and an inline script in `index.html` applies it before render. If `localStorage` throws or is empty, it falls back to Auto
- [ ] Checked in the browser in both themes at 1280 px, 800 px and 390 × 844, with contrast measured. A reload in Dark shows no light frame
