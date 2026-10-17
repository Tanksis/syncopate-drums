# 10. The hi-hat foot is a practice setting, not a row

Date: 2026-10-12

Status: accepted, superseded in part (2026-10-17): groove presets became **patterns**, which have no hi-hat foot of their own, so the setting no longer replaces anything. The jazz presets became Ride with the setting on 2 & 4, and the feathered one also the **bass drum** setting, feathered (schema 6). See the [time-signatures spec](../../.scratch/time-signatures/spec.md).

The user wants the hi-hat foot keeping time (on 1, on quarters) while practising kick fills, and with any exercise. Today the hi-hat foot only plays inside the jazz groove presets, and only one preset is on at a time. Two ways were considered:

- **A hi-hat foot row** in the grid editor under the kick row, placed note by note, with `H` in sticking patterns. This is the "ride/hi-hat rows" idea [ADR 0005](0005-snare-row-and-kick-row.md) left for later. It needs a schema change to the bars, a third row on every beat card (cramped on the phone) and more voices in the feet part.
- **A practice setting**: an ostinato, the same in every bar, picked from Off / On 1 / Quarters / 2 & 4 / &s, and layered with any groove.

The practice setting was chosen. Keeping time is an ostinato by nature, and it covers what the user practises. It also works on every existing exercise without re-entering anything.

## Consequences

- `hihatFoot` joins the practice settings: per exercise, exported, and changeable but not kept on examples. The schema version goes up, and stored exercises migrate to `'off'`.
- When the setting isn't off, it replaces the groove's own hi-hat foot (the jazz presets' 2 & 4), so the foot never plays two patterns at once. With it off, the groove plays as before.
- It plays at the groove volume, and it is written in the feet part by the rules of [ADR 0004](0004-one-voice-when-feet-play-with-hands.md).
- A hi-hat foot row stays possible later if an ostinato proves too limiting. It would sit beside this setting or replace it.
