# Spec: Syncopate! v1

Status: ready-for-agent

Source: the wayfinder [map](map.md) and its tickets 01–14 in [issues/](issues/). Vocabulary follows [`CONTEXT.md`](../../CONTEXT.md).

## Problem Statement

I practise drums from method books such as Ted Reed's *Syncopation* on a laptop with an e-drum kit and headphones. Working through a line, I keep needing things the printed page can't give me. I want to hear the line played correctly against a metronome at whatever tempo I'm working at. I want to see the sticking written under the notes (natural or alternate, led by either hand). I want a jazz groove under the line, and I want to loop one or two hard bars. Today that means a separate metronome app, pencilled sticking, and playing the groove myself before I can play the line on top. Nothing lets me type a line in quickly, keep it, and come back to it tomorrow with my tempo and loop where I left them.

## Solution

Syncopate! is a laptop-first web app (an installable, offline PWA hosted on GitHub Pages) for entering, viewing and practising rhythm exercises.

I enter an exercise one beat at a time in the **grid editor** by picking a **beat figure** from a keyboard-shaped palette. Four keystrokes make a bar. The app spells the notes, rests, dots and ties for me, and the **notation view** redraws the line on a drum staff as I type, four bars per line like the book. Under each note it prints the **sticking** (natural, alternate, or off, from a chosen **lead hand**), and I can flip any single note's hand with a **sticking override**. I can pick a **groove preset** that draws and plays a ride/hi-hat/bass-drum **groove layer** above the line. **Swing feel** applies to both the line and the groove, and gets straighter as the tempo rises.

Pressing Ctrl+Space plays a one-bar **count-in** and then the exercise, with the **click** on every quarter note. The current note is highlighted and the view scrolls with it. Playback loops the whole exercise or a **loop range** I pick by clicking bar numbers. BPM, loop range, groove preset and swing amount are remembered per exercise. Every change autosaves to a local **exercise library**, which I can filter, and export to or import from JSON files to move exercises between computers.

## User Stories

### Launching and the exercise library

1. As a drummer, I want the app to open at a fixed URL in my laptop browser, so that I don't have to run anything locally.
2. As a drummer, I want to install the app as a PWA that works offline with its drum samples cached, so that practice doesn't depend on a network connection.
3. As a drummer, I want the app to open the exercise I last had open, so that I can carry on practising straight away.
4. As a first-time user with an empty library, I want the app to open a new Untitled exercise immediately, so that I can start entering a line without any setup.
5. As a drummer, I want to see all my saved exercises in a sidebar that's always visible, so that I can switch between lines quickly.
6. As a drummer, I want the library sorted by when I last opened each exercise, so that the lines I'm working on are near the top.
7. As a drummer, I want the library order to stay put while the app is open (it updates at the next launch), so that items don't jump around as I click through them.
8. As a drummer, I want exercises I create during a session to appear at the top of the list, so that I can find what I just made.
9. As a drummer, I want to filter the list by typing any part of a name, so that I can find "p.37 #4" in a long library.
10. As a drummer, I want to give an exercise any free-text name, including one that another exercise already uses, so that I can name lines the way the book does without the app objecting.
11. As a drummer, I want to rename an exercise inline from the header or by double-clicking its name in the list, so that renaming is quick.
12. As a drummer, I want a New button that creates an "Untitled" exercise with one bar of rests, snare voice, natural sticking, lead R, 80 BPM, groove off and swing 66.7%, so that every new line starts from the same known state.
13. As a drummer, I want a new exercise that I never changed to be discarded when I leave it, so that the library doesn't fill up with empty Untitled entries.
14. As a drummer, I want to duplicate an exercise, with its content and practice settings, as "<name> (copy)", so that I can make a variation without losing the original.
15. As a drummer, I want every change (notes, sticking, settings, name) saved automatically, so that I never lose work or have to remember to save.
16. As a drummer, I want to tick checkboxes next to exercises to select several, so that I can export or delete them together.
17. As a drummer, I want to delete one exercise or the current selection behind one confirm dialog that shows the count and warns it can't be undone, so that I don't delete things by accident.
18. As a drummer, I want deleting the open exercise to open the next most recent one (or a new Untitled one if none remain), so that the screen is never empty.

