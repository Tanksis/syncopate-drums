# 01: Rule-style settings group headings

**What to build:** Every settings group gets the "Rule" heading from the prototype verdict (`bb5d7e8`): a hairline above the group and a 13 px heading in the ink colour. The first group of a section has no hairline. This covers the desktop's Practice groups (Playback, Groove, Sticking), General's groups (Mix, Metronome, Appearance) and the Metronome's sidebar groups (Time signature, Subdivision). Section labels such as EXERCISES keep `PanelHeading`. See [spec](../spec.md), Implementation Decisions › App › Group headings, and story 16.

**Blocked by:** none

**Status:** done

- [x] One shared group component (or a `GroupHeading`) is used by `SettingGroup` and the Metronome's compact `TimeSignature` / `SubdivisionGrid`
- [x] A hairline above each group, none on a section's first group
- [x] The headings follow both themes' heading caps and case
- [x] Checked at 1280 and 1440, light and dark, Warm and Studio, on both screens

## Comments

- 2026-10-16: Built as one `SettingGroup` in `src/components/SettingGroup.tsx`. The hairline drops through `first-of-type`, so whichever group comes first in a section (Playback when it shows, otherwise Groove; Time signature; Mix) goes without one. The heading's gap follows the prototype (`gap-2`, `mb-1`). Checked headless at 1280 and 1440 in Warm and Studio, light and dark, on both screens.
