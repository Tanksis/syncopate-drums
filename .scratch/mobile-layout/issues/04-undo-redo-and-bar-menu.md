# 04: Undo and redo buttons, and the bar menu

**What to build:** ↶ and ↷ buttons, and a ⋯ menu for the cursor bar (Add bar after, Duplicate, Copy, Paste over, Delete), in the bar tab row. See [spec](../spec.md) stories 12–14.

**Blocked by:** 01

**Status:** done

- [x] ↶ ↷ dispatch `undo`/`redo`, and are disabled when there's nothing to undo or redo
- [x] The bar menu's items dispatch the existing commands on the cursor bar. Paste over is disabled when nothing is copied, and Delete on the only bar
- [x] The bar keys (Shift+arrows, Ctrl+C/V, Ctrl+Enter, Ctrl+D, Ctrl+Backspace, Ctrl+Z, Ctrl+Shift+Z) keep working
- [x] The buttons and menu are hidden on an example
- [x] Checked in the browser with real mouse events at 1280 px and 900 px

**Decided while building:** the menu items use the bar keys' commands unchanged, so with a Shift+arrow selection, Copy and Delete act on the selected bars. Every label names the bars it acts on ("Copy bars 2–3", "Paste over bars 1–2" for a two-bar clipboard, cut off at the end of the exercise). On a touch screen nothing can be selected, so there the menu acts on one bar, as the spec says. Delete is disabled only when the exercise has one bar; a selection covering every bar still deletes them, leaving one bar of rests, the same as Ctrl+Backspace. `Menu` items gained `disabled`. The order in the row is bar tabs, ↶ ↷, ⋯. Browser check: headless Chromium at 1280 and 900 px with real mouse clicks, checking hit-testing with `elementFromPoint`. Merged in PR #59.
