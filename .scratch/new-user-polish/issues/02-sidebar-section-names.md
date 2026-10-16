# 02: Practice settings / Metronome settings over a folding General

**What to build:** The desktop settings sidebar keeps its split, renamed as the prototype verdict says. The top reads **Practice settings** or **Metronome settings**, and its chevron collapses it to the rail, which still reads **Settings**. The pinned bottom section's heading becomes **General**, and it still folds. See [spec](../spec.md), Implementation Decisions › App › Sidebar names, and story 17.

**Blocked by:** 01

**Status:** done

- [x] The top heading names the screen's settings, and the rail says Settings
- [x] The bottom section is General; its fold button's label and title follow ("Fold General" / "Open General")
- [x] `CONTEXT.md`'s Device settings / Mix entries still read right (they say "Mix section of Settings"; make it General)
- [x] Checked at 1280 with both sidebars open, and collapsed

## Comments

- The bottom section's component is renamed `SharedSettings` → `GeneralSettings`, to match `PracticeSettings`. The stored `settingsSectionOpen` flag keeps its name so saved device settings still load.
- `CONTEXT.md`'s Mix entry now says the Mix is set in General's Mix group. ADR 0014's "Settings section" wording is left as history.
- Checked at 1280 with headless Chromium: the top reads Practice settings / Metronome settings, General folds with "Fold General" / "Open General", and the collapsed rail reads Settings.
