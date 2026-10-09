# 03: Precise volumes and swing

**What to build:** The `%` readouts next to the Click, Exercise and Groove volumes and Swing become fields you can type in, with arrow-key steps. Double-clicking a slider resets it. See [spec](../spec.md) stories 7–12.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Core: `parsePercent(text, { min, max, previous })` accepts "85", "85%" and "66.7", clamps to the range, and gives back `previous` for empty or non-numeric text (tested)
- [ ] Each readout is a small text field with `inputmode="decimal"`. Enter or blur commits, and Escape reverts. Volumes show whole percents and Swing one decimal
- [ ] ↑/↓ step by 1 and Shift+↑/↓ by 10, clamped, and each step applies at once. After a commit the keyboard goes back to the editor
- [ ] A double-click or double-tap resets a volume slider to 100% and the Swing slider to 50%, and the reset is saved
- [ ] The phone sliders still drag as before
- [ ] Checked in the browser with real keyboard and mouse at 1280 px, and with touch at 390 × 844
