# 06: The Warm look

**What to build:**
- Add the Warm look, as on the canvas's "B · Practice room" boards: its token values, its fonts and any ornaments.
- **Colours:**
  - warm paper tones (`#F4EEE6` ground);
  - a terracotta accent: `#B0442A`, or `#EF8C64` in dark.
- **Type:** DM Sans body, with Fraunces serif headings and wordmark.
- **Shapes:** 10 and 18 px radii, and round pill chips.
- **Modes:** light and dark.
- See [spec](../spec.md) and [ADR 0013](../../../docs/adr/0013-looks-are-skins.md).

**Blocked by:** 02, 03, 04, 05

**Status:** ready-for-agent

- [ ] Every token set under `:root[data-look='warm']`, with its dark values
- [ ] DM Sans and Fraunces load only while it is the look
- [ ] Listed in the Look menu
- [ ] AA for text and 3:1 for control edges and states, in light and dark
- [ ] Layout, sizes and spacing identical to Studio (screenshots side by side)
- [ ] Checked in the browser at 1280 px and 390 × 844, light and dark
