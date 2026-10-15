# 01: The editor opens by default

**What to build:** The docked editor shows expanded unless the drummer collapsed it, examples included. Drops the "an example opens collapsed" rule (design-and-looks story 16). See [spec](../spec.md) 1.

**As built:** `useEditorCollapsed` is just the device setting now. Expanding the editor on an example showed its bar delete and 16ths | trip switch, which do nothing there, so the delete is hidden and the switch disabled on an example.

**Status:** done

- [x] A first launch on desktop shows the editor expanded
- [x] The chevron still collapses it, and that is remembered
