# 03: Library toolbar

**What to build:** The Library tab's eight text buttons become one row: a **+** menu (New, New from pattern…, New folder), Duplicate and Delete icon buttons, and a **⋯** menu (Import…, Export all), with the filter full width under it. See [spec](../spec.md) stories 1–5.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Inline SVG icons in `src/components/icons.tsx` (`currentColor`, no dependency)
- [ ] The **+** and **⋯** menus use the shared `Menu`; Import… opens the file picker
- [ ] Duplicate and Delete as icon buttons with `aria-label` and `title`; Delete disabled on an example
- [ ] Finger-sized targets on the phone
- [ ] Checked in the browser at 1280 px and 390 × 844 (touch), light and dark
