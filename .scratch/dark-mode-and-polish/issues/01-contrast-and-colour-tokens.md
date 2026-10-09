# 01: Contrast and colour tokens

**What to build:** Every colour in the app, the notation included, comes from the design tokens. The light theme meets WCAG AA. See [spec](../spec.md) story 18.

**Blocked by:** None (can start immediately)

**Status:** done (merged in PR #65, 2026-10-09)

- [x] The notation's colours in `staff.ts` (ink, accent, loop, shading, sticking overrides) and any other hard-coded colour in `src/` are read from the `@theme` tokens. The notation reads them as CSS variables when it draws
- [x] In the light theme, text meets 4.5:1 against the surface it sits on, and large text, control borders and states meet 3:1. This covers the `e & a` count labels and `text-mute`
- [x] Measured on the rendered page at 1280 px and 390 × 844 (computed colours against their backgrounds), and before/after screenshots look the same apart from the darker greys

## Comments

Choices made where the spec was silent:
- Control borders (buttons, fields, cells, segmented controls) got a new `edge` token (#857f7a) to reach 3:1. `line` stays for dividers and for the bar and beat cards, which are containers. Their selected and looped states have an accent or amber border.
- To pass AA, these tokens were adjusted beyond `mute`: `accent` (a touch darker), `loop-ink`, `loop-line` and `kick`, and the kick hold went from /70 to /80. Also new: `on-accent` (was `text-white`), `select` (was `sky-100`) and `accent-tint` (the current bar shade in the staff).
- `@theme static`, so that the notation's `getComputedStyle` always finds the variables. VexFlow's own black is repainted in `ink` after drawing.
- Contrast was measured headless in Chromium (desktop 1280 and iPhone 13 at 390 × 844) with no failures. Before and after screenshots match apart from the darker greys and borders.
