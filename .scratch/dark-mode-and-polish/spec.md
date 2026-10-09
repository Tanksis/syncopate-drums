# Spec: Dark mode and polish

Status: ready-for-agent

Source: a grilling with the user on 2026-10-09, after the mobile-layout feature and before the clean-tempo tracker. The user asked for dark mode and for a precise way to set the volumes on desktop, then agreed to fix what screenshots at 1280 px and 390 px showed. The fixes cover a cramped desktop header, a tall read-only notice on the phone, and faint secondary text. A logo was mentioned and parked. A component library was considered and not adopted: a headless one (Radix or React Aria) is to be reconsidered when a control is hard to get right, for example a date picker in the practice log. Vocabulary follows [`CONTEXT.md`](../../CONTEXT.md).

## Problem Statement

Practising in a dim room, the white app glares from the music stand. On desktop, the volume and swing sliders can't be set to an exact value, and there's no quick way back to 100% or to straight time. At 1280 px the header cuts the exercise name to "Exa…", and "count-in" and "Loop all bars" wrap onto two lines. On the phone, the read-only notice on an example takes about 15% of the screen above the notation. The count labels (`e & a`) and other grey text are faint.

## Solution

- **Dark mode:** an Auto / Light / Dark switch, with dark notation to match.
- **Precise volumes and swing:** each `%` readout becomes a field you can type in and step with the arrow keys. Double-clicking a slider resets it.
- **A header that fits:** the exercise name gets the room, and the labels stay on one line.
- **Phone examples:** a Copy button in the transport bar replaces the notice.
- **Contrast:** WCAG AA in both themes.

## User Stories

### Dark mode

1. As a drummer practising in a dim room, I want a dark theme, so that the screen doesn't glare from the stand.
2. As a drummer, I want the app to follow my device's light or dark setting by default, so that it matches everything else I use.
3. As a drummer, I want to force Light or Dark on this device, so that I can override the system setting when the room calls for it.
4. As a drummer, I want the notation itself dark, light lines and notes on a dark background, so that the staff doesn't glare in an otherwise dark app.
5. As a drummer, I want the cursor, playhead, loop and kick colours still easy to tell apart in the dark, so that I can read them as before.
6. As a drummer using dark mode, I want no white flash when the app opens, so that it doesn't dazzle me.

### Precise volumes and swing

7. As a drummer at the computer, I want to type an exact volume, so that I can set the click to, say, 85%.
8. As a drummer, I want ↑/↓ to step the value by 1 and Shift+↑/↓ by 10, so that I can nudge it without the mouse.
9. As a drummer, I want to type an exact swing such as 60%, so that I don't have to drag to it.
10. As a drummer, I want a typed value outside the range clamped, and nonsense ignored, so that a typo can't break the playback.
11. As a drummer, I want double-clicking (or double-tapping) a volume slider to put it back to 100%, and the Swing slider back to straight (50%), so that I can undo an experiment quickly.
12. As a drummer on the phone, I want the slider to work as it does now, so that the new field doesn't get in the way.

### Desktop header

13. As a drummer, I want to see the open exercise's name in the header, so that I know which exercise I'm playing.
14. As a drummer, I want "count-in" and the loop readout on one line each, so that the header reads cleanly.
15. As a drummer in a narrower window (640–900 px), I want the header to stay on one line, so that nothing is pushed out of view.

### Phone examples

16. As a drummer on the phone, I want an example to give the notation the whole screen, so that I can read it without a notice in the way.
17. As a drummer on the phone, I want a Copy button where Edit would be on an example, so that I can make my own copy and start editing it straight away.

### Contrast

18. As a drummer, I want the count labels and the other grey text readable in both themes, so that I don't squint at them.

## Implementation Decisions

### Exercise core (the test seam)

