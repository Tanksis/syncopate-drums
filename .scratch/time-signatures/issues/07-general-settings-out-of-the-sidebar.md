# 07: General settings out of the settings sidebar

**What's wrong:** On the desktop, the settings sidebar's General section (Mix, Metronome sound and volume, Appearance) took up to 55% of the sidebar, so on most laptop windows both it and the Practice settings above it scrolled. The user asked (2026-10-17) for the general settings to have a place of their own.

**Blocked by:** none

**Status:** done

- [x] Appearance (Theme, Mode, Notation, Beat count) in a Preferences panel, from a gear in the header, on both screens
- [x] Mix (Click, Exercise, Groove) in a Mix panel, from a speaker in the header, on the Practice screen
- [x] The metronome's Sound and Volume in the Metronome screen's own settings, under its subdivision
- [x] The settings sidebar holds only the screen's own settings; the stored General fold is dropped
- [x] Checked in the browser with real mouse events

## Comments

Decided with the user on 2026-10-17, after looking at how similar apps split this: an inspector-style panel for what's being edited (MuseScore's Properties, Figma's right panel, a DAW's inspector), preferences behind a gear (MuseScore's Preferences, Ableton's, VS Code's), and the volumes one click away, as a player's speaker or a DAW's mixer.

Choices made where the conversation was silent:

- **Panels, not dialogs.** `Popover` (in `src/components`) is a non-modal panel hanging from its button, so a change of theme or volume shows at once behind it. It closes on its button, Esc, a click outside, Tab leaving it, or a resize. It's a `dialog` element, so a `Menu` inside it (the Theme select) opens in it and a click there doesn't close the panel.
- **Mix in the header, not on the exercise's bar.** A speaker after the tempo cost the bar 40 px, which at 1280 wide with both sidebars open pushed the Click, Count-in and loop chips into the sidebar and brought its scrollbar back. In the header it's left of Help, so the other buttons keep their place when the Metronome screen hides it. Its speaker is crossed out while any layer is muted.
- **The metronome's sound and volume belong to the Metronome screen.** The exercise's click is a fixed beep at the Mix's Click volume, and the metronome's sound and volume are heard only on the Metronome screen, so they moved to its sidebar, under a Sound heading.
- **The phone is unchanged:** its full-screen settings already split into Groove, Sticking, Mix and Theme tabs.
- **`settingsSectionOpen`** (the stored General fold) is gone from the device settings; a stored one is dropped on load, as any unknown key is.
