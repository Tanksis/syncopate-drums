# 13. Looks are skins over one layout

Date: 2026-10-14

Status: accepted

The user wants the app's visual style to be a choice. Six of the mocked-up directions became **looks**: Studio, Warm, Bold, Score, Riso and Catalogue (`.scratch/design-and-looks/spec.md`). The app already draws every colour from tokens in `src/styles/index.css` and switches light and dark with `data-theme` on `<html>`. Looks reuse that mechanism.

## What a look may change

A look is a set of design-token values plus a fixed set of ornaments:

- **May change:** colours (including the few that most looks derive from the accent or the dividers: the Play button's fill and edge, a ghost control's hover and the notation's accent), fonts (body, display, numbers), corner radius (small, large, and a chip's: a segmented control and its options, which Warm makes round pills), border width, and shadows.
- **Ornaments:** fixed hooks, set by tokens:
  - a box-shadow under the header (Catalogue's stripes);
  - an offset shadow on cards (Bold, Riso);
  - the wordmark's font, style, case and shadow, and the colour of its "!".
- **Never changes:** layout, sizes or spacing. Every look lays out exactly like Studio, so behaviour, hit targets and the notation's fit are the same whichever is chosen, and are tested once.
- **The notation:** a look's colours and its sticking-and-bar-number font apply. Noteheads, rests and beams keep the standard engraving font.

A look is never free-form CSS. A new ornament means adding a token-driven hook that every look can set.

## Look and mode are two settings

The device setting `theme` (Auto / Light / Dark) stays as the **mode**. `look` is a second device setting, defaulting to Studio.

- Studio, Warm and Bold come in light and dark, and follow the mode.
- Score, Riso and Catalogue are **light only**: their identity is paper and ink. Choosing one sets the mode to Auto, and the look draws light whatever the mode or the device says. Mode is disabled while it's chosen. Leaving it keeps the mode at Auto.

The pure core decides this (`withLook`, `drawnMode`). `<html>` carries `data-look` and `data-theme`, and the inline script in `index.html` applies both before the first paint from mirrored keys, as it does now for the theme.

## Fonts are self-hosted, per look

The looks' fonts come from `@fontsource` packages and load by a dynamic import of the active look's fonts only. Nothing is fetched from Google, the app works offline, and a drummer on Studio never downloads Shrikhand.

The fonts are OFL-1.1, which the shipped-licence check didn't allow. `scripts/check-licenses.mjs` now allows `OFL-1.1` for `@fontsource/*` packages only. Code dependencies stay MIT, ISC or CC0.

## Consequences

- Adding a look means one block of token values (two with dark), its fonts and a menu entry. No component changes.
- Components must use tokens for radius, border width, shadows and fonts as well as colour, or a look won't reach them.
- Every look is checked to AA in each of its modes.
