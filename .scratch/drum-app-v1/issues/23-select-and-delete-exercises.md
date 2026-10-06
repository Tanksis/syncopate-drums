# 23: Select and delete exercises

**What to build:** Each exercise in the library has a checkbox, so the drummer can select several. Deleting the open exercise or the selection asks once, in a confirm dialog that shows the count and warns it can't be undone. Deleting the open exercise opens the next most recent one, or a new Untitled one if none remain.

See [spec.md](../spec.md): library rules (which exercise to open after a delete).

**Blocked by:** 22 (Exercise library sidebar)

**Status:** done (merged in PR #10, 2026-10-06)

- [x] Checkbox multi-select in the library list, kept through filtering
- [x] "Delete selected" shows one confirm with the count and a "can't be undone" warning; cancelling deletes nothing
- [x] Deleting removes the exercises from IndexedDB (delete many)
- [x] The open-after-delete rule is tested in the core and applied in the UI; the screen is never empty

## Comments

- 2026-10-06: Squash-merged as PR #10. Choices where the spec was silent: a separate Delete button deletes the open exercise, and a bar with "N selected", Clear and Delete selected appears while anything is ticked. "Next most recent" means the highest last-opened time among the exercises left, not the next row in the list. Delete selected includes ticked rows the filter hides, and the dialog's count includes them. Deleting the open exercise keeps the rest of the selection. Editor keys are ignored while a dialog is open. A `danger` colour token now replaces raw `red-700`.
