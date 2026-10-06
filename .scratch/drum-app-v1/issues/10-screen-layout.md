# Screen layout

Type: prototype
Status: resolved
Blocked by: (none)

## Question

How do the parts of the app fit on one laptop screen?

- Placement of the notation view and grid editor (stacked, side by side, or one replacing the other), mirrored live, with the current note highlighted during playback.
- Transport and practice settings: play/stop, loop range, BPM, count-in, groove preset, swing amount, the three volumes (click / exercise / groove), sticking mode and lead hand, voice.
- The vim-style editor's mode indicator, the keyboard-shaped beat figure palette, and the `?` legend ([Beat figure palette](07-beat-figure-palette.md)).
- The exercise library: list, name filter, checkboxes, New / Duplicate / Rename / Delete / Export / Import ([Exercise library](09-exercise-library.md)). Sidebar, separate screen, or overlay?
- How long exercises wrap across lines in the notation view.

## Comments

- 2026-10-06: Prototype built: [screen layout variants](../prototypes/10-screen-layout/index.html) (double-click to open; works offline with the `vexflow.js` next to it). Four structurally different laptop layouts on one page, switchable with the bottom bar or `?variant=A|B|C|D` (Alt+←/→). All four share one in-memory library of 7 exercises (including 8- and 12-bar lines), the beat-figure editor (Insert/Normal modes, the 07 keys), the groove layer drawn above the exercise, and rough real playback with count-in, swing and note highlight. Ctrl+Space plays and stops. Clicking a bar number loops that bar, and Shift+click extends the loop.
  - **A Workstation (stacked)**: library sidebar | notation above the beat strip and keyboard-shaped palette | every setting in a right sidebar.
  - **B Practice / Edit**: two modes that replace each other. Practice shows large notation with transport and all settings in a bottom dock. Edit shows a small notation mirror above a large editor. The library is a drawer (Ctrl+O).
  - **C Score first**: beat boxes sit under each bar of the notation itself, so there is no separate grid. The palette floats up in Insert mode and hides in Normal mode. Settings are in header pop-overs. The library is its own screen (Ctrl+L).
  - **D Side by side**: notation on the left; bar list, compact key palette and collapsible settings on the right. The library is a quick-open box (Ctrl+P) that also holds the management actions.
  - Wrapping is set from the bottom bar: fit to width, 4 bars per line (like the book), or 2 per line.
  - Surfaced while building: **Space** is the rest-beat key in Insert mode, so play/stop can't be plain Space while editing. The prototype uses Ctrl+Space. Waiting on the user's session.
- 2026-10-06: The user tried all four and chose **A (Workstation)**. Prototype updated with the follow-ups below (bar delete, sticking off, swing presets, vim toggle, stable list order, 4 bars per line).

## Answer

Decided with the user after trying the [prototype](../prototypes/10-screen-layout/index.html) (2026-10-06): **layout A, Workstation**, with these follow-ups.

**Layout: three columns on one screen.**
- **Left sidebar: exercise library**, always visible. Name filter, actions (New, Duplicate, Import, Export selected, Export all, Delete selected), and the list with checkboxes. Double-click a name to rename it.
- **Center column**, top to bottom:
  - **Header**: exercise name (inline rename), play/stop, playback position (count-in, bar · beat), BPM (number + slider), count-in toggle, and loop range readout with an "all" reset.
  - **Notation view**: takes the free height and scrolls. Bar numbers sit above each bar: click one to loop that bar, Shift+click to extend the loop. During playback it scrolls to keep the current line in view.
  - **Editor panel** below it: mode indicator, `?` legend, beat strip (bars of beat boxes, cursor, loop shading), and the keyboard-shaped beat figure palette.
- **Right sidebar: settings**, all visible, grouped as Groove (preset, swing amount), Sticking (mode, lead hand), Exercise (voice), Editor (vim keys), and Volume (click, exercise + mute, groove).

**Notation wrapping**: **4 bars per line**, like the book. Narrow windows fall back to fewer bars per line, and a short last line keeps the same bar width (left aligned).

**Follow-ups decided in the same session** (these amend earlier tickets):
- **Library order** (amends [Exercise library](09-exercise-library.md)): sorted by last opened **as of app launch**, and the order stays put while the app is open. Opening an exercise doesn't move it to the top until the next launch. Exercises created during the session go at the top.
- **Sticking mode "off"** (amends [Exercise data model and sticking rules](03-exercise-data-model.md)): a third mode beside natural and alternate. No R/L is printed. It's for lines where the other hand plays the groove (e.g. right hand on the ride, left hand comping). It's saved per exercise like the other modes.
- **Swing presets** (adds to [Swing and groove playback check](04-swing-groove-playback-check.md)): buttons beside the swing slider for light 58%, medium 62%, triplet 66.7% and dotted 75%. The default stays triplet (66.7%).
- **Vim keys can be turned off** (amends [Beat figure palette](07-beat-figure-palette.md)): an app setting, on by default. When off there's no Normal mode: Esc does nothing and the mode indicator is hidden. The keys that work in both modes still work.
- **Deleting a bar**: Ctrl+Backspace and `dd` as already decided in [Beat figure palette](07-beat-figure-palette.md), plus a ✕ on each bar in the beat strip, shown on hover, for the mouse.
- **Play/stop**: **Ctrl+Space** in either mode (plain Space is the rest-beat key in Insert mode), plus the play button.

**Left for implementation polish**: the palette tiles' rendering (the user found it jumbled) and the height balance between notation and editor panel.
