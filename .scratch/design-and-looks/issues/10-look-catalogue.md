# 10: The Catalogue look

**What to build:**
- Add the Catalogue look, as on the canvas's "I · '70s catalogue" board: its token values, its fonts and its ornaments.
- It looks like a '70s drum catalogue:
  - **Colours:** mustard and cream (`#F4E4C1`) with burnt orange (`#B5461A`).
  - **Ornament:** three stripes under the header, in orange, mustard and brown (`--header-ornament`).
  - **Type:** Nunito body, Righteous headings and numbers, and a Shrikhand wordmark.
  - **Shapes:** 12 and 20 px radii.
- **Modes:** light only.
- See [spec](../spec.md) and [ADR 0013](../../../docs/adr/0013-looks-are-skins.md).

**Blocked by:** 02, 03, 04, 05

**Status:** ready-for-agent

- [ ] Every token set under `:root[data-look='catalogue']`
- [ ] Nunito, Righteous and Shrikhand load only while it is the look
- [ ] Listed in the Look menu and in `LIGHT_ONLY_LOOKS`
- [ ] AA for text and 3:1 for control edges and states
- [ ] Layout, sizes and spacing identical to Studio, apart from the stripes (screenshots side by side)
- [ ] Checked in the browser at 1280 px and 390 × 844, with the device in dark mode too
