# Spec: Practice view

Status: done

Source: step 4 of the 2026-11-16 Impeccable critique of the Workstation (P1: "Desktop Practice never becomes a practice view"). The lead settled the decisions below; vocabulary follows [`CONTEXT.md`](../../CONTEXT.md).

## Problem Statement

On the desktop, the Practice screen never turns into a screen to play from. While a line plays, the library sidebar, the docked grid editor (bar tabs, tool palette, beat cards) and the whole Practice settings column stay on screen, and the notation is a mid-size card: the staff about 52 px tall, sticking letters about 16 px. At 1024 x 768 only about a bar and a half of a four-bar line shows without scrolling. That breaks three of the product's principles: the line comes first, the app is usable from the drum stool (a laptop about 1.2 m away), and nothing moves under your eyes.

## Solution

- A **practice view**, switched by a **Practice view** toggle at the end of the exercise's bar (a drawn icon and a label, lit while on) or the **P** key. It folds both sidebars to their rails and the grid editor to its bar-tabs row, and the notation card takes the room, the staff growing to fit (whatever Appearance's Notation Fit is set to). It is remembered per device.
- Only the toggle changes the layout. Play, stop, pause and the loop move nothing, in or out of the practice view, so the layout never changes as Play is pressed.
- In the practice view the editor is one deliberate click away: the arrow at the end of the bar tabs ("Show the editor") leaves the practice view with the editor open, as P and the toggle do. The editing keys and clicks on the notation still work in place and move nothing.
- At 1024 px wide and below (the desktop layout, not the phone), the Practice settings are a drawer: a rail whose sidebar opens over the notation from the header's Settings (sliders) button, as below 1000 px already. Above 1024 px they stay as they are. The Metronome screen keeps its settings docked down to 1000 px.
- The library sidebar isn't shown on the Metronome screen, where it has nothing beside it. Its open or collapsed state on Practice is the drummer's own and is kept.
- While the line plays, the bar being heard is shaded in the playhead's colour, behind the music, and the playhead line is half as heavy again (3 units, scaling with the notation), so both read from the stool. Both are drawn over the staff, so nothing moves. The phone gets the same.

## User Stories

1. As a drummer at a laptop, I press Practice view (or P) and the editor and sidebars fold away, and the whole line shows large enough to read from the stool.
2. As a drummer, pressing Play, stopping and looping a bar never move the notation, in the practice view or out of it.
3. As a drummer in the practice view, one click on the arrow at the end of the bar tabs, P, or the toggle brings the editor and sidebars back as I left them.
4. As a drummer in the practice view, the sidebars are still there as rails, and the header's Settings button opens the settings drawer over the notation.
5. As a drummer on a 1024 px laptop, the Practice settings are a drawer from the header's Settings button, so the notation has the width.
6. As a drummer on the Metronome screen, no library sidebar takes the room.
7. As a drummer playing along, the bar I'm on is shaded and the playhead is heavy enough to follow at a distance, in both looks, light and dark.
8. As a drummer, the app remembers the practice view on this device; the phone layout is unchanged.

## Implementation Decisions

- `DeviceSettings.practiceView` (default off), read through `deviceSettingsFrom` like the other yes-or-no settings.
- `src/app/workstation.ts`: a pure `workstationLayout(screen, window width, device)` returns each sidebar's place (`hidden`, `docked` or `drawer`), whether the editor is folded and whether the notation grows. `App.tsx` reads it; the media queries use its width constants. Unit-tested.
- The toggle and the P key live in `src/app/PracticeView.tsx`. P is free in every key map (the editor's, the playback keys, and the Metronome's T); it is ignored in a field, on a focused control and while a dialog or menu is open, and isn't mounted on the Metronome screen or a phone.
- `GridEditor` takes `folded`; in the practice view its chevron leaves the view (`practiceView: false, editorCollapsed: false`).
- The exercise bar's full width (`EXERCISE_BAR_WIDTH.full`) is re-measured with the toggle in it: 1037 px, Warm's need with the click off.
- `drawExercise` returns each bar's box (`barBox`), the one the cursor's tint fills; `followPlayback` shades the playing bar with `fill-play/12` behind the music and draws the playhead 3 units wide.

## Out of Scope

- Changing the layout on Play (rejected: it would move the notation under the drummer's eyes).
- A separate stage or full-screen mode, and any change to the phone layout.
- A larger notation scale cap than the grown 2.4.
- The other critique items (steps 5 and 6).

## Testing Decisions

- **Vitest:** `workstationLayout` at 1440, 1280, 1025, 1024, 999 and 800 px, on both screens, with the practice view on and off, Fit off and the editor collapsed; `deviceSettingsFrom` for `practiceView`; `notationFit` drawing a four-bar line larger, all of it in view, in the room the practice view frees at 1024 x 768.
- **In the browser (headless Chromium, real mouse clicks):** 1440 x 900, 1280 x 800 and 1024 x 768 in Warm and Studio, light and dark: the toggle on and off, then count-in, playing, stopped and looped, with the staff, play button, BPM box and toggle boxes measured to stay put except on the toggle itself; the settings drawer at 1024; the Metronome without the library; editing by keys in the practice view; P typed into the rename field; the chevron leaving the view; 390 x 844 light and dark, playing.
