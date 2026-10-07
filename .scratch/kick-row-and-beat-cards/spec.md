# Spec: Beat cards, the kick row, and swing written as triplets

Status: ready-for-agent

Source: the session of 2026-10-07 that picked up the [editor-panel handoff](../notation-and-entry/spec.md). The user compared three editor layouts (branch `prototype/editor-panel`, `?variant=A|B|C`) and chose **B, beat cards**, because it "should look more musical so it's easy to follow". They then compared the jazz groove with a Groove Scribe screenshot. Decisions: [ADR 0005 Snare row and kick row](../../docs/adr/0005-snare-row-and-kick-row.md) and [ADR 0006 Swing written as triplets](../../docs/adr/0006-swing-written-as-triplets.md). Vocabulary follows [`CONTEXT.md`](../../CONTEXT.md).

## Problem Statement

The editor panel is small and hard to read. A beat box is 64×36px, so each sixteenth is about 16px wide inside a mostly empty panel. Nothing labels which position is the e, the & or the a. The grid switch is a 9px badge, and bar delete only shows on hover.

An exercise is also one rhythm on one drum. *Syncopation* lines often put the bass drum under the snare, and jazz comping splits a line between them, so I can't enter the kick on its own the way Groove Scribe lets me.

With swing on, the jazz groove reads as straight eighths. Groove Scribe writes it the way it's played, as triplets. I'd like to enter a line as the book prints it, with swing off, and then turn swing on to see it as it's played.

## Solution

The beat strip becomes **beat cards**. Each beat is a card with the beat number large in its corner, a 16ths | trip switch, the **snare row** on top, the **count labels** (1 e & a, or 1 trip let) in the middle, and the **kick row** underneath. The layout mirrors the staff: hands up, feet down. Bars are laid out one per row, each with a header showing the bar number and a visible delete. Cells are big (about 40px tall) with a ghost hit on hover. The Figures fold stays closed by default.

Every exercise now has a snare row and a kick row (ADR 0005), and the Voice setting goes. Both rows are edited the same way: by clicking, dragging and figure keys. Tab (or j / k in Normal mode) moves the cursor between rows.

With swing on, a beat of downbeat-and-& is written as a triplet with the & on "let", in both rows and in the groove (ADR 0006). With swing off, the notation is exactly as entered.

## User Stories

### Beat cards

1. As a drummer, I want each beat drawn as a card with its number large in the corner, so that I can find beat 3 of bar 2 at a glance.
2. As a drummer, I want count labels (1 e & a, or 1 trip let) under each beat's snare cells, with the beat number in bold, so that I know which cell is which part of the beat.
3. As a drummer, I want each grid position to be a cell about 40px tall, filled when it's a hit, a bar when it's held, and a faint ghost hit on hover, so that it's easy to aim at and easy to read.
4. As a drummer, I want a labelled 16ths | trip switch on each card, so that I can see and change a beat's grid without hunting for a badge. Right-clicking the card still does the same.
5. As a drummer, I want each bar to have a header with its number and a visible delete button, so that I don't have to hover to find it.
6. As a drummer, I want one bar per row with the beat cards sharing the panel's width, so that the cards are as big as the panel allows.
7. As a drummer, I want the cursor's beat card outlined, its current row marked, and loop-range and selected bars shaded as now, so that nothing I rely on is lost.
8. As a drummer, I want dragging a hold to work across cards and bars as it does in the strip today, so that the bigger layout doesn't cost me a gesture.
9. As a drummer, I want the ⌒ mark on a tied-into beat and the figure's key shown as a keycap on the card, so that I can still learn the keys.
10. As a drummer, I want the Figures panel closed by default, as now, so that the cards get the space.

### Kick row

