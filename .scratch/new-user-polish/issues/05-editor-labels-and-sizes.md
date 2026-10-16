# 05: Snare and Kick labels, and bigger editor controls on desktop

**What to build:** Findings 4 and 5. `BeatStrip` gets a label column: **Snare** and **Kick**, the kick's in `text-kick`, so the colour explains itself. Use single letters on a phone if the words cost a beat card's width. On desktop (`sm` and up), the 16ths/trip switch, the beat ⋯ button and the editor's undo/redo grow to hit areas at least 32 px high. See [spec](../spec.md), stories 8–9.

**Blocked by:** none

**Status:** wontfix

- [ ] Row labels on both rows, in desktop and the phone sheet; the kick label in the kick colour
- [ ] The beat cards still fit four per bar at 1280 with both sidebars open
- [ ] Desktop hit areas ≥ 32 px high for the switch, the ⋯ and undo/redo; phone sizes unchanged
- [ ] Checked in light and dark, Warm and Studio

## Comments

- 2026-10-16: The user wants to see this mocked or prototyped before agreeing to it. It waits for the `prototype/new-user-polish` verdict.
- 2026-10-16: Prototype verdict (`prototype/new-user-polish`, commit 53472b9): keep today's rows with no Snare/Kick labels (over a label column, a legend and inline S/K), and today's control sizes. Nothing to build.
