# 05: Look engine and picker (Studio)

**What to build:**
- The look system ([ADR 0013](../../../docs/adr/0013-looks-are-skins.md)), with Studio as its first and default look:
  - the `Look` device setting and the light-only rule;
  - extra tokens for fonts, radius, borders, shadows and ornaments;
  - `data-look` on `<html>` from the first paint;
  - per-look font loading;
  - the Look menu and Mode in Appearance.
- See [spec](../spec.md) stories 17–22.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Core, with tests:
  - [ ] `Look`, `LOOKS` and `LIGHT_ONLY_LOOKS`
  - [ ] `withLook`, which sets the theme to `auto` for a light-only look
  - [ ] `drawnMode`
  - [ ] `deviceSettingsFrom` drops unknown looks
- [ ] `index.css`: font, radius, border-width, shadow and ornament tokens (`--header-ornament`, `--card-offset`, `--wordmark-*`), with Studio's values as the defaults
- [ ] `followTheme` sets `data-look` and uses `drawnMode`; `index.html` mirrors `syncopate-look` for the first paint
- [ ] Fonts:
  - [ ] `@fontsource` Geist and Geist Mono, loaded by a per-look dynamic import
  - [ ] `check-licenses.mjs` allows `OFL-1.1` for `@fontsource/*` only
- [ ] The notation's sticking letters and bar numbers use the font token
- [ ] Appearance has a Look `Menu` and Mode as `Segmented`. For a light-only look, Mode is disabled with the hint "‹Look› is light only"
- [ ] Checked in the browser: no flash of the wrong look at launch, light and dark
