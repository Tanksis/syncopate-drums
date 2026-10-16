# 11: The Library's selection bar

**What to build:** User feedback during the prototype review. When exercises are ticked in the Library, the bar under "N selected" looks unfinished. **Export selected** and **Delete selected** become **Export** and **Delete**. **Move to…** stops being a native `<select>`, whose arrow doesn't match the app; it becomes a button styled like `SelectMenu` (label and `ChevronIcon`) that opens a `Menu` of No folder and the folders, so it looks like the app's other dropdowns.

**Blocked by:** none

**Status:** done

- [x] Export and Delete read so, keeping their tooltips (Export's says it downloads the selected exercises as one file)
- [x] Move to… opens a `Menu`, keyboard-reachable like the others, and moving works as before
- [x] Focus doesn't stay on the menu afterwards, so Space and Enter still reach the editor
- [x] Checked at 1280 with both sidebars open and in the phone's Library sheet, light and dark, Warm and Studio, with real mouse events

## Comments

- 2026-10-16: Raised by the user while reviewing `prototype/new-user-polish`: "It could just be Export and Delete. Move to arrow doesnt look good, reuse the dropdowns we end up having so its consistent."