- **Device settings:** a new `theme: 'auto' | 'light' | 'dark'` setting, `'auto'` by default. A stored value that isn't one of these is dropped, as with other unknown settings. The theme belongs to the device, so it isn't exported.
- **`parsePercent(text, { min, max, previous })`:** turns typed text into a value in the range.
  - "85", "85%", " 85 % " and "66.7" are accepted.
  - A value outside the range is clamped to it.
  - Empty or non-numeric text gives back `previous`.
  - Values are in percent, and the app converts them to and from its 0–1.5 volumes and its 0.5–0.75 swing.

### App

- **Colour tokens (contrast):**
  - Every colour used in the app, including the notation's in `staff.ts` (ink, accent, loop, shading), comes from the `@theme` tokens in `src/styles/index.css`. The notation reads them as CSS variables when it draws.
  - Light `mute` is darkened, and other tokens adjusted as needed, so that text meets 4.5:1 against the surface it sits on, and large text, control borders and states meet 3:1.
- **Dark theme:**
  - Warm near-black greys from the same stone family: background ≈ #1c1917, cards ≈ #292524, text ≈ #e7e5e4. Accent, play, kick and loop colours are retuned for the dark background to meet the same contrast targets.
  - The theme is set by a `data-theme` attribute on `<html>`. Auto follows `prefers-color-scheme`, live.
  - The notation redraws when the theme changes.
- **Display switch:** a **Display** section at the bottom of Settings, holding a three-way Auto / Light / Dark segmented control, styled like the existing ones.
- **No flash:** the theme choice is mirrored to `localStorage` (one key). A small inline script in `index.html` applies it before the app renders. IndexedDB stays the source of truth, and the mirror is written whenever the setting changes. If `localStorage` throws or is empty, the script falls back to Auto.
- **Precise field:**
  - Each `%` readout next to the Click, Exercise and Groove sliders and Swing becomes a small text field. It uses `inputmode="decimal"`, so the phone shows a number keypad.
  - Enter or blur commits through `parsePercent`, and Escape reverts.
  - ↑/↓ step by 1 percentage point and Shift+↑/↓ by 10, clamped, and each step applies at once.
  - Volumes show whole percents. Swing shows one decimal, as now.
  - After a commit the keyboard goes back to the editor, as with the sliders.
- **Double-click reset:** a double-click (or double-tap) on a volume slider sets it to 100%, and on the Swing slider sets it to 50%. Each reset is saved like a finished drag.
- **Desktop header:**
  - The "Syncopate!" title stays.
  - The BPM slider shrinks (about w-24).
  - "count-in" and the loop readout don't wrap (`whitespace-nowrap`).
  - The exercise name takes the remaining width, at least about 12 characters before truncating.
  - Below 900 px (and above the phone layout), the BPM slider is hidden, and the BPM field stays.
- **Phone examples:**
  - Below 640 px, `ExampleNotice` isn't shown.
  - On an example, the transport bar's Edit slot shows **Copy** (aria-label "Copy to Library"), which copies the example and opens the copy, as Copy to Library does on desktop. The button then becomes Edit.
  - Desktop keeps its notice row.

## Testing Decisions

- **One seam: the exercise core's public interface**, as before. For example:
  - "the default device settings have `theme: 'auto'`";
  - "a stored `theme: 'sepia'` is dropped";
  - "`parsePercent('85%')` is 85, `'200'` clamps to the max, and `'abc'` gives back the previous value".
- **Not tested automatically:** colours, contrast, layout, the fields' keys, double-click reset and the no-flash script. These are checked in the browser with real pointer and keyboard events, in both themes, at 1280 px, 800 px and 390 × 844 (Playwright WebKit with touch for the phone). Contrast is measured on the rendered page (computed colours against their backgrounds), not eyeballed.

## Out of Scope

- A logo.
- A component library. Reconsider a headless one when a control is hard to get right.
- Count-in or loop controls in the phone transport bar. They stay in ⚙.
- Theme-specific notation fonts or a "paper" style for the staff.
- The clean-tempo tracker and practice log (next feature).

## Further Notes

- The tickets for this spec are in `issues/`. Contrast tokens (01) come first, because dark mode (02) builds on tokenised colours.
