# 01: Grid-only entry

**What to build:** Remove the beat figures from the interface, vim mode, and the Tie and Cut short commands, per [ADR 0009](../../../docs/adr/0009-grid-only-entry.md). See [spec](../spec.md) stories 1–5.

**Blocked by:** None (can start immediately)

**Status:** done (2026-10-09): checked headless in Chromium at 1280 px with real mouse events

- [x] The figures panel and its toggle, the keycap badge on each beat card, and the legend line under the cards are gone
- [x] The figure keys (`1`–`0`, `Z X C V B`, `A S D F G H`, `-`), `T`, `.`, Alt+1–4 and `Esc` do nothing in the editor. Tested in the core's key map
- [x] Vim mode is gone: `EditorMode`, the Normal-mode commands, the mode line and the `vim on/off` switch (header and settings sidebar)
- [x] `vimKeys` and `figuresPanelOpen` are no longer device settings, and a stored value is ignored. Tested: the defaults don't have them
- [x] The cheat sheet lists only the remaining keys (moving, `Tab`, `Backspace`/`Delete`, the bar keys, undo/redo, Space, `?`), in one list with no modes
- [x] The empty-exercise hint reads "Tap or click a grid position below to add hits."
- [x] Right-click on a beat card still switches its grid until ticket 02 replaces it, so there's no gap
- [x] Stored exercises with cut-short and tied beats spell exactly as before. Tested in the core
- [x] `CONTEXT.md` matches (already updated with the ADR)
- [x] Checked in the browser with real mouse events: entering, holding, the cheat sheet, an example, and an exercise with an old tie
