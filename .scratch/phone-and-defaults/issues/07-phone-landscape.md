# 07: The phone turned sideways

**Status:** needs-triage

**Reported:** 2026-10-15, by the user on their iPhone (Chrome): "the page really bugs out when I flip my phone sideways."

## What happens today

The layout is chosen by width alone: under 640 px is the phone layout (`PHONE` in `src/app/useMediaQuery.ts`, `PhoneLayout` in `App.tsx`). A phone turned sideways is about 750 × 340 in Chrome, so it's wider than 640 and gets the desktop layout, squeezed into 340 px of height. Checked headless at 750 × 340, 664 × 390 and 844 × 390:

- **The desktop layout on a phone.** It shows the Exercises and Settings rails, the desktop header with the BPM, the play button over the notation, and the docked editor with the numbered bar tabs and "✕ delete".
- **The notation is cut to a sliver.** Only about 100 px of it shows, the top of one staff.
- **The editor runs off the screen.** The docked editor takes the rest of the height, and its beat cards are cut off at the bottom.
- **The phone's controls are gone.** There's no transport bar, no Practice and Metronome tab bar, and no editor sheet. The Metronome screen can't be reached.
- **What you were doing is lost.** Turning back to portrait drops the open editor sheet, and you land on the Practice screen with the sheet closed.
- **Not accounted for (iPhone):** the notch and the home indicator sit at the sides in landscape (`env(safe-area-inset-left/right)`), and nothing pads for them.

## What to build

The approach is undecided; see the question below. The recommendation, to confirm with the user:

1. **Keep the phone layout when a phone is turned sideways.** Read a phone from its shorter side, or a short window with a coarse pointer, not from its width alone. A narrow desktop window keeps today's behaviour.
2. **A landscape arrangement of the phone layout:**
   - The notation gets the screen's width.
   - The transport bar and the tab bar stay, slimmed down to save height.
   - The editor sheet is taller in landscape (62% of 340 px is about 210 px, too short for the cards). It lays the four beat cards out in one row, with the bar row (undo, redo, the dots, the bin, ⋯, the tick) at its foot.
   - The pad goes on the side with the notch.
3. **Turning the phone keeps your place:** the screen you're on, the open sheet and the cursor bar.
4. **Mockup first,** as with the editor sheet: draw the landscape screens (Practice with the sheet closed and open, Metronome, the full-screen panels) and let the user pick before building.

## Question for the user

- **A.** Recommended: a landscape version of the phone layout, as above.
- **B.** A smaller fix: the phone layout as it is, letting the page scroll in landscape.
- **C.** A "turn your phone upright" notice. A web page can't lock the screen's orientation in Safari, or in Chrome on iOS.

## Done when

- [ ] Turning the phone in either direction, with the editor sheet open or closed, on Practice or Metronome, keeps you where you were. Nothing is cut off.
- [ ] Checked at 750 × 340 and 844 × 390 (landscape), and at 390 × 664 after turning back, in light and dark.
- [ ] A desktop window narrowed to 700 × 400 still gets the desktop layout.
