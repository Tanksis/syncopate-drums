# 06: The empty-exercise hint in the editor, and short exercises drawn larger

**What to build:** Findings 6 and 10, as `?hint=editor` and `?fit=grow` with `?fit=centre` on `prototype/new-user-polish`.

- **Hint:** the empty-staff hint leaves the staff. While an ordinary exercise has no hits, a tinted line at the top of the grid editor reads "↓ Click a square to add a hit: the top row is the snare, the bottom row the kick." (on a phone, "Tap"). It goes once there's a hit, and never shows on an example.
- **Fit:** on desktop, a short exercise grows to fill the notation card. `notationFit` may scale above today's 1.6 cap, up to 2.4, and break onto more lines to do it, balancing them (4 bars as 2 + 2, not 3 + 1). Whatever room is left, the staff is centred in the card, top to bottom.
- **Switch:** a **Fit notation to the card** switch in General › Appearance (on by default, on this device) turns the growing off, back to today's sizes. A zoom control is not part of this ticket.

The phone is unchanged. See [spec](../spec.md), stories 10–11.

**Blocked by:** 02

**Status:** done

- [x] The hint in the editor in both looks, on desktop and in the phone's edit sheet; gone after the first hit; none on an example
- [x] `notationFit` grows past 1.6 and onto more, balanced lines only when asked to, on desktop, never past 2.4 (unit-tested)
- [x] The staff is centred vertically in the card
- [x] `DeviceSettings.fitNotation` (default on), validated, with tests; the switch in General › Appearance
- [x] Playback following, bar-number clicks and hand clicks still land on the scaled staff (real mouse)
- [x] Checked with 1, 2, 4 and 8 bars at 1280, 1440 and 1920, and unchanged on a phone

## Comments

- 2026-10-16: The user wants to see this mocked or prototyped before agreeing to it. It waits for the `prototype/new-user-polish` verdict.
- 2026-10-16: Prototype verdict (`prototype/new-user-polish`, commit 53472b9): the hint in the editor (over above the staff), and growing plus centring (over the card hugging the staff). The user wondered about a zoom option, or growing being optional but on by default; this ticket takes the second, as a switch.
- 2026-10-16: Built (`feature/06-notation-fits`). Lines are balanced only when the exercise actually grows, so a long one keeps today's lines with the switch on. With the editor collapsed, an empty exercise shows no hint, since the hint lives in the editor. Light/dark checked headlessly in Warm; Studio uses the same `accent-tint` token, not separately screenshotted.
