# 01: The dropdown title and the folding rudiment families

**What to build:** The sidebar's tab row goes. Its heading is a menu button naming the list showing ("Rudiments ▾"), opening a menu of Library, Examples and Rudiments, the open exercise's list dotted. On Examples and Rudiments a copy icon beside it does Copy to Library. The rudiment families fold like Library folders, folded by default, with a "built / total" count; which are open is a device setting. See [spec](../spec.md), stories 1-3.

**Status:** done

- [x] Heading menu replacing the tab row, desktop and phone (full-screen heading)
- [x] Copy icon on Examples and Rudiments
- [x] Folding families with counts, remembered per device (`openRudimentFamilies`)
- [x] Checked in the browser with real mouse clicks, desktop and phone

## Comments

- 2026-10-28: Done. The heading is a `Menu` passed as `SidebarHeading`'s new `title`; the copy icon is its `actions`. Device settings now drop a stored list that isn't an array.
