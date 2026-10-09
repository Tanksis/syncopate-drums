# 04: Undo and redo buttons, and the bar menu

**What to build:** ↶ and ↷ buttons, and a ⋯ menu for the cursor bar (Add bar after, Duplicate, Copy, Paste over, Delete), in the bar tab row. See [spec](../spec.md) stories 12–14.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] ↶ ↷ dispatch `undo`/`redo`, and are disabled when there's nothing to undo or redo
- [ ] The bar menu's items dispatch the existing commands on the cursor bar. Paste over is disabled when nothing is copied, and Delete on the only bar
- [ ] The bar keys (Shift+arrows, Ctrl+C/V, Ctrl+Enter, Ctrl+D, Ctrl+Backspace, Ctrl+Z, Ctrl+Shift+Z) keep working
- [ ] The buttons and menu are hidden on an example
- [ ] Checked in the browser with real mouse events at 1280 px and 900 px