### Export and import

19. As a drummer, I want to export the selected exercises to a JSON file, so that I can back them up or move them to another computer.
20. As a drummer, I want a one-click "Export all", so that backing up the whole library is quick.
21. As a drummer, I want a single exported exercise to be named after the exercise (with characters that aren't allowed in file names removed), and a multi-exercise export named `drum-exercises-YYYY-MM-DD.json`, so that files are easy to recognise.
22. As a drummer, I want exports to include each exercise's practice settings (BPM, loop range, groove, swing), so that an imported line is ready to practise as I left it.
23. As a drummer, I want device-level settings (volumes, count-in, vim keys) left out of exports, so that importing doesn't change how my other computer is set up.
24. As a drummer, I want to import a JSON file that holds one or many exercises, so that one import action covers every case.
25. As a drummer, I want the app to recognise exercises it has seen before by their id, and when some already exist, to ask me once (showing the count) whether to Replace, Keep both, or Skip them all, so that re-importing a backup is predictable.
26. As a drummer, I want "Keep both" to give the imported copy a new id and keep its name, so that both versions stay in the library.
27. As a drummer, I want no prompt when nothing conflicts, so that a plain import is one step.
28. As a drummer, I want import never to delete anything, so that importing can't lose work.
29. As a drummer, I want files from older app versions to be migrated on import, so that old backups keep working.
30. As a drummer, I want a file from a newer app version, a malformed file, or a file that isn't a Syncopate! export to be refused whole with a clear message, so that a bad file never half-imports.

### Entering an exercise (grid editor)

31. As a drummer, I want to enter a bar by picking one beat figure per beat, with the cursor moving to the next beat by itself, so that a bar takes four keystrokes.
32. As a drummer, I want the palette to hold all 22 possible one-beat figures (16 sixteenth-grid patterns plus the 6 triplet patterns a sixteenth grid can't write), so that I can never meet a beat I can't enter.
33. As a drummer, I want the most-used straight figures on the number row (1–0), triplets on the home row (A–H), rarer straight figures on the bottom row (Z–B), and Space for a rest beat, so that my fingers learn where each figure is.
34. As a drummer, I want the on-screen palette laid out like the keyboard with each tile showing its key, so that I can learn the keys by looking.
35. As a mouse user, I want clicking a palette tile to enter that figure and advance, so that I can enter a line without the keyboard.
36. As a drummer, I want the current beat's figure highlighted on its palette tile, so that I can see what's already there.
37. As a drummer, I want T to toggle a tie into the current beat (allowed only when the beat starts with a hit and the previous beat ends with a note), so that I can enter quarters, dotted quarters, syncopated quarters and notes held across a bar line.
38. As a drummer, I want a ⌒ on the beat box and a drawn tie in the notation when a beat is tied into, so that I can see the tie.
39. As a drummer, I want typing a new figure to keep the tie if the new figure starts with a hit, so that re-entering a beat doesn't undo the tie.
40. As a drummer, I want `.` to toggle "cut short" on the current beat, ending its last note early with a rest after it, so that I can enter staccato-style figures such as an eighth then an eighth rest.
41. As a drummer, I want typing a new figure to clear "cut short", so that a fresh figure starts clean.
42. As a drummer, I want entering a figure past the last beat to add a bar, so that I can keep typing a long line without stopping.
43. As a drummer, I want the app to spell every beat for me (notes, rests, dots, ties), so that the notation is readable without my having to think about notation rules.
44. As a drummer, I want the notation view to redraw on every edit, with the cursor beat's notes highlighted and the current bar shaded, so that I can check the line against the book as I go.
45. As a drummer, I want ←/→ to move by beat, ↑/↓ or Ctrl+←/→ to move by bar, and Home/End to jump, so that I can get around the line from the keyboard.
46. As a drummer, I want Backspace to turn the beat into a rest and step back, and Delete to turn it into a rest without moving, so that I can fix mistakes quickly.
47. As a drummer, I want Ctrl+Enter to add a bar after the current one, Ctrl+D to duplicate it, and Ctrl+Backspace (or a ✕ that appears on hover in the beat strip) to delete it, so that I can reshape a line.
48. As a drummer, I want Shift+←/→ to select bars and Ctrl+C/Ctrl+V to copy and paste them (paste replaces from the current bar on), so that I can reuse repeated bars.
49. As a drummer, I want Ctrl+Z and Ctrl+Shift+Z to undo and redo every change, including sticking flips, so that I can experiment safely.
50. As a drummer, I want clicking a beat box or a note in the notation to move the cursor there, so that I can jump straight to the beat I want to fix.
51. As a vim user, I want the editor to be modal (it opens in Insert mode, Esc goes to Normal mode, `i`/`a` return to Insert), so that I can edit with vim commands.
52. As a vim user, I want Normal mode to treat a beat like a character and a bar like a word (`h`/`l`, `w`/`b`, `0`/`$`, `gg`/`G`, `x`, `dd`, `yy`, `p`/`P`, `o`/`O`, `V` with `y`/`d`/`p`, `u`/Ctrl+R, `.` repeat, counts such as `3p` and `2dd`, and `r` + a figure key to replace one beat), so that my vim habits carry over.
53. As a vim user, I want a `-- INSERT --` / `-- NORMAL --` indicator next to the editor, so that I always know which mode I'm in.
54. As a drummer who doesn't use vim, I want to turn vim keys off in settings (no Normal mode, Esc does nothing, no mode indicator), so that I can't land in a mode I don't understand.
55. As a drummer, I want the keys that work in both modes (arrows, Backspace, Delete, Ctrl shortcuts) to keep working with vim keys off, so that I lose nothing by turning vim off.
56. As a drummer, I want `?` to toggle a cheat sheet of the keys for the current mode, so that I can look up a key without leaving the app.
57. As a drummer, I want clicking anything never to change the editor mode, so that the mouse and keyboard don't fight.

### Notation view

58. As a drummer, I want the exercise drawn on a standard drum staff (percussion clef, 4/4), with snare or bass drum noteheads stems down, so that it reads like the book.
59. As a drummer, I want quarters, eighths, sixteenths, eighth-note triplets, rests, ties and dotted notes drawn with beaming that is correct for drum reading, so that the line is easy to sight-read.
60. As a drummer, I want four bars per line, like the book, falling back to fewer on a narrow window, with a short last line keeping the same bar width (left aligned), so that the layout matches the page I'm reading from.
61. As a drummer, I want bar numbers above each bar, so that I can refer to bars and pick a loop range.
62. As a drummer, I want the notation view to take the free height and scroll, so that long lines fit.

### Sticking

63. As a drummer, I want R or L printed under each note, so that I know which hand plays it.
64. As a drummer, I want natural sticking, where each hand is tied to a grid position (chosen per beat from its finest subdivision): straight beats start on the lead hand, and a run of back-to-back triplet beats alternates continuously, also across bar lines, so that my hands keep moving through rests the way teachers show it.
65. As a drummer, I want alternate sticking, which strictly alternates over the notes actually played (skipping rests and tied continuations) and carries on across bar lines, so that I can practise hand-to-hand reading.
66. As a drummer, I want a sticking mode "off" that prints no hands, so that lines where the other hand plays the groove aren't cluttered.
67. As a drummer, I want to choose the lead hand (R or L), so that I can practise each line leading with either hand.
68. As a drummer, I want tied continuations to get no hand (though they still use up their grid position under natural sticking), so that only struck notes are labelled.
69. As a drummer, I want clicking an R/L under a note to set the opposite hand as an override, and clicking again to clear it, so that I can match a sticking printed in the book.
70. As a keyboard user, I want Alt+1–4 to flip the 1st–4th struck note of the cursor beat (rests and tied continuations not counted), in any mode, so that I can set overrides without the mouse.
71. As a drummer, I want overrides printed in an accent colour, with a hover hint "override, click to reset", so that I can tell them from computed sticking.
72. As a drummer, I want an override to change only its own note, leaving the computed sticking of the others where it was, so that one fix doesn't ripple through the line.
73. As a drummer, I want overrides to survive edits to the notes around them, survive a duration change on their own note, and be dropped only when their note is deleted or turned into a rest, so that my fixes stay put while I edit.
74. As a drummer, I want overrides kept when I switch sticking mode, and hidden but kept when sticking is off or the voice is bass drum (clicks do nothing then), so that switching back restores them.
75. As a drummer, I want a "Reset overrides (n)" button, disabled at zero, that clears them all in one undoable step, so that I can start the sticking over.
76. As a drummer, I want sticking computed once over the whole exercise and always played as printed, even on loop repeats and in a narrowed loop range, so that what I read is what I'm drilled on.

### Voice

77. As a drummer, I want to switch an exercise's voice between snare (default) and bass drum, so that I can practise *Syncopation* lines with my foot.
78. As a drummer, I want sticking hidden but kept under the bass drum voice, so that switching back to snare brings it back.

### Groove layer and swing

79. As a drummer, I want to pick a groove preset (off; jazz ride + hi-hat on 2 & 4; the same plus feathered bass drum on all 4; straight eighths on hi-hat), so that I can practise the line in a musical context.
80. As a drummer, I want the groove layer drawn on the same staff above the exercise (stems up, x noteheads, hi-hat foot below the staff), so that I can read the full picture as a drum chart.
81. As a drummer, I want the groove layer played with the exercise and loud enough to sit level with the snare by default, so that it's useful without adjusting volumes first.
82. As a drummer, I want one swing amount, a slider from 50% (straight) to 75%, applied to both the exercise and the groove layer, so that everything swings together.
83. As a drummer, I want preset buttons for light 58%, medium 62%, triplet 66.7% (the default) and dotted 75%, so that I can jump to common feels.
84. As a drummer, I want swing to ease toward straight as the tempo rises (full amount up to 120 BPM, straight by 320 BPM), so that fast tempos feel natural, as real players do.
85. As a drummer, I want notated triplets never moved by swing, and sixteenths swung in proportion (the "e" halfway through the long eighth, the "a" halfway through the short one), so that written triplets and sixteenth figures sound right under swing.

### Playback and metronome

86. As a drummer, I want Ctrl+Space (in any editor mode) and a play button to start and stop playback, so that I can start without leaving the keyboard. Plain Space is taken by the rest beat.
87. As a drummer, I want an optional one-bar count-in of clicks before playback starts (not repeated on each loop), so that I can come in on beat 1.
88. As a drummer, I want a click on every quarter note with beat 1 accented, so that I always know where the bar starts.
89. As a drummer, I want to set the BPM from 30 to 300 with a number box and a slider, so that I can work a line up gradually.
90. As a drummer, I want a BPM change while playing to take effect almost at once without stopping, so that I can nudge the tempo while I play.
91. As a drummer, I want playback to loop the whole exercise by default, so that I can play it over and over.
92. As a drummer, I want to click a bar number to loop just that bar, Shift+click another to extend the loop range, and an "all" reset, so that I can drill the hard bars.
93. As a drummer, I want the loop range shaded in the beat strip and shown in the header, so that I can see what will repeat.
94. As a drummer, I want a loop-range change while playing to apply at the next wrap (or right away if the playhead is already past the new end), so that I can narrow the loop without stopping.
95. As a drummer, I want the playback position (count-in, bar · beat) shown in the header, so that I know where I am.
96. As a drummer, I want the currently sounding note highlighted in the notation, in time with what I hear, so that I can follow along by eye.
97. As a drummer, I want the notation view to scroll to keep the current line in view during playback, so that long exercises can be followed hands-free.
98. As a drummer, I want separate volumes for click, exercise and groove layer, plus a mute for the exercise, so that I can play the line myself over just the click and groove.
99. As a drummer, I want realistic built-in drum samples (snare, bass drum, ride, ride bell, hi-hat closed and foot) and a synthesized click, so that the playback sounds like a kit.
100. As a drummer, I want playback to stay sample-accurate in time on my Windows laptop with wired headphones, so that I can trust it as a metronome.

### Per-exercise and device settings

101. As a drummer, I want BPM, loop range, groove preset and swing amount remembered per exercise, so that each line comes back exactly how I last practised it.
102. As a drummer, I want click, exercise and groove volumes, the count-in toggle and the vim-keys setting kept per device, not per exercise, so that I set them once.
103. As a drummer, I want all settings visible in a right sidebar grouped as Groove, Sticking, Exercise, Editor and Volume, so that nothing hides in menus.

## Implementation Decisions

### Stack and hosting

- TypeScript, Vite, single-page app. React for UI, Zustand for app state, so the scheduler and the highlight loop can read state outside React (`getState`, `subscribe`).
- VexFlow 5 (MIT) draws the notation directly from the exercise model through a render adapter. No MusicXML or text format sits in between. We do line wrapping ourselves (4 bars per line, fewer on narrow windows, fixed bar width on a short last line).
- Our own Web Audio lookahead scheduler: a Worker timer every ~25 ms schedules `AudioBufferSourceNode.start(when)` for events in the next ~100 ms. Tone.js is the fallback only if this grows.
- Samples: Virtuosity Drums (CC0) for snare, kick (including feathered), ride, ride bell, hi-hat closed and pedal. The click is synthesized.
- Storage: IndexedDB via `idb`, behind a small repository interface. Call `navigator.storage.persist()`. Each stored exercise carries a schema version.
- PWA via `vite-plugin-pwa`, with samples precached. Hosted on GitHub Pages at `https://tanksis.github.io/syncopate-drums/`, so Vite `base` and the service-worker scope are `/syncopate-drums/`. A GitHub Actions workflow deploys every push to `main` after the Vitest suite passes; a failing test blocks the deploy.
- All dependencies are MIT, ISC (`idb`; equivalent to MIT) or CC0, so nothing blocks a possible later public app. No accounts and no sync.

### Modules

**1. Exercise core (pure, deep: the single test seam).** No React, DOM, Web Audio or IndexedDB imports. It owns every rule in this spec that can be stated without I/O, behind a small public interface:

- *Model types.* An `Exercise` has: id (UUID), name, schema version, bars, voice (`snare` | `bass`), sticking mode (`natural` | `alternate` | `off`), lead hand (`R` | `L`), and practice settings (BPM 30–300, loop range or none, groove preset id or off, swing amount 50–75). It also keeps last-opened and the bookkeeping the library and discard rules need. A bar is an ordered list of items. Each item is a note or a rest with a duration (quarter / eighth / sixteenth), an optional dot, triplet-group membership, a "tied to next" flag and, on notes, an optional sticking override. A bar adds up to 4 beats. A triplet group fills exactly one beat (3 triplet-eighth slots) and may hold triplet eighths, triplet quarters (2 slots), rests, and ties in or out. Quarter-note triplets that span two beats are not representable. Ticks are derived at 12 per beat; they're not stored.
- *Ties.* A tied continuation is not a note: it isn't struck and gets no hand. A tie may cross a bar line. A rest can't be tied, and the exercise's last note can't be tied forward.
- *Beat view ↔ bars (auto-speller).* The core derives, for each beat, the editor's view: figure (one of 22, or rest), tied-into flag, cut-short flag. It also writes a beat's figure/tie/cut back into symbolic bars by re-spelling. Spelling is always automatic. The prototype rules are the starting point: prefer the longest legal value at each position, split notes at bar lines and at triplet-beat edges, and merge holds into dotted values where legal, so that `q~e` is written as `q.`. The rules may be tuned. Sticking overrides ride on the note's start position through a re-spell. "Cut short" ends the beat's last note at an eighth if it starts on 1 or & of a straight beat, at a sixteenth otherwise, and at one triplet eighth in a triplet beat, with a rest after it.
- *The 22 figures and their keys* (from the [Beat figure palette](issues/07-beat-figure-palette.md) ticket; `x` = hit, `.` = no hit; each hit holds until the next hit or the end of the beat):

  ```
  1 x...  2 x.x.  3 ..x.  4 xxxx  5 x.xx  6 xxx.  7 x..x  8 xx.x  9 .xxx  0 ..xx
  A xxx   S x.x   D xx.   F .xx   G .x.   H ..x
  Z .x..  X ...x  C .xx.  V .x.x  B xx..
  Space = rest beat (....)   T = tie into beat   . = cut short   ? = legend
  ```
- *Editor commands.* `applyEdit(state, command) → state` is a pure reducer over {exercise, cursor (bar, beat), selection, mode, clipboard, undo/redo history, last-change for `.` repeat}. Commands cover everything in the Grid editor stories: enter figure (and advance, growing the exercise past the last beat), tie toggle, cut toggle, rest-and-back, rest-in-place, moves, bar add/duplicate/delete/copy/paste/select, the Normal-mode vim commands with counts, mode switches, override flip on note *n* of the cursor beat, reset overrides, and undo/redo. Each sticking flip and each reset is one undo step. The key → command mapping, including the vim-keys-off variant where Normal mode is unreachable, is a pure function in the core, so key handling in the UI stays a thin dispatcher.
- *Sticking.* `sticking(exercise) → hand per struck note` (computed hand, override if any, and the shown hand). It's computed once over the whole exercise from bar 1 and doesn't depend on the loop range or the pass. Natural sticking uses a per-beat grid (that beat's finest subdivision). Straight beats start on the lead hand; a run of back-to-back triplet beats alternates continuously from the lead hand, also across bar lines; a note after a rest takes its grid position's hand; a tied continuation uses up its position but gets no hand. Alternate sticking starts on the lead hand and alternates over struck notes across bar lines. Under mode off or the bass drum voice, no hands are shown and overrides are kept. Worked examples (lead R): `3♪♪♪ | ♪♪ | 3♪♪♪ | 3♪♪♪` → `RLR | RL | RLR | LRL`; dotted eighth + sixteenth → `R . . L`; triplet ♩♪ → `R . R`; 7 notes under alternate → `RLRLRLR`, with a double at the loop seam.
- *Schedule.* `schedule(exercise, practice settings, device settings, from position, window) → events` returns `{time offset, kind: click | exercise | groove, instrument, accent, noteId?}` for the window. It covers the count-in (one bar of clicks at negative bar indices, only on start), the click on every quarter with beat 1 accented, exercise notes on the exercise's voice (tied continuations not struck), groove-preset hits for each played bar, and the loop range with wraparound. Musical position (bar, tick) is the source of truth, converted to seconds from the last scheduled event, so a BPM change affects only events not yet scheduled. A loop-range change applies at the next wrap, or at once if the playhead is past the new end. Swing is applied here with this logic (trimmed from the [playback prototype](prototypes/04-swing-groove-playback/index.html)):

  ```ts
  // effective first-eighth share of the beat; 0.5 = straight
  effectiveSwing(amount, bpm) =
    0.5 + (amount - 0.5) * clamp((320 - bpm) / (320 - 120), 0, 1)
  // piecewise-linear warp of a binary-grid position x in [0,1) within the beat
  warp(x, r) = x < 0.5 ? x * (r / 0.5) : r + (x - 0.5) * ((1 - r) / 0.5)
  // binary-grid notes (exercise and groove) are warped; triplet-grid notes never are
  ```
  The breakpoints (120, 320) may be tuned.
- *Groove presets.* Data in the core: id, display name, and per-bar hits (tick, instrument, notation position/notehead). Four options: off; "Jazz ride + hi-hat 2 & 4" (ride pattern with hi-hat foot on 2 and 4); the same plus feathered bass drum on all 4; "Straight eighths on hi-hat".
- *Library rules.* The new-exercise factory (fixed defaults: one bar of rests, "Untitled", snare, natural, lead R, 80 BPM, groove off, swing 66.7%), `isUnchangedNew`, duplicate ("<name> (copy)", new id, content + practice settings copied), name filter (case-insensitive substring), session list order (last opened as of launch, frozen while open, new exercises on top), and which exercise to open after a delete or at launch.
- *Export/import.* Export file shape: `{ format: "drum-app-exercises", version, exercises: [...] }`, where each exercise is the stored shape and `version` tracks the schema version. The file names follow the export stories. `parseImport(json, appVersion)` validates the format marker and shape and migrates older versions through the *same* migration chain as the database. It refuses newer versions and malformed files whole, with a reason. `planImport(incoming, existingIds, choice)` resolves conflicts by id only, applying Replace / Keep both (new id, same name) / Skip to all conflicts. Nothing is ever deleted.

**2. Persistence.** An `ExerciseRepository` over `idb` (list, get, put, delete many, put many) plus a small device-settings store (volumes, exercise mute, count-in, vim keys, last-opened id). It opens the database through the core's migration chain. Autosave writes the open exercise on every committed change; the store debounces slider drags.

**3. App store (Zustand).** Holds the library index, the open exercise and editor state (driven through the core's `applyEdit`), device settings, and transport state (playing, position, count-in). It is the only place that calls the repository.

**4. Playback engine.** A thin Web Audio layer: AudioContext, decoded sample buffers, three GainNodes (click / exercise / groove) into a master gain, with the groove gain's default raised so it sits level with the snare. The Worker-driven tick calls the core's `schedule` for each lookahead window and keeps references to started sources so stop and loop changes can cancel them. It publishes a (time → noteId, position) timeline for the highlight.

**5. Notation renderer.** An adapter from exercise + sticking + groove preset + layout width to VexFlow SVG. It covers the percussion clef; two voices with forced stems (groove up with x noteheads and hi-hat foot below the staff, exercise down); beam groups by beat; tuplets, ties and dots; R/L `Annotation`s below with the override accent colour; bar numbers above; and the cursor-beat highlight and current-bar shading. It keeps a noteId → SVG element map. A rAF loop outside React styles the sounding note from `getOutputTimestamp()` against the playback timeline, and scrolls the current line into view.

**6. UI (React).** Layout A, "Workstation", in three columns:
- *Left:* library sidebar with filter, New / Duplicate / Import / Export selected / Export all / Delete selected, and the checkbox list (double-click to rename).
- *Center:* the header (inline name, play/stop, position, BPM number + slider, count-in toggle, loop readout with "all"); the scrolling notation view with clickable bar numbers (click = loop that bar, Shift+click = extend); and the editor panel (mode indicator, `?` legend, beat strip with cursor, loop shading, tie marks and hover ✕, keyboard-shaped palette).
- *Right:* settings sidebar: Groove (preset, swing slider + four preset buttons), Sticking (mode, lead hand, Reset overrides (n)), Exercise (voice), Editor (vim keys), Volume (click, exercise + mute, groove).

Ctrl+Space toggles playback in every mode. Confirm dialogs cover delete and the import conflict choice. How the palette tiles are drawn and how the height is split between notation and editor panel are left to implementation polish.

### Behaviour notes that cut across modules

- Overrides are set only from the notation view (click) and with Alt+1–4 on the cursor beat. The beat strip shows no sticking.
- Changing a setting counts as a change for autosave and for the "discard an unchanged new exercise" rule. So does a sticking flip.
- IndexedDB is per origin: localhost and the hosted URL keep separate libraries. Export/import is the only way to move exercises.

## Testing Decisions

- **One seam: the exercise core's public interface.** Tests import only the core and assert on what it returns for given inputs: spelled bars, beat views, sticking per note, scheduled event lists with times, editor state after a command sequence, and import parse/plan results. They don't reach into helper functions or internal representations, so the speller or scheduler internals can be rewritten without touching tests.
- **What a good test looks like here:** a *Syncopation*-style example in, an observable musical fact out. Examples: "these four figures with a tie into beat 3 spell as `♩ ♪ ♩. ♪`", "this line under natural sticking, lead L, reads `L R L | …`", "at 180 BPM with 66.7% swing the & of 1 lands at 0.62 of the beat and a triplet stays at 2/3", "`2dd` then `u` restores both bars", "an override survives re-entering the neighbouring beat but is dropped when its beat becomes a rest", "a v0 file migrates; a v99 file is refused".
- **Areas covered by tests:**
  - auto-speller and beat view round-trip for all 22 figures with tie/cut combinations, including ties across bar lines and triplet beats;
  - natural/alternate/off sticking with the worked examples, ties, rests, bass drum voice, lead L, and overrides;
  - the schedule (count-in, click accents, loop wrap, narrowed loop range, mid-play BPM and loop changes, swing warp and tempo easing, triplets unwarped, sixteenths proportional, groove presets, tied continuations silent);
  - editor commands in Insert and Normal modes and with vim keys off (counts, `.` repeat, undo/redo, paste-replaces, growth past the last beat, override flips by struck-note index);
  - library rules (defaults, unchanged-new detection, duplicate, filter, session order, open-after-delete);
  - export/import (shape, file names, migration chain shared with storage, refusal cases, Replace/Keep both/Skip).
- **Not tested automatically (checked by ear and eye):** React components, the VexFlow adapter, the Web Audio scheduler loop and gains, highlight sync, the idb repository, PWA/service worker. There are no end-to-end tests in v1.
- **Tooling:** Vitest, run in CI before every deploy.
- **Prior art:** there's no app code yet. The behaviour to match lives in the throwaway prototypes under [prototypes/](prototypes/) (the speller and sticking in the screen-layout and grid-editor prototypes, swing in the playback prototype). Use them as reference examples for test cases, not as code to port verbatim.

## Out of Scope

- Camera/photo import of notation (OMR); see the research doc for a later effort.
- iPhone / mobile / touch layouts.
- MIDI in (timing feedback) and MIDI out.
- Sync between devices, accounts, or using one library on several computers. Export/import covers moving exercises.
- Time signatures other than 4/4; quarter-note triplets spanning two beats.
- Editable or user-defined groove layers (presets only); swing on the groove layer alone.
- Step-grid and typed-line entry; any manual control over spelling.
- Multi-voice exercises (splitting a line between snare and bass drum).
- Tags, folders or book grouping in the library; import matching by name.
- A "swap hands each pass" option; a tempo ramp.
- Using the Q W E R Y… keys (left free for later commands); `j`/`k` movement between wrapped lines.
- A custom domain.

## Further Notes

- This spec assembles decisions already made in tickets 01–14. Where a later ticket amended an earlier one (e.g. sticking mode off, swing presets, library order, vim toggle), the spec follows the later ticket.
- The audio research suggests a user-facing latency calibration offset for the note highlight, but the chosen layout has no control for it. Build the highlight with an internal offset (default 0) and add a setting only if the highlight turns out to drift on the user's laptop.
- The export `format` marker `"drum-app-exercises"` was chosen before the app was named. Keep it as decided unless it changes before the first release; once files exist, changing it means accepting both markers.
- Tunable during implementation: the spelling rules, the swing-easing breakpoints, default gains (groove level with snare), and palette tile rendering.
- The domain glossary is [`CONTEXT.md`](../../CONTEXT.md); no ADRs exist yet.
