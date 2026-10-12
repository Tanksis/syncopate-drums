# 02: Fill a bar with a pattern

**What to build:** "Fill with pattern…" in the bar ⋯ menu opens a dialog where the drummer types a sticking pattern (R, L, K, `.`) and picks 16ths or triplets. The bar is replaced with the pattern repeated from beat 1, with the typed hands. See [spec](../spec.md) stories 1–11.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Core: `parsePattern` accepts R, L, K and `.` in any case, ignores whitespace, and refuses anything else or an empty pattern (tested)
- [ ] Core: a pattern fill puts every beat of the bar on the chosen grid and lays the steps in order, repeating across beats: R/L on the snare row, K on the kick row, `.` a rest in both, default holds (tested)
- [ ] Core: the fill replaces both rows and is one undo step (tested)
- [ ] Core: sticking off becomes natural, and overrides are written only where the computed hand differs from the typed one (tested)
- [ ] The pattern dialog: a pattern field with an inline error and Fill disabled while invalid, a 16ths | triplets control, Enter fills and Escape cancels. 16 px field and full width on the phone
- [ ] "Fill with pattern…" in the bar ⋯ menu, hidden on examples
- [ ] Checked in the browser with real mouse and keyboard at 1280 px, and touch at 390 × 844
