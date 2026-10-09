# 02: Dark mode

**What to build:** An Auto / Light / Dark switch in a new Display section of Settings, a warm near-black dark theme with dark notation, and no white flash at launch. See [spec](../spec.md) stories 1–6.

**Blocked by:** 01

**Status:** done (merged in PR #66, 2026-10-09)

- [x] Core: the device settings have `theme: 'auto' | 'light' | 'dark'`, defaulting to `'auto'`, and a stored unknown value is dropped (tested)
- [x] A Display section at the bottom of Settings holds an Auto / Light / Dark segmented control, remembered on this device
- [x] `data-theme` on `<html>` switches the tokens. Auto follows `prefers-color-scheme` live
- [x] Dark tokens: background ≈ #1c1917, cards ≈ #292524, text ≈ #e7e5e4. Accent, play, kick and loop are retuned and meet the spec's AA targets
- [x] The notation draws light lines and notes on the dark background, and redraws when the theme changes
- [x] The choice is mirrored to `localStorage`, and an inline script in `index.html` applies it before render. If `localStorage` throws or is empty, it falls back to Auto
- [x] Checked in the browser in both themes at 1280 px, 800 px and 390 × 844, with contrast measured. A reload in Dark shows no light frame

## Comments

Choices made where the spec was silent:
- `data-theme` always holds the resolved theme (`light` or `dark`), never `auto`. Auto is resolved in JS (`followTheme` in `src/app/theme.ts`, and the inline script), so the CSS needs only one dark block.
- The theme is applied outside React, through a store subscription and a media-query listener registered before the app renders. Applying it in App's layout effect ran after the notation's own layout effect, so the staff redrew with the old colours.
- `color-scheme` is set on `<html>` with the theme, so native controls, scrollbars and the canvas before the CSS loads are dark as well.
- New token `shade` for shadows and the dialog backdrop (dark in both themes). `ink` turns light in dark mode and would have made them glow.
- Dark `on-accent` is the near-black, because text on the lighter accent and danger fills needs a dark colour to pass AA.
- If IndexedDB fails to open at launch, the mirror isn't overwritten with the default, so the inline script's theme stands.
- Checked headless (Chromium at 1280 and 800, WebKit with touch at 390 × 844) with contrast measured on the rendered text, and no failures in either theme. A Dark reload has `data-theme=dark` and a dark colour scheme on the first frame.
