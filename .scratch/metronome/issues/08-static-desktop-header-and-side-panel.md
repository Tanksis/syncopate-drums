# 08: A static desktop header, and a side panel whose Settings carry over

**What to build:** The user's feedback after ticket 05 (2026-10-15): the Practice / Metronome switch "is placed in a really awkward place"; switching from Practice with both sidebars open to the Metronome makes "the side bars randomly disappear, shifting everything"; the Metronome's right panel is a different size from the Settings sidebar. They liked the Metronome page's full-width header: "having the navbar be 'static' so it's more consistent when transitioning."

The user picked mockup **S3** on https://claude.ai/artifact/83ojyveDbW8DpqS61M1yRj (row "Static desktop header"), from their own proposal: settings about how the app sounds and looks carry over between the screens, and only the screen's own settings swap.

- **Header**, the same on both screens and across the whole window: the wordmark on the left, the screen switch in the centre, the side panel button on the right. Nothing in it changes when the screen switches.
- **Practice:** the exercise's name and its transport (Loop, Count-in, the BPM slider, − BPM +) move to a strip above the notation card. The strip steps its controls down by its own width, as the header did.
- **Library sidebar:** stays on both screens, in the same place and state.
- **Right side panel** (250 px, one open/rail state for both screens):
  - Top, swapping: on Practice, Playback (when the strip is too narrow for it), Groove and Sticking; on the Metronome, Time signature and Subdivision.
  - Bottom, the same on both: **Settings**, holding Mix (Click, Exercise, Groove), Metronome (Sound, Volume) and Appearance (Theme, Mode). It is pinned to the panel's foot, and collapses with a downward arrow (remembered per device), as the sidebars collapse with theirs.
- The Metronome page's own `w-80` panel goes.
- The phone layout (portrait and sideways) is unchanged.

**Blocked by:** 07 (the single Volume)

**Status:** done

- [x] One full-width header on both desktop screens: wordmark, centred switch, panel button
- [x] The exercise strip above the notation, with its controls stepping by width
- [x] The Library sidebar stays when switching screens
- [x] The right panel swaps its top half and keeps Settings below, at the same width and state on both screens
- [x] Settings collapses with a down arrow, remembered per device
- [x] Checked at 1280 px with the sidebars open and as rails, at 1000 px and below (overlays), in light and dark, in Warm and Studio
- [x] The phone layout is unchanged

## Comments

- Built 2026-10-15. The exercise bar's steps are now 780 / 662 px (measured: Warm needs 777, Studio 772; the slider 118), so at 1280 px with both sidebars open the whole transport shows.
- The Settings section is capped at 55% of the sidebar and scrolls past that, so a short window leaves the screen's own settings room; folding it gives them all of it.
- Opening an exercise from the Library while the Metronome shows switches to Practice (on the phone too), so the exercise is seen.
- The Playback group's Loop chip and Count-in now wrap, since together they're wider than the sidebar (this clipped before too).
