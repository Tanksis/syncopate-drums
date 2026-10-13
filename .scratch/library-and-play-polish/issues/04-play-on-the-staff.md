# 04: Play on the staff (desktop)

**What to build:** On desktop, the header's Play becomes a round ▶/■ button pinned to the top left of the notation area, by bar 1. It stays visible as the staff scrolls. The phone keeps its bottom transport bar. See [spec](../spec.md) stories 11–12.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] The button plays from the count-in and stops, with the same title and keys as today's Play
- [x] It doesn't cover bar 1's number or its loop click, and it stays put while the notation scrolls
- [x] The header's Play is gone on desktop, and the header's narrower steps (`useHeaderRoom`) still fit
- [x] The phone layout is unchanged
- [x] Checked in the browser at 1280 px and in a narrow desktop window, light and dark

## Comments

- Done in the PR for `feature/04-play-on-the-staff`. The button sits in a gutter of its own (`pl-14` on the desktop notation area), so it never covers bar 1's number at any scale. With the header's Play gone, `useHeaderRoom`'s steps dropped by its 90 px, to 770 and 660. The browser check ran headless at 1280, 900, 760 and 660 px, light and dark, plus 390 × 844 for the phone.
