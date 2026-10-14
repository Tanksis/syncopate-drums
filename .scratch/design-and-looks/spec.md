# Spec: Design and looks

Status: ready-for-agent

Source: a design session with the user on 2026-10-14. Their choices are given below.
- Mockups are on the design canvas at <https://claude.ai/artifact/6bB4NKjd4CDZPzTTS3o1nJ>:
  - A Studio, B Warm (called "Practice room" there), C Bold and the control kit;
  - E Score, G Riso and I Catalogue.
- D, F and H on the canvas were rejected.
- Vocabulary follows [`CONTEXT.md`](../../CONTEXT.md).

## Problem Statement

- **It looks thrown together.** The desktop screen works, but reads like a settings form:
  - the settings are squeezed into segmented buttons whose labels run together ("2 & 4" and "&s");
  - several labels are developer shorthand: lowercase toggles `count-in` and `mute`, and swing presets `off / light / medium / triplet / dotted`;
  - nothing gives the app an identity, and "Syncopate!" is plain bold text.
- **Dark mode hides choices.** Selected buttons are grey on grey, so the current choice is hard to spot, and Play loses its colour.
- **Menus can't be reached with the keyboard.** No `Menu` takes Tab focus (left open by library-and-play-polish 03).
- **Segmented buttons are built several times.** The groups in `SettingsSidebar` (swing presets, theme, `Choice`, hi-hat foot) each repeat the same markup.
- **The empty middle.** On desktop the staff takes a thin strip at the top of a large, empty area.

## Solution

1. **A control kit.** One set of shared controls, styled once, used everywhere:
   - a segmented control and a keyboard-reachable `Menu`;
   - buttons, a switch, a slider and a value field.
   - AA contrast and visible focus in every look. A selected option keeps its accent colour in dark mode.
2. **A new desktop header.**
   - Tempo as **− [80 BPM] +** with a slider beside it.
   - A real **Count-in** switch.
   - A **Loop · All bars** chip.
   - A button that shows or hides Settings.
   - Play stays on the staff (library-and-play-polish 04).
3. **A rebuilt settings panel** in four sections:
   - **Groove:** Preset and Hi-hat foot as menus, then Swing with named presets.
   - **Sticking:** labels as now. "Reset N changed hands" appears only when there are some.
   - **Mix:** a mute button each for Click, Exercise and Groove.
   - **Appearance:** Look and Mode.
4. **The notation in a card.**
   - The staff sits on a card in the middle area, with Play pinned at its top left.
   - The grid editor stays docked under it as it is now (not a floating card), and can be collapsed to its header.
5. **Looks.** The user picks how the app looks from six **looks** ([ADR 0013](../../docs/adr/0013-looks-are-skins.md)):

   | Look | Feel | Modes |
   |---|---|---|
   | Studio (default) | Neutral greys, one blue accent, crisp sans-serif | Light and dark |
   | Warm | Warm paper tones, serif headings, terracotta, round pills | Light and dark |
   | Bold | Black and lime, 2 px borders, hard offset shadows, grotesk | Light and dark |
   | Score | Engraved sheet music: off-white paper, black ink, square corners, italic serif wordmark, red-pencil accent | Light only |
   | Riso | Risograph zine: riso blue on paper, fluorescent-pink offset shadows, chunky rounded display font | Light only |
   | Catalogue | '70s drum catalogue: mustard and cream, burnt orange, racing stripes under the header, fat retro script wordmark | Light only |

   A look changes the skin only: colours, fonts, corner radius, border weight, shadows and a few fixed ornaments. It never changes the layout, sizes or spacing.

## User Stories

### Controls

1. As a drummer, I want every on/off choice to look and behave the same, so that I learn the app once.
2. As a drummer, I want the selected option to stand out in light and dark, so that I can see the current setting at a glance.
3. As a keyboard user, I want to Tab to every menu and segmented control, open a menu with Enter, Space or ↓, move with the arrow keys and close with Esc, so that I never need the mouse.
4. As a drummer, I want Space to keep pausing playback when no control has focus, so that the key I use at the kit still works.

### Header (desktop)

5. As a drummer, I want − and + beside the BPM and a slider next to it, so that I can nudge or sweep the tempo.
6. As a drummer, I want Count-in as a labelled switch, so that I can see whether it's on.
7. As a drummer, I want the loop range as a chip, "Loop · All bars" or "Loop · Bars 2–3", so that I always know what will repeat.

