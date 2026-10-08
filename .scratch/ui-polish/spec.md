# Spec: UI polish

Status: done (PR #47)

Source: the ideas parked in the UX review after [ticket 04 of kick-row-and-beat-cards](../kick-row-and-beat-cards/issues/04-swing-written-as-triplets.md), listed as out of scope in the [first-run-examples spec](../first-run-examples/spec.md) ("an empty-state hint… the notation size, narrow-window layout and vim-off-by-default ideas"). Decided with the user on 2026-10-08, after `v1.0.0`: auto-fit notation with a cap, collapsible sidebars that become overlays in a narrow window, a legend line for the figure keycaps, and a hint over the staff for an empty exercise. Vocabulary follows [`CONTEXT.md`](../../CONTEXT.md).

## Problem Statement

A short exercise, one or two bars, is drawn small in the top corner of a big empty notation area, which is exactly when I want to read it from the kit. On a laptop, or with the window half the screen, the two sidebars squeeze the notation and the beat cards until they're cramped, and I can't put either sidebar away. A new exercise opens to a blank staff with no word on how to start. The letter badge on each beat card (A, S, …) isn't explained anywhere, so I don't know it's a key I can type. And vim keys are on for a new user who has never heard of vim, so a stray `Esc` puts the editor in a mode they don't understand.

## Solution

- **Bigger notation.** When there's room, the staff scales up to fill the notation area, up to 1.6 times its usual size, and shrinks back as bars are added. Nothing to set.
- **Collapsible sidebars.** Each sidebar has a collapse button. A collapsed sidebar is a thin rail with a button to open it again. Which sidebars are collapsed is remembered on this device.
- **Narrow windows.** Below 1000 px wide, both sidebars start as rails, and opening one shows it as an overlay over the notation instead of squeezing it. `Esc` or a click outside closes the overlay.
- **Empty-exercise hint.** An exercise with no hits shows a short hint centred over the staff: "Click a grid position below, or type a figure key, to add hits." It goes with the first hit.
- **Figure key legend.** One quiet line under the beat cards: "Letters show each beat's figure key: type it to enter that figure. ? for all keys."
- **Vim keys off by default** on a new device. A device that already has the setting keeps it.

## User Stories

### Notation size

1. As a drummer practising a one- or two-bar exercise, I want the staff drawn bigger, so that I can read it from behind the kit.
2. As a drummer, I want the staff to shrink back as I add bars, so that a longer exercise still fits on as few lines as before.
3. As a drummer, I want the bigger staff to stay within the notation area's height when it can, so that I don't have to scroll to see a short exercise.
4. As a drummer, I want clicks on notes, hands and bar numbers to work the same at any size, so that bigger notation doesn't break editing.

### Sidebars

5. As a drummer, I want to collapse the library sidebar and the settings sidebar, so that the notation and beat cards get the room.
6. As a drummer, I want a collapsed sidebar to leave a thin rail with a button to open it, so that I can always get it back.
7. As a drummer, I want which sidebars are collapsed remembered on this device, so that the layout is the same when I come back.
8. As a drummer on a narrow window, I want the sidebars to start collapsed, so that the notation isn't squeezed.
9. As a drummer on a narrow window, I want an opened sidebar to show over the notation and close with `Esc` or a click outside, so that I can pick an exercise or change a setting and get back.

### Hints

10. As a new user on an empty exercise, I want a hint saying how to add hits, so that I'm not looking at a blank staff with no idea how to start.
11. As a drummer, I want the hint gone as soon as there's a hit, so that it never covers notation.
12. As a drummer, I want a line saying what the letter on each beat card is, so that I learn I can type it.

### Vim keys

13. As a new user, I want vim keys off by default, so that the editor doesn't switch to a mode I don't know.
14. As a drummer who already uses vim keys, I want my setting kept, so that the change doesn't turn them off on me.

## Implementation Decisions

### Exercise core (the test seam)

- **Notation fit.** A pure function picks the layout for the notation area: given the bar count, the area's width and height, and the height of one line of staff at normal size, it returns the scale (1 to 1.6) and the bars per line. The scale is the largest, in steps of 0.05, at which the exercise needs no more lines than at scale 1, and whose height fits the area, unless it didn't fit at scale 1 either. Bars per line stay at most 4, fewer when a bar would be narrower than its minimum width (190 px at scale 1). The layout constants (margins, clef width, minimum bar width) move to the core with it.
- **Empty exercise.** `hasHits(exercise)` says whether any row of any bar has a note.
- **Device settings.** `vimKeys` defaults to `false`. A stored value is kept as it is. New: `librarySidebarOpen` and `settingsSidebarOpen`, both default `true`, for the wide layout.

### App

- **Notation.** `drawExercise` draws at the layout the core picks, scaling the SVG by the scale, so hit areas and the playhead line scale with it. The notation area's height is measured along with its width.
- **Sidebar rails.** A collapsed sidebar is a rail about 32 px wide with an open button (a chevron) and the sidebar's name written vertically. The sidebar's heading gets a collapse button.
- **Narrow layout.** At or above 1000 px, an open sidebar takes its column, as now, and the open/closed state is the stored device setting. Below 1000 px, both show as rails, and opening one shows it as an overlay with a shadow, on top of the notation. The overlay's open state is not stored. `Esc` closes it only when it's open, so `Esc` keeps its editor meaning otherwise.
- **Empty hint.** Shown in the notation area, centred over the staff, when the open exercise has no hits. It doesn't take clicks. An example always has hits.
- **Legend line.** Below the beat cards, in the muted small text, always shown.

## Testing Decisions

- **One seam: the exercise core's public interface**, as before. For example:
  - "a one-bar exercise in a wide, tall area is drawn at 1.6 times, and an eight-bar exercise in the same area at 1";
  - "the scale never adds a line: with 4 bars a line at scale 1, a 4-bar exercise stays on one line";
  - "a short exercise in a short area is scaled only as far as its height fits";
  - "an exercise of rests has no hits; one kick note is a hit";
  - "the default device settings have vim keys off, and both sidebars open". A stored setting is kept by the existing merge over the defaults in the repository, checked in the browser.
- **Not tested automatically:** the drawing at scale, the rails, the overlay, the hint and the legend. These are checked in the browser with real mouse events: clicks on notes, hands and bar numbers at a large scale, collapse and reopen at 1280 px, and overlays at 900 px.

## Out of Scope

- A manual zoom control.
- A phone layout (below about 600 px), or touch-specific controls.
- An onboarding tour or tooltips beyond the hint and the legend.
- Changing how many bars a line holds at most (4).
- Dark mode.

## Further Notes

- The empty hint names both ways to add hits, so it's right whichever of the mouse or keyboard the drummer uses. With vim keys now off by default, a new user is always in Insert mode, where figure keys work straight away.
