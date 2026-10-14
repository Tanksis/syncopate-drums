# 08: The Score look

**What to build:**
- Add the Score look, as on the canvas's "E · Engraved score" board: its token values, its fonts and its wordmark.
- It looks like engraved sheet music:
  - **Colours:** `#F7F5EF` paper, black ink and controls, and 1 px black rules. Red pencil (`#C8102E`) is used only for Play, the playhead and the wordmark's "!".
  - **Shapes:** square corners.
  - **Type:** EB Garamond body with small-caps section headings, and an italic Instrument Serif wordmark.
- **Modes:** light only.
- See [spec](../spec.md) and [ADR 0013](../../../docs/adr/0013-looks-are-skins.md).

**Blocked by:** 02, 03, 04, 05

**Status:** done

- [x] Every token set under `:root[data-look='score']`
- [x] EB Garamond and Instrument Serif load only while it is the look
- [x] Listed in the Look menu and in `LIGHT_ONLY_LOOKS`
- [x] AA for text and 3:1 for control edges and states
- [x] Layout, sizes and spacing identical to Studio (screenshots side by side)
- [x] Checked in the browser at 1280 px and 390 × 844, with the device in dark mode too