### Settings

8. As a drummer, I want the groove preset and the hi-hat foot as menus with full names ("2 & 4", "Off-beats"), so that the options aren't squeezed.
9. As a drummer, I want the swing presets named Straight, Light, Medium, Triplet and Dotted, so that I know what each one does.
10. As a drummer, I want "Reset 3 changed hands" only when I've changed some, so that the panel shows nothing that does nothing.
11. As a drummer, I want to mute the click or the groove as well as the exercise, so that I can practise against any combination.
12. As a new user, I want the settings grouped as Groove, Sticking, Mix and Appearance, so that I can find things.

### Notation and editor

13. As a drummer, I want the music on a card that fills the middle of the screen, so that it reads as the main thing.
14. As a drummer, I want to collapse the grid editor to its header, so that the music gets the room while I practise.
15. As a drummer, I want the app to remember on this device whether the editor is collapsed, so that it stays how I left it.
16. As a new user opening an example, I want the editor collapsed, so that I see the music first. Examples are read-only anyway.

### Looks

17. As a drummer, I want to choose a look from a menu in Appearance, so that the app feels like mine.
18. As a drummer, I want Studio, Warm and Bold to follow Auto, Light or Dark, so that the app matches my device at night.
19. As a drummer, I want choosing Score, Riso or Catalogue to set the mode to Auto and draw light, with Mode greyed out and a hint saying the look is light only, so that I'm never left in a mode the look can't draw.
20. As a drummer, I want the sticking letters and bar numbers to take the look's font, so that the music matches the look. The notes themselves stay standard engraving.
21. As a drummer, I want the look I chose to show from the first frame at launch, so that the screen never flashes the default.
22. As a drummer on the phone, I want the same controls and looks, in the phone layout I already have, so that nothing moves.

## Implementation Decisions

### Exercise core (the test seam)

- **Device settings:**
  - `clickMuted: boolean` and `grooveMuted: boolean` (default `false`), beside `exerciseMuted`.
  - `editorCollapsed: boolean` (default `false`).
  - `look: Look` (default `'studio'`).
  - `deviceSettingsFrom` drops a `look` it doesn't know, as it does a `theme`.
- **`Look`:**
  - `type Look = 'studio' | 'warm' | 'bold' | 'score' | 'riso' | 'catalogue'`, with `LOOKS` and `LIGHT_ONLY_LOOKS` lists.
  - A pure `withLook(settings, look)` sets `look` and, for a light-only look, sets `theme` to `'auto'`.
  - A pure `drawnMode(look, theme, systemDark)` returns `'light'` or `'dark'`. It always returns `'light'` for a light-only look.
- **Mix:** a muted click or groove plays nothing, as a muted exercise does now, wherever the schedule or mix applies `exerciseMuted`.
- **Hand count:** a count of the exercise's sticking overrides, for "Reset N changed hands". Use the existing one if there is one.

### App

- **Tokens:**
  - `src/styles/index.css` keeps the colour tokens. It adds tokens for:
    - the body and display fonts, and a numbers font;
    - corner radius, small and large;
    - control and card border width;
    - card and popover shadows;
    - the ornaments.
  - Every look sets every token under `:root[data-look='…']`. Dark values go under `:root[data-look='…'][data-theme='dark']`.
  - Studio's values are the defaults. Its dark accent is blue (`#7B97FF` on the canvas), not grey.
  - No other CSS files, and colours still come only from tokens (CLAUDE.md).
- **Ornaments:** a fixed set of token-driven hooks, not free-form CSS per look:
  - `--header-ornament`: a box-shadow under the header, used for Catalogue's stripes;
  - `--card-offset`: an offset shadow, used for Bold's and Riso's hard shadows;
  - `--wordmark-*`: the wordmark's font, style, case and shadow.
- **Applying a look:**
  - `followTheme` (`src/app/theme.ts`) also sets `data-look` on `<html>`, and uses `drawnMode` for `data-theme`.
  - The inline script in `index.html` reads a mirrored `syncopate-look` key beside `syncopate-theme`, so the first paint is right.