11. As a drummer, I want a kick row under the snare row in every beat card, so that I can enter a bass drum part separately from the snare.
12. As a drummer, I want to click, drag and type figures in the kick row exactly as in the snare row, so that there's one way to edit.
13. As a drummer, I want the beat's grid shared by both rows, so that one switch sets both.
14. As a drummer, I want Tab to move the cursor between the snare and kick rows, and j / k to move down to the kick row and up to the snare row in Normal mode, so that I can do it all from the keyboard.
15. As a drummer, I want figure keys, Space, Backspace, Delete, `T` and `.` to act on the cursor's row, so that the keys do what they do now, on the row I'm in.
16. As a drummer, I want clicking a cell to move the cursor to that beat and row, so that the keys continue from where I clicked.
17. As a drummer, I want bar commands (add, duplicate, delete, copy and paste, yank and put) to carry both rows, so that a bar stays whole.
18. As a drummer, I want the kick row written in the feet part (stems down, or on the hands' stems in a bar where every kick lands with a hand hit), so that it reads like a drum-set chart.
19. As a drummer, I want sticking to label only the snare row, so that the hands I read are the hands I play.
20. As a drummer, I want both rows played back, the kick on the bass drum sound, and the exercise mute to silence both, so that I hear what I wrote.
21. As a drummer, I want a groove bass drum hit dropped where the kick row strikes at the same moment, so that one drum isn't played or written twice.
22. As a drummer, I want my existing exercises to open unchanged: a snare exercise with an empty kick row, and a bass drum exercise with its notes in the kick row. Exported files from before should import the same way, so that nothing I entered is lost.
23. As a drummer, I want the Voice setting gone, so that there's one way to put notes on the kick.
24. As a vim user, I want `.` to repeat my last keyboard change on the cursor's current row, so that repeating works in either row.

### Swing written as triplets

25. As a drummer, I want, with swing on, a beat whose only hits are the downbeat and the & written as a triplet with the & on its last position, so that the chart shows what I play, as Groove Scribe does.
26. As a drummer, I want that to apply to the jazz ride, to the snare row and to the kick row alike, so that the whole chart is consistent.
27. As a drummer, I want beats with an e or an a, beats with only a downbeat, and beats I entered on the triplet grid written as entered, so that only the swung eighths change.
28. As a drummer, I want, with swing off, the notation exactly as entered, so that I can check a line against the book.
29. As a drummer, I want the beat cards and playback unchanged by this, so that it's only how the chart reads.

## Implementation Decisions

### Exercise core (the only test seam)

- **Model.** `Bar` becomes `{ snare: Item[]; kick: Item[] }`, each row adding up to four beats. `Exercise.voice` is removed. `SCHEMA_VERSION` goes to 2. `migrate` turns a v1 exercise into v2 as ADR 0005 says: voice snare means the old items become the snare row and the kick row rests; voice bass drum means the old items become the kick row with overrides dropped, and the snare row rests. Import goes through the same migration.
- **Rows.** A `Row = 'snare' | 'kick'` type. The speller's operations (toggle grid position, set hold, enter figure, tie, cut short, rest) take the row they act on. Setting a beat's grid rewrites the beat in both rows: a downbeat hit is kept in each row, others cleared, holds back to their defaults (the existing rule, applied per row). The pending grid stays per beat.
- **Beat view.** `editorBeatViews` returns, per beat, the shared `triplet` flag and one row view per row (`positions`, `figure`, `hits`, `tiedInto`, `cutShort`).
- **Editor.** The cursor gains a `row`. A new command switches rows (Tab; j / k in Normal mode). Grid commands carry `row` in their `GridPoint`. Keyboard edits act on `cursor.row`. Bar commands copy both rows. The `.` repeat replays on the current row.
- **Sticking.** Computed from the snare row only. Overrides live on snare notes.
- **Staff parts.** The snare row's notes go in the hands part, and the kick row's in the feet part. The ADR 0004 voicing per bar is unchanged and now asks whether every kick-row or groove foot hit lands with a hand hit. The exercise-note flags and ids apply to both rows' notes (sticking is still snare only).
- **Swing notation (ADR 0006).** Staff parts take whether swing is on. When it is, before chords are built, each sixteenth-grid beat (per row, and the groove) whose hits are only on the downbeat and the & is respelled on the triplet grid: the & goes to the last triplet position, and holds are mapped to the nearest triplet position. Hits from different sources that land on the same triplet position form one chord. A beat in which any source has an e or an a stays on the sixteenth grid for every source, so a chord never mixes grids.
- **Schedule.** Plays both rows (snare and kick instruments). The bass drum de-duplication compares groove bass drum hits with the kick row. Swing timing is unchanged.

### UI

- **Beat cards** replace `BeatStrip`'s boxes, built from variant B of the prototype. Hit-testing for drags stays `pointUnder` over `[data-beat-box]` / `[data-position]`, now scoped to the row that was pressed. All controls use `keepFocus`.
- **Settings.** The Exercise › Voice control is removed.
- **Cheat sheet.** Lists Tab and j / k.

### Build order

1. Beat cards for the snare row (UI only, no model change).
2. Kick row: model, migration, editing by mouse, notation and playback.
3. Kick row from the keyboard: the cursor's row, Tab and j / k.
4. Swing written as triplets. It's independent of 1–3 but easiest after 2.

## Testing Decisions

- **One seam: the exercise core's public interface**, as before. A good test puts a *Syncopation*-style example in and checks a musical fact out. Examples:
  - "a v1 bass drum exercise migrates to a v2 exercise with its notes in the kick row and a resting snare row";
  - "click the & of beat 1 in the kick row: the snare row is unchanged, and the kick row reads `..x.`";
  - "switch a beat to triplets with `x.xx` on the snare and `x.x.` on the kick: both read `x..`";
  - "Tab then figure key 2: the kick row's beat is two eighths";
  - "snare quarters with a kick on the & of 2 and swing off: the kick is in a feet part, stems down, on tick 18";
  - "jazz groove with swing on: beat 2's ride is a triplet group, ride on the downbeat and the let, rest in the middle";
  - "swing on, a snare beat `x.xx`: written as sixteenths, and the ride in that beat stays on the sixteenth grid";
  - "a kick on beat 1 with the feathered preset: one bass drum event".
- **Modules covered:** migrate, speller (row-aware operations), editor (cursor row, row switch, keys per row, bar commands, `.`), staff parts (kick row, swing respelling), schedule (two rows, de-duplication), sticking (snare row only).
- **Not tested automatically:** the beat cards' layout and pointer handling (checked in the browser with real mouse clicks and drags, per the memory note) and the VexFlow drawing.

## Out of Scope

- Rows for the ride, hi-hat, hi-hat foot or toms. The groove layer stays a preset (the user's "later feature").
- Separate grids per row within a beat.
- Accents, even though the Groove Scribe screenshot shows them.
- Automatic splitting of a line between snare and kick (interpretation rules). Rows are entered as written.
- A resizable panel or a size toggle. Revisit only if the cards are too small in use.
- Swing written any other way (marking, swung noteheads, timing lane).

## Further Notes

- The prototype stays on `prototype/editor-panel` as a primary source, not on `main`.
- "Swing on" means a swing amount above 50%. The user framed it as "with a jazz groove on", but tying it to swing keeps one rule: the swing-off button already gives the book view.
