# Spec: Metronome

Status: ready-for-agent

Source: the user's request on 2026-10-15 and the mockup canvas https://claude.ai/artifact/83ojyveDbW8DpqS61M1yRj. The user picked **P4** (beat blocks and dial) with the **P5** Rhythm sheet for the phone, and **D1** for the desktop, with the labels under the blocks removed. Vocabulary follows [`CONTEXT.md`](../../CONTEXT.md); the decision is [ADR 0014](../../docs/adr/0014-metronome-is-its-own-screen.md).

## Problem Statement

The drummer practises with a separate metronome app (Pro Metronome) for anything that isn't an exercise: time signatures other than 4/4, subdivisions, accent patterns. Syncopate!'s click only plays inside an exercise, in 4/4, quarters, with beat 1 accented.

## Solution

A **Metronome** screen beside **Practice**, switched in the header on both phone and desktop.

- **Beat blocks:** one per beat. Tapping a block cycles its level: Accent, Normal, Soft, Off. A block's fill height shows the level. No labels under the blocks.
- **Dial:** a ring with a dot per beat and the BPM in the middle, in the app's sans-serif font, with the tempo name (Largo … Presto) under it. Dragging around the ring changes the BPM. While playing, the current beat's dot grows and takes its level's colour.
- **Controls:** − Play +, then Tap tempo and Sound.
- **Time signature and Subdivision:** two small labelled buttons at the top (phone) open the **Rhythm sheet**:
  - The time signature defaults to 4/4. A beats stepper sits on its left (1–16) and a note-value stepper on its right (2, 4, 8, 16).
  - Subdivision is a grid of 12 notation pictures: quarter, eighths, off-beat eighth (rest then eighth), dotted eighth and sixteenth, triplet, triplet with the first, middle or last rested, sixteenths, eighth and two sixteenths, two sixteenths and eighth, sixteenth-eighth-sixteenth.
