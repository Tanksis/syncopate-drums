# 23: Select and delete exercises

**What to build:** Each exercise in the library has a checkbox, so the drummer can select several. Deleting the open exercise or the selection asks once, in a confirm dialog that shows the count and warns it can't be undone. Deleting the open exercise opens the next most recent one, or a new Untitled one if none remain.

See [spec.md](../spec.md): library rules (which exercise to open after a delete).

**Blocked by:** 22 (Exercise library sidebar)

**Status:** ready-for-agent

- [ ] Checkbox multi-select in the library list, kept through filtering
- [ ] "Delete selected" shows one confirm with the count and a "can't be undone" warning; cancelling deletes nothing
- [ ] Deleting removes the exercises from IndexedDB (delete many)
- [ ] The open-after-delete rule is tested in the core and applied in the UI; the screen is never empty
