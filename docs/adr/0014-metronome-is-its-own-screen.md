# 14. The metronome is its own screen, with its own settings

Date: 2026-10-15

Status: accepted

The user wants a metronome like the Pro Metronome phone app: time signatures, subdivisions, beat blocks with levels, a visual pulse and a choice of sounds. It is mainly for the phone, with a place on the desktop too. Two ways were considered:

- **Grow the exercise's click** into the metronome: time signatures and subdivisions on the exercise's practice settings. Exercises are 4/4 throughout (`BEATS_PER_BAR` in the model, editor, speller, sticking and notation), so a time signature here means reworking all of them.
- **A separate screen**: Practice and Metronome, switched in the header. The metronome has its own settings and its own schedule, and the exercise's click stays as it is.

The separate screen was chosen. It gives the metronome any time signature without touching exercises, and keeps practising an exercise unchanged.

## Consequences

- The metronome's settings (BPM, time signature, subdivision, beat levels, sound, volumes) are device settings, remembered on the device, not part of any exercise, and not exported. Its BPM is its own; switching screens never changes an exercise's tempo.
- The core gains a metronome schedule beside the exercise schedule, with the same result shape, so the one playback engine plays either. Only one plays at a time: starting one stops the other.
- The screen shown is remembered, so the app reopens on the metronome if that was last used.
- "Mode" already means light or dark (ADR 0013), so the switch is between two **screens**, not modes.
- Exercises stay 4/4. A time signature on exercises remains possible later and would not change this.

## Amended 2026-10-15 (metronome ticket 08)

On the desktop, the two screens share one layout: a full-width header (the name, the switch in its centre, the settings button) that doesn't change between them, the Library sidebar, and the settings sidebar. Only the space between the sidebars and the top of the settings sidebar swap. Settings about how the app sounds and looks (the mix, the metronome's sound and volume, the theme) sit in a Settings section at the sidebar's foot on both screens. The exercise's name and transport moved from the header to a bar over the notation. The phone keeps its own layout.

## Amended 2026-10-17 (time signatures tickets 06 and 07)

The Settings section at the sidebar's foot is gone: on most laptop windows it left both it and the screen's own settings scrolling. The sidebar now holds only the screen's own settings. The mix is in a panel from a speaker in the header, shown on the Practice screen, and how the app looks is in a Preferences panel from a gear in the header, on both screens. The metronome's sound and volume, heard only on the Metronome screen, moved to that screen's own settings, under its subdivision. The phone keeps its own layout.
