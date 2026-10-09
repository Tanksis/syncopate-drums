# Spec: Mobile layout and grid-only entry

Status: ready-for-agent

Source: a grilling with the user on 2026-10-09, after the user asked how to improve the experience and said the app "sucks for mobile at the moment". The user mostly uses an iPhone in portrait, in Chrome (WebKit underneath, as every iOS browser is). Along the way the user said they only use the grid and never the figures, and didn't know what Tie did, so the figures, vim keys and Cut short go first ([ADR 0009](../../docs/adr/0009-grid-only-entry.md)). A mockup of the phone screens is at https://claude.ai/artifact/FSoXvc91uvtxWFBRGhd991 (layout "two beats per row" was picked). Vocabulary follows [`CONTEXT.md`](../../CONTEXT.md).

## Problem Statement

On my phone, Syncopate! is a desktop page squeezed small: the header with the transport doesn't wrap, the notation and the four beat cards are cramped, grid cells are too narrow for a finger, and some edits need a right-click or a key I don't have. The screen dims and locks while the phone sits on the music stand, and with the silent switch on there's no sound at all. I also want to edit on the phone, for example to set up a comping line I don't have an import file for. On every screen, the editor carries things I don't use: the figure palette, its key letters, vim mode, and Tie and Cut short buttons whose meaning I never learned.

## Solution

- **Grid-only entry.** The figure palette, the figure keys and their letters on the beat cards, the legend line, vim mode and Cut short go. The `?` cheat sheet stays, with only the keys that are left. Tie stays only as "Tie over the barline".
- **Controls that need no keyboard or right-click**, on every screen size:
  - a **⋯ menu on each beat card**: switch to triplets or sixteenths, rest the beat, and, on a bar's first beat (not the exercise's), tie over the barline;
  - **long-press a hit** to flip its sticking;
  - **undo and redo buttons** in the editor header;
  - a **⋯ menu on the bar tabs**: add a bar after, duplicate, copy, paste over, delete.
- **A phone layout below 640 px wide:**
  - a compact header: ☰ (exercises), the exercise name, ⚙ (settings); each opens its sidebar full-screen;
  - the notation fills the screen;
  - a transport bar fixed at the bottom: play/pause, BPM − and +, and Edit;
  - Edit opens the grid editor as a bottom sheet under the staff, which stays visible and follows each edit; Done closes it. The sheet shows the bar tabs, undo/redo, and the cursor bar's beat cards two to a row.
- **Phones on the music stand:** the screen stays awake while playing and for a minute after, and sound plays with the silent switch on.
- **Touch devices** don't show keyboard hints (the `?` button and cheat sheet).

## User Stories

### Grid-only entry

1. As a drummer, I want the figure palette, the key letters on the beat cards and the legend line gone, so that the editor shows only the grid I actually use.
2. As a drummer, I want vim mode gone, so that a stray `Esc` can never put the editor in a mode I don't know.
3. As a drummer, I want the `?` cheat sheet to list only the keys that still work, so that it's a true reference.
4. As a drummer, I want exercises I made with figures, ties or cut-short beats to look and play exactly as before, so that nothing in my library changes.
5. As a drummer, I want the empty-exercise hint to say only how to add hits on the grid, so that it doesn't mention keys that are gone.

### Controls without a keyboard

6. As a drummer, I want a menu on each beat card to switch it between sixteenths and triplets, so that I don't need a right-click, which I can't do on a phone and couldn't find on desktop.
7. As a drummer, I want to rest a whole beat, snare and kick, from its menu, so that I can clear it in one action.
8. As a drummer, I want "Tie over the barline" in the menu of a bar's first beat, so that a note can be held over the barline, which dragging can't do with one bar shown.
9. As a drummer, I want a tick or highlight showing the beat is tied, and the same item to remove it, so that I can see and undo a tie.
10. As a drummer, I want to long-press a hit to flip its sticking, so that I can change a hand without Alt+1–4.
11. As a drummer, I want a short tap to keep toggling the hit and a drag to keep setting the hold, so that long-press doesn't get in their way.
12. As a drummer, I want undo and redo buttons, so that I can take back a mis-tap without a keyboard.
13. As a drummer, I want a menu on the bar tabs to add a bar after, duplicate, copy, paste over and delete the cursor bar, so that bar edits don't need the keyboard.
14. As a drummer using the keyboard, I want Shift+arrows, Ctrl+C/V and the other bar keys to keep working, so that the desktop stays quick.

### Phone layout

15. As a drummer on a phone in portrait, I want the notation to fill the screen while I practise, so that I can read it from the kit.
16. As a drummer on a phone, I want play/pause and the BPM buttons in a bar at the bottom, in reach of my thumb, so that I can start, stop and change tempo with one hand.
17. As a drummer on a phone, I want the exercises and settings to open full-screen from buttons in the header, so that they're readable and out of the way otherwise.
18. As a drummer on a phone, I want an Edit button that opens the editor under the staff, so that I can see the line change as I enter it.
19. As a drummer on a phone, I want the beat cards two to a row with cells big enough for a finger, so that I hit the position I mean, with the whole bar in view.
20. As a drummer on a phone, I want to drag a hold across beats in the two-row layout, so that holds work as on desktop.
21. As a drummer on a phone, I want to rename the exercise from the header, so that a new exercise doesn't stay "Untitled".
22. As a drummer on a tablet or a narrow window, I want today's narrow layout with the new menus and buttons, so that it works by touch too.

### On the music stand

23. As a drummer with the phone on a stand, I want the screen to stay on while the exercise plays, so that it doesn't dim and lock mid-line.
24. As a drummer, I want the screen allowed to sleep again a minute after I stop, so that the battery doesn't drain when I walk away.
25. As a drummer with my iPhone on silent, I want the click and drums to play anyway, so that the app doesn't seem broken.