- **Fonts:**
  - Self-hosted with `@fontsource` packages, and only the active look's are loaded (a dynamic `import()` per look):
    - Studio: Geist and Geist Mono;
    - Warm: DM Sans and Fraunces;
    - Bold: Manrope and Space Grotesk;
    - Score: EB Garamond and Instrument Serif;
    - Riso: Familjen Grotesk, Bagel Fat One and Space Mono;
    - Catalogue: Nunito, Shrikhand and Righteous.
  - These fonts are OFL-1.1, so `scripts/check-licenses.mjs` allows `OFL-1.1` for `@fontsource/*` only. Nothing else changes in that policy.
  - Until a font loads, the look falls back to `system-ui` or Georgia.
- **Notation:** `staff.ts` reads the sticking-and-bar-number font from a token as it reads the colours. Noteheads, rests and beams keep VexFlow's engraving font.
- **Control kit** (`src/components/`):
  - **`Segmented`:** a `role="radiogroup"` with roving tabindex, so arrow keys move and select. It replaces `Choice`, the swing presets, the theme group, the lead hand and the editor's grid buttons.
  - **`Menu`:** its button takes Tab focus. Enter, Space or ↓ opens it, with focus on the checked item (or the first). ↑/↓ move, Home and End jump, Enter chooses, and Esc or Tab closes and returns focus to the button. A mouse click still keeps focus where it was (`keepFocus`).
  - **`Switch`** (`role="switch"`) and buttons in primary, secondary, ghost and icon variants.
  - **`Slider`** and **`ValueField`**, as the BPM and percent fields are now (`PercentField`).
  - App-wide Space pauses only when the focus isn't on a control that uses Space.
- **Header (desktop):**
  - `TransportBar`'s tempo controls are restyled into the header's group: − / BPM field / +, the slider, the Count-in switch and the loop chip.
  - The loop chip shows the loop range, and clicking it clears a loop back to all bars.
  - The narrow-header steps (`useHeaderRoom`, `HEADER_WIDTH`) are re-measured, so the slider still drops first.
- **Settings panel:**
  - Sections are named Groove, Sticking, Mix and Appearance (was Volume, Display).
  - Hi-hat foot and Preset use `Menu`. Hi-hat foot reads Off, On 1, Quarters, 2 & 4, Off-beats, with a short hint per item ("beat 1", "every beat", "backbeat", "the &s").
  - The swing presets are a row of chips: Straight, Light, Medium, Triplet, Dotted.
  - Sticking keeps its current labels (Mode: natural / alternate / off, Lead hand).
  - Mix: one row per layer, with the label, slider, percent and a mute toggle button.
- **Notation card and editor:**
  - The notation area becomes a card (token border, radius and shadow) inside the middle column, with Play pinned at its top left as now.
  - The editor keeps its docked layout. Its header gains a collapse chevron, and `editorCollapsed` saves the state.
  - Opening an example shows the editor collapsed without changing the saved state.
- **Look picker:**
  - Appearance has a Look `Menu` (Studio, Warm, Bold, Score, Riso, Catalogue) and Mode as `Segmented` (Auto / Light / Dark).
  - Mode is disabled for a light-only look, with the hint "‹Look› is light only".

## Testing Decisions

- **One seam: the exercise core's public interface**, as before. For example:
  - "`withLook` to Score sets the theme to auto";
  - "`withLook` to Bold leaves the theme alone";
  - "`drawnMode` for Riso is light even with dark set and a dark device";
  - "`deviceSettingsFrom` drops an unknown look";
  - "a muted click schedules no click";
  - "the old settings migrate with the click and groove unmuted and the editor open".
- **Not tested automatically:**
  - The controls, header, panel, card and looks.
  - These are checked in the browser with real pointer events and the keyboard (Tab, arrows, Esc) at 1280 px and 390 × 844 (touch).
  - Every look is checked in each of its modes, and contrast is checked to AA in each.

## Out of Scope

- Changing the layout, sizes or spacing per look.
- Dark versions of Score, Riso or Catalogue.
- The canvas's rejected directions D (drum machine), F (neon) and H (terminal).
- A zoom setting for the notation, or changing how big the staff is drawn.
- The clean-tempo tracker, the practice log, and accounts and sync. These are deferred until the app has third-party users.

## Further Notes

- The tickets are in `issues/`.
- 01 (control kit) and 04 (notation card and editor) can start at once.
- 02 and 03 wait for 01.
- 05 (look engine) waits for 01. The other looks, 06 to 10, wait for 02–05.
