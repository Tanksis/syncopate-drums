# 02: Fill a bar with a pattern

**What to build:** "Fill with pattern…" in the bar ⋯ menu opens a dialog where the drummer types a sticking pattern (R, L, K, `.`) and picks 16ths or triplets. The bar is replaced with the pattern repeated from beat 1, with the typed hands. See [spec](../spec.md) stories 1–11.

**Blocked by:** None (can start immediately)

**Status:** done (merged in PR #74, 2026-10-12)

- [x] Core: `parsePattern` accepts R, L, K and `.` in any case, ignores whitespace, and refuses anything else or an empty pattern (tested)
- [x] Core: a pattern fill puts every beat of the bar on the chosen grid and lays the steps in order, repeating across beats: R/L on the snare row, K on the kick row, `.` a rest in both, default holds (tested)
- [x] Core: the fill replaces both rows and is one undo step (tested)
- [x] Core: sticking off becomes natural, and overrides are written only where the computed hand differs from the typed one (tested)
- [x] The pattern dialog: a pattern field with an inline error and Fill disabled while invalid, a 16ths | triplets control, Enter fills and Escape cancels. 16 px field and full width on the phone
- [x] "Fill with pattern…" in the bar ⋯ menu, hidden on examples
- [x] Checked in the browser with real mouse and keyboard at 1280 px, and touch at 390 × 844

## Comments

- The menu item reads "Fill bar N with pattern…", following the other bar menu items, which name the bar they act on.
- An empty field greys out Fill without a message. The message appears once something is typed, so the dialog doesn't open on an error.
- The fill cuts ties at both barlines of the bar. A tie into it is undone. A note in the next bar that was tied over out of it becomes a rest, as a removed hit's tied continuation does, so no unexpected hit appears there.
- The fill moves the cursor to beat 1 of the filled bar.
- A triplet beat that reads the same on either grid, such as `R..`, stays on the triplet grid (the pending grid).
- Overrides are checked only in the filled bar. Under alternate sticking, a fill that changes how many hands the bar has re-alternates the bars after it, as any edit does.
- `withPattern(exercise, bar, pattern, grid, from)` returns `next`, the step the following bar starts on, for New from pattern (03).
- The 16ths | Triplets control copies the Theme and Swing segmented controls. It could become a shared `SegmentedChoice` component.
