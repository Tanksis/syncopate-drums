# 07: The Bold look

**What to build:**
- Add the Bold look, as on the canvas's "C · Bold" boards: its token values, its fonts and its ornaments.
- **Colours:** black and lime (`#0B0B0C` and `#D9FF45`). In light, the lime Play has a black border.
- **Borders and shadows:** 2 px borders, and a hard 4 px offset shadow on cards in light (`--card-offset`).
- **Type:** Manrope body, with Space Grotesk headings.
- **Shapes:** 4 px radii and pill chips.
- **Modes:** light and dark.
- See [spec](../spec.md) and [ADR 0013](../../../docs/adr/0013-looks-are-skins.md).

**As built:** in light the accent is the ink, so the notation's cursor and changed hands are olive (`#5A6B00`) to stand out.

**Blocked by:** 02, 03, 04, 05

**Status:** done

- [x] Every token set under `:root[data-look='bold']`, with its dark values
- [x] Manrope and Space Grotesk load only while it is the look
- [x] Listed in the Look menu
- [x] AA for text and 3:1 for control edges and states, in light and dark
- [x] Layout, sizes and spacing identical to Studio (screenshots side by side)
- [x] Checked in the browser at 1280 px and 390 × 844, light and dark
