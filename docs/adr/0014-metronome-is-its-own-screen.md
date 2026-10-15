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
