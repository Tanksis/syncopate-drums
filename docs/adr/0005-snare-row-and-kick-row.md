# 5. An exercise has a snare row and a kick row

Date: 2026-10-07

Status: accepted (replaces the exercise **voice**; reverses "multi-voice exercises" being out of scope in the [notation-and-entry spec](../../.scratch/notation-and-entry/spec.md))

Until now an exercise was one rhythm on one drum, the **voice** (snare or bass drum). *Syncopation* also prints lines where the bass drum has its own part under the snare, and jazz comping splits a line between the two. The user wants to enter the kick separately from the snare, as Groove Scribe does with one row per drum. They compared three editor layouts (branch `prototype/editor-panel`) and picked the beat cards: each beat a card with the snare row on top and the kick row below, the way the staff writes them.

So every exercise has two rows over the same bars:

- **Snare row**, played with the hands and written in the hands part. Sticking and sticking overrides belong to this row only.
- **Kick row**, played with the feet and written in the feet part, under ADR 0002 and ADR 0004 (one voice in a bar where every kick lands with a hand hit).

Each row is edited the same way: click grid positions, drag holds, figure keys. A beat's grid (sixteenths or triplets) is **shared by both rows**: there's one grid switch per beat card, and switching it applies to both rows. Snare sixteenths against kick triplets in one beat can't be entered. The user chose this as the simpler option.

## Consequences

- **Stored shape changes.** A bar holds snare items and kick items, each a full four beats. `SCHEMA_VERSION` goes to 2. On load and import, a v1 exercise with voice snare gets an empty (resting) kick row, and one with voice bass drum moves its notes into the kick row and gets an empty snare row. Its sticking overrides are dropped, since the kick has no sticking.
- **The Voice setting goes.** The Exercise › Voice control is removed. `VOICE_LIMB` and `VOICE_INSTRUMENT` become the fixed mapping snare → hands → snare sound, kick → feet → kick sound.
- **The editor cursor has a row.** Figure keys, Space, Backspace, Delete, `T` and `.` act on the cursor's row. Bar commands (add, duplicate, delete, copy, paste, yank, put) carry both rows.
- **A beat figure is per row.** A beat card can show a figure for each row.
- **Playback** plays both rows. The exercise mute silences both. A groove bass drum hit is dropped where the kick row strikes at the same tick (the existing rule, now about the kick row).
- Rows for other drums (ride, hi-hat, toms) aren't part of this. The groove layer stays a preset.
