# 06: The empty-staff hint off the lines, and short exercises drawn larger

**What to build:** Findings 6 and 10. The empty-staff hint moves into the paper's space above the first staff instead of over its lines. On desktop, when every line fits the card with room to spare, `notationFit` scales the staff up, capped at 1.4, so a one- or two-bar exercise isn't a thin strip in a big card. See [spec](../spec.md), stories 10–11.

**Blocked by:** none

**Status:** ready-for-agent

- [ ] The hint sits above the staff, still pointer-transparent, in both looks
- [ ] `notationFit` scales above 1 only on desktop, only when everything fits, and never past 1.4 (unit-tested)
- [ ] Playback following, bar-number clicks and hand clicks still land on the scaled staff (real mouse)
- [ ] Checked with 1, 2, 4 and 8 bars at 1280 and 1440, and unchanged on a phone
