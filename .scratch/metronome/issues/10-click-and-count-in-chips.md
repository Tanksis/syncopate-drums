# 10: Click and Count-in as matching toggle chips, and no BPM slider

**What to build:** The user's feedback after ticket 09 (2026-10-15): they thought the Count-in switch next to the speaker icon was the mute ("i thought the toggle next to the icon was for muting, confused me. That section is getting confusing"), and "I also thought the bpm bar was the volume bar." They picked option **A, Toggle chips**, from the mockups at https://claude.ai/artifact/Pk6QVovyqHeoB63akowFxZ ("A looks good").

The ideas behind it, from the research on that page: DAWs (Logic Pro, MuseScore) put the metronome and the count-in side by side as the *same kind* of toggle, lit when on, and use a metronome icon rather than a speaker (a speaker means volume). None of them has a tempo slider with no label in the bar.

- **Click chip**, in place of ticket 09's speaker button. It's a pill like the Loop chip (`h-8 rounded-full`), using the app's `MetronomeIcon` and the word **Click**.
  - On: accent tint, an accent border and accent text.
  - Off: the metronome icon crossed out and **Click off**, with a dashed border in mute grey.
  - It is the same `clickMuted` setting (the chip is pressed when the click plays), and the count-in still clicks when it's off (ticket 09's `clickHeard`).
- **Count-in chip**, in place of the `Switch`: the same chip style, with a tick and **Count-in**, filled when on and dashed when off. `CountInToggle` is shared, so it changes in all three places it shows: the exercise bar, the Settings sidebar's Playback group and the top of the phone's settings.
- **Order in the exercise bar:** name, then `− [80 BPM] +`, a divider, `[Click] [Count-in]`, a divider, and `[Loop · All bars]`.
- **No BPM slider** in the exercise bar.
  - The BPM box changes the tempo by a drag up or down (`ns-resize` cursor) and by the mouse wheel. Reuse `wheelSteps` from `src/core/metronome.ts`, as the Metronome's `Dial.tsx` does.
  - Typing and − / + stay as they are.
  - `TransportRoom` loses `withoutSlider` and keeps `full` and `compact`. Re-measure `EXERCISE_BAR_WIDTH` (the ticket 09 values are 788 / 702) with the scratchpad's `measure.cjs` in both looks.
- **Phone transport bar:** the Click toggle is a 52×48 tile with the metronome icon over the word **Click**, or the crossed icon over **Off**. It is styled like the chip (tinted and solid when on, dashed when off) and sits between the tempo and Edit/Copy.
- **Unchanged:** Mix's Click row keeps its speaker mute (it's a volume row), and the Metronome screen.

**Blocked by:** none

**Status:** done

- [x] Click and Count-in are matching chips in the exercise bar and the Playback group; Count-in is a chip in the phone's settings too
- [x] The Click chip and Mix's Click mute stay in step, and the count-in still clicks with the click off
- [x] No BPM slider; the BPM box takes a drag and the wheel
- [x] The phone's transport bar has the Click tile, in portrait and sideways
- [x] The bar's widths re-measured in Warm and Studio; checked at 1280 px with the sidebars open, 1100 px, a phone and a phone sideways, in light and dark

## Comments

- 2026-10-15: Built. The exercise bar needs 778 px with the click off (Warm; Studio 773), down from 788, so its two looks are now `full` and `compact`. The BPM box moves a BPM per 4 px of drag and per wheel notch, saved once it stops; a press without a drag still types. Checked headless at 1400 and 1280 with the sidebars open, 1100, a phone and a phone sideways, in light and dark: the Click chip and Mix's Click mute stay in step.
