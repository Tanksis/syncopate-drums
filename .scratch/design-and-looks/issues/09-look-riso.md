# 09: The Riso look

**What to build:**
- Add the Riso look, as on the canvas's "G · Riso zine" board: its token values, its fonts and its ornaments.
- It looks like a risograph zine:
  - **Colours:** everything in riso blue (`#1E2C9E`) on paper (`#F1ECE1`). Fluorescent pink (`#FF4FA8`) is the accent and a 6 px offset shadow behind cards (`--card-offset`).
  - **Borders:** 2 px, blue.
  - **Type:** Familjen Grotesk body and Space Mono numbers. Headings and wordmark are Bagel Fat One, the wordmark with a pink text-shadow.
- **Modes:** light only.
- See [spec](../spec.md) and [ADR 0013](../../../docs/adr/0013-looks-are-skins.md).

**Blocked by:** 02, 03, 04, 05

**Status:** ready-for-agent

- [ ] Every token set under `:root[data-look='riso']`
- [ ] Familjen Grotesk, Bagel Fat One and Space Mono load only while it is the look
- [ ] Listed in the Look menu and in `LIGHT_ONLY_LOOKS`
- [ ] AA for text and 3:1 for control edges and states, including text on the pink fill
- [ ] Layout, sizes and spacing identical to Studio (screenshots side by side)
- [ ] Checked in the browser at 1280 px and 390 × 844, with the device in dark mode too