- **Sound:** Beep, Wood block, Cowbell (generated), Hi-hat and Ride bell (the kit's samples), plus one volume for every click (ticket 07).
- **Desktop (D1):** the switch sits in the header's centre. The page shows the blocks over the dial and its controls, and a right panel holds the time signature steppers, the subdivision grid, the sound and the volume. Since ticket 08 the header is the same full-width one on both screens, the Library sidebar stays, and the settings sidebar swaps its top (Practice's groove and sticking, or the time signature and subdivision) over a Settings section that carries over (the mix, the metronome's sound and volume, the theme).

The metronome keeps its own BPM, and every setting is remembered on the device. Starting the metronome stops an exercise, and the other way round.

## User Stories

### Screen

1. As a drummer, I switch between Practice and Metronome in the header, on the phone and the desktop.
2. As a drummer, the app reopens on the screen I last used.
3. As a drummer, starting the metronome stops an exercise that is playing, and starting an exercise stops the metronome.
4. As a drummer, the metronome's BPM is its own; switching screens never changes my exercise's tempo.

### Playing

5. As a drummer, I press Play and hear one click per beat at the BPM, in the time signature.
6. As a drummer, beat 1 starts accented and the other beats normal; I tap a block to cycle it through Accent, Normal, Soft and Off, and hear the change on the next pass.
7. As a drummer, I pick a subdivision and hear it between the beats, the same low click as a Soft beat (ticket 07; it had its own volume before).
8. As a drummer, in 6/8 the BPM counts eighth notes and there are six blocks.
9. As a drummer, changing the time signature resets the blocks to beat 1 Accent and the rest Normal.
10. As a drummer, I change the BPM with − and +, by dragging around the dial, or by tapping Tap tempo; the change applies at once, while playing too.
11. As a drummer, I pick the click's sound and hear it at once.
12. As a drummer, the current beat lights up on its block and its dial dot, in time with what I hear.

### Phone

13. As a drummer, the Time signature and Subdivision buttons open the Rhythm sheet, and Done closes it.
14. As a drummer, the screen stays awake while the metronome plays.
15. As a drummer on an iPhone with the silent switch on, I still hear the metronome where the browser allows it.

### Desktop

16. As a drummer, Space plays and stops the metronome, − and + (and the arrow keys) change the BPM, and T taps the tempo.
17. As a drummer, the mouse wheel over the dial changes the BPM.

## Implementation Decisions

### Exercise core (the test seam)

- `src/core/metronome.ts`:
  - `MetronomeSettings`: `bpm` (20–300), `beats` (1–16), `noteValue` (2 | 4 | 8 | 16), `levels` (one `BeatLevel` per beat: `'accent' | 'normal' | 'soft' | 'off'`), `subdivision` (one of 12 ids), `sound`, `volume` (one for every click since ticket 07; it replaced `beatVolume` and `subdivisionVolume`).
  - Defaults: 92 BPM, 4/4, Accent-Soft-Soft-Soft (Accent-Normal-Normal-Normal before ticket 07), quarters, Wood block, the volume at its usual level.
  - `withTimeSignature(settings, beats, noteValue)` resets the levels (story 9).
  - `cycleLevel(level)`: Accent → Normal → Soft → Off → Accent.
  - The subdivision patterns as data: each id is a list of onsets within one beat as fractions (eighths `[0, 1/2]`, off-beat eighth `[1/2]`, dotted `[0, 3/4]`, triplet `[0, 1/3, 2/3]`, triplet first rested `[1/3, 2/3]` …). Onset 0 is the beat itself; the other onsets are subdivision clicks. A pattern whose first onset is rested still plays the beat (the beat block decides that).
  - `metronomeSchedule(settings, from, window)`: the same `ScheduleResult` shape as `schedule`, with `kind: 'click'` events carrying the beat level or `subdivision`, and `position` as bar and beat. The beat length is `60 / bpm` seconds whatever the note value (story 8). It loops forever.
  - `tapTempo(taps)`: the BPM from the last up to four intervals between tap times; undefined after one tap, or when the last gap is over 2 seconds (the taps restart).
  - `tempoName(bpm)`.
- `DeviceSettings` gains `screen: 'practice' | 'metronome'` and `metronome: MetronomeSettings`; `deviceSettingsFrom` fills and validates them (unknown sound or subdivision ids fall back to the default; levels are padded or cut to `beats`).

### App

- The engine plays whichever schedule it is given: `startPlayback` takes the source to schedule from (the exercise or the metronome), and the playhead reports the metronome's beat for the visuals. One engine, so starting one stops the other.
- Click voices: Beep (the existing synth), Wood block and Cowbell (synthesized), Hi-hat and Ride bell (existing samples). Accent is the loudest and high; Normal is the same high click, quieter; Soft is exactly a subdivision click, lower and quieter; Off is silent (ticket 07). They go through the click layer.
- Phone (`usePhoneWindow`): the header's centre is the Practice / Metronome switch on the Metronome screen. On Practice, the header stays as it is plus the switch; how they share the row is the builder's call within the header's existing space, checked at 390 px.
- Desktop: the switch in the header's centre. The Metronome page replaces the notation, editor and both sidebars while shown.
- Subdivision pictures are drawn with VexFlow, like the staff, without staff lines, so the glyphs match the notation.
- Wake Lock while the metronome plays, released on stop; `navigator.audioSession.type = 'playback'` where supported (iOS silent switch).

## Testing Decisions

- The core is unit-tested: `metronomeSchedule` (beat times at a BPM, time signatures including 6/8 and 7/8, each subdivision's onsets, levels including Off, a window that splits a beat, the loop over bars), `withTimeSignature`, `cycleLevel`, `tapTempo` and `deviceSettingsFrom` for the new fields.
- The screens are checked in the browser at 390 × 844 and 1280, light and dark, with real mouse events.
- The by-ear check (timing, sounds, levels) and the iPhone checks (screen awake, silent switch) are left to the user.

## Out of Scope

- Named presets (later).
- A different subdivision per beat, polyrhythms, tempo ramps, the gap click.
- Counting metronome time in the practice log.
- Time signatures on exercises.

## Further Notes

- The mockup's notation pictures were hand-drawn; the build draws them properly.
- The tempo names follow common metronome ranges: Largo under 60, Adagio under 76, Andante under 108, Moderato under 120, Allegro under 168, Presto above.
