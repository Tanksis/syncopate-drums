# 05: Phone settings layout

**What to build:** A tidier full-screen settings panel on the phone: option S3, "section tabs", from the mockup at <https://claude.ai/artifact/MVnC3q9tkZte3cKvUQGfkZ>. Loop and Count-in are pinned at the top, under "Settings" and Done; tabs for Groove, Sticking, Mix and Theme show one section at a time, each setting's name above a full-width control. See [spec](../spec.md) 3.

**As built:** `PhoneSettings` in `SettingsSidebar.tsx`, which the desktop sidebar no longer shares a layout with. The tab resets to Groove each time settings open. Done takes the theme's own corner radius, not the mockup's pill. The groove presets stay a menu (their names are too long for the mockup's list).

**Status:** done

- [x] Tabs work by touch and with the arrow keys
- [x] Checked at 390 × 844, light and dark
