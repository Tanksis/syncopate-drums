# 03: Precise volumes and swing

**What to build:** The `%` readouts next to the Click, Exercise and Groove volumes and Swing become fields you can type in, with arrow-key steps. Double-clicking a slider resets it. See [spec](../spec.md) stories 7–12.

**Blocked by:** None (can start immediately)

**Status:** done (merged in PR #69, 2026-10-12)

- [x] Core: `parsePercent(text, { min, max, previous })` accepts "85", "85%" and "66.7", clamps to the range, and gives back `previous` for empty or non-numeric text (tested)
- [x] Each readout is a small text field with `inputmode="decimal"`. Enter or blur commits, and Escape reverts. Volumes show whole percents and Swing one decimal
- [x] ↑/↓ step by 1 and Shift+↑/↓ by 10, clamped, and each step applies at once. After a commit the keyboard goes back to the editor
- [x] A double-click or double-tap resets a volume slider to 100% and the Swing slider to 50%, and the reset is saved
- [x] The phone sliders still drag as before
- [x] Checked in the browser with real keyboard and mouse at 1280 px, and with touch at 390 × 844

## Comments

- The fields and the double-tap helper live in `src/features/settings/PercentField.tsx` and `useDoubleTap.ts`. A double tap needs both releases within 350 ms and 12 px, so a drag followed by a tap elsewhere doesn't reset.
- A typed or stepped swing that shows as a preset (66.7% is triplet) snaps to that preset, so its button lights up.
- Volumes reset to their default in `DEFAULT_DEVICE_SETTINGS` (100%).
- On the phone the fields are 16 px (iOS zooms on focus below that) and a little wider. The sliders take `touch-manipulation`, so a double tap doesn't zoom.
- The fields are wider than the old readouts, so the desktop volume sliders lost about 12 px (about 53 px now).
- The browser check ran headless in Chromium: real keyboard and mouse at 1280 px in both themes, and CDP touch at 390 × 844. Checking it on the iPhone is left to the user.
