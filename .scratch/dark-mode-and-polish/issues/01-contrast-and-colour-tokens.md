# 01: Contrast and colour tokens

**What to build:** Every colour in the app, the notation included, comes from the design tokens. The light theme meets WCAG AA. See [spec](../spec.md) story 18.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The notation's colours in `staff.ts` (ink, accent, loop, shading, sticking overrides) and any other hard-coded colour in `src/` are read from the `@theme` tokens. The notation reads them as CSS variables when it draws
- [ ] In the light theme, text meets 4.5:1 against the surface it sits on, and large text, control borders and states meet 3:1. This covers the `e & a` count labels and `text-mute`
- [ ] Measured on the rendered page at 1280 px and 390 × 844 (computed colours against their backgrounds), and before/after screenshots look the same apart from the darker greys
