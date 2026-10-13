# 03: Library toolbar

**What to build:** The Library tab's eight text buttons become one row: a **+** menu (New, New from pattern…, New folder), Duplicate and Delete icon buttons, and a **⋯** menu (Import…, Export all), with the filter full width under it. See [spec](../spec.md) stories 1–5.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Inline SVG icons in `src/components/icons.tsx` (`currentColor`, no dependency)
- [x] The **+** and **⋯** menus use the shared `Menu`; Import… opens the file picker
- [x] Duplicate and Delete as icon buttons with `aria-label` and `title`; Delete disabled on an example
- [x] Finger-sized targets on the phone
- [x] Checked in the browser at 1280 px and 390 × 844 (touch), light and dark

## Comments

- Built as asked. The + menu opens from its left edge (`Menu` gained `icon`, `align` and `buttonClassName`). `ImportButton` became `ImportFile`, which hands its children a `pick` function for the ⋯ menu's Import….
- On the phone, the buttons are 44 px, the menus' items are taller (`large` now sizes them too, so the editor sheet's bar menu gets them as well), and the filter is 16 px so iOS doesn't zoom into it.
- Left open: the + and ⋯ menus, like every `Menu`, can't be reached with Tab (their buttons take no focus, so Space stays with the app). New, New from pattern, New folder, Import and Export all could be before.
