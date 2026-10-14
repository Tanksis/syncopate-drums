# 02: Desktop header

**What to build:**
- The desktop header carries, in this order:
  - tempo as − / BPM field / + with a slider;
  - a Count-in switch;
  - a "Loop · All bars" chip (clicking it clears a loop);
  - a button that shows or hides Settings.
- Play stays on the staff.
- See [spec](../spec.md) stories 5–7 and the canvas's Studio board.

**Blocked by:** 01

**Status:** done

- [x] − and + step the BPM as the phone's do (hold to repeat), and the slider and the field stay in step
- [x] The loop chip reads "Loop · All bars" or "Loop · Bars 2–3", and clicking it clears the loop
- [x] The Settings button shows whether the settings sidebar is open, and opens or closes it
- [x] `useHeaderRoom` and `HEADER_WIDTH` re-measured, so narrow windows still drop the slider first
- [x] The phone's `TransportBar` is unchanged apart from the kit's controls
- [x] Checked in the browser at 1440, 1280, 900 and 760 px