## Implementation Decisions

### Exercise core (the test seam)

- **Removed:** the `enterFigure` and `replaceBeats` commands, `toggleCutShort` as a command, the `T` key, the figure keys and `-`, Alt+1–4, `EditorMode` and every Normal-mode command (`normal`, `insert`, `pending`, `openBar`, `putBars`, `replaceBars`, `repeatChange`, `moveWord`, `goToBar`, and the counts on commands where only vim used them). The key map loses its mode and vim context. The speller keeps `FIGURES`, `toggleCutShort` and the cut-short and tie flags in the model, so stored beats spell as before.
- **Tie over the barline:** a command that toggles the tie into a given bar's first beat (`toggleTie` with a bar and beat, rather than the cursor). It's refused on the exercise's first beat, and on a beat whose downbeat has no hit or whose previous beat ends in a rest. A function says whether a beat offers it (`canTieOverBarline` or similar), so the menu shows the item only where it would work.
- **Beat menu** commands take the bar and beat they act on: `setBeatGrid` (exists), rest the beat (both rows of a given bar and beat; `Backspace` and `Delete` still rest only the cursor row), and the tie above. Each is one undo step.
- **Sticking flip** reuses `flipOverride` with a grid point's note.
- **Bar menu** commands act on the cursor bar: `addBar`, `duplicateBar`, `copyBars`, `pasteBars`, `deleteBar` (all exist).
- **Device settings:** `vimKeys` and `figuresPanelOpen` are removed from the defaults. A stored value is ignored.

### App

- **Removed:** `Palette.tsx`, the figures panel toggle, the keycap badges and legend line, the vim switch, the mode line, and vim's rows in the cheat sheet. Right-click on a beat card no longer switches the grid (the menu does). The empty hint reads "Tap or click a grid position below to add hits."
- **Beat card ⋯ menu:** a small button in the card's header that opens a popover with the items above. The current grid is shown, and a beat that's tied shows its tie item ticked. It closes on choice, `Esc` or a tap outside.
- **Long-press:** a pointer held 500 ms on a hit without moving more than a few pixels flips its sticking and doesn't toggle the hit or start a hold. It does nothing on a rest or when sticking is off. iOS's callout and text selection are suppressed on the cells (`-webkit-touch-callout: none`, `user-select: none`). Clicking a hand on the notation keeps flipping it as now.
- **Undo/redo and bar menu:** ↶ ↷ buttons and a ⋯ button in the bar tab row, disabled when there's nothing to undo or redo. Hidden for an example, like the other edit controls.
- **Phone layout** (below 640 px, by a `useNarrowWindow`-style hook):
  - The workstation grid becomes a column: header, notation (flex 1), editor sheet when open, transport bar.
  - The header has ☰, the exercise name (tap to rename) and ⚙. The sidebars open as full-screen overlays with a close button. The existing overlay code (rails below 1000 px) is reused, minus the rails.
  - The transport bar is fixed to the bottom with the safe-area inset added to its padding. It holds play/pause, BPM −/+ (steps of 1, holding repeats), the BPM value, and Edit. The rest of the transport (loop, count-in…) stays in settings.
  - The editor sheet takes the lower part of the screen (about 55%) and scrolls inside if needed. Its header holds the bar tabs, ⋯, ↶ ↷ and Done. The beat cards are two per row, with cells at least 44 px tall.
  - Heights use `dvh`, not `vh`, so iOS's toolbar doesn't hide the bottom bar.
- **Holds across the row break:** the hold drag finds the cell under the finger from the pointer's position (as it must for any card layout), so a drag from beat 2 down into beat 3 works.
- **Touch:** keyboard hints are hidden when the primary pointer is coarse (`(pointer: coarse)`), on any width.
- **Wake lock:** requested when playback starts, released one minute after it stops or pauses, and re-requested on returning to the tab while playing. A refusal is ignored.
- **Silent switch:** set `navigator.audioSession.type = 'playback'` where it exists, before the audio context starts.

## Testing Decisions

- **One seam: the exercise core's public interface**, as before. For example:
  - "the key map has no figure keys, no `T` and no `Esc` command";
  - "an exercise stored with a cut-short beat and a tie spells the same as before";
  - "tie over the barline toggles the tie into bar 2's first beat, and is refused on bar 1's first beat and after a rest";
  - "resting a given beat from its menu rests both its rows and is one undo step";
  - "the default device settings have no `vimKeys` or `figuresPanelOpen`".
- **Not tested automatically:** the menus, long-press, the phone layout, the wake lock and the audio session. These are checked in the browser with real pointer events (see memory: dispatched clicks skip hit-testing), on desktop at 1280 px, in a narrow window at 900 px, and in **Playwright WebKit at 390 × 844 with touch** (`hasTouch`, `isMobile`): tap, drag a hold across the row break, long-press, open and close the sheet and drawers. The wake lock and silent switch are checked by the user on their iPhone.

## Out of Scope

- A figure palette on any screen, and any replacement keyboard entry for notes.
- Bar selection by touch: the bar menu acts on one bar.
- Landscape-specific layouts on a phone (portrait is the target; landscape gets the phone layout or the narrow one by width).
- An installable app or offline use.
- The clean-tempo tracker and practice log (the next feature, built on this layout), and sync across devices (after that).
- Dark mode.

## Further Notes

- Ordering decided with the user: this feature first, then the **clean-tempo tracker** (a Clean ✓ button that logs the current BPM with the date, per exercise) and the **practice log and streaks** (time counted while playback runs), then **accounts and sync** across devices, open to public sign-up. Records from the tracker and log should carry an id and a timestamp so sync can be added under them. The gap click was considered and dropped.
- The transport bar leaves room at its right end for the Clean ✓ button.
