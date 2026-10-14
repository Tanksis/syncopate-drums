# 04: Notation card and collapsible editor

**What to build:**
- The notation area becomes a card in the middle column, with Play pinned at its top left.
- The grid editor stays docked as now, and gains a chevron that collapses it to its header.
- The collapse is remembered per device, and an example opens with the editor collapsed.
- See [spec](../spec.md) stories 13–16.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Core: `editorCollapsed` device setting (default off), with a test that old settings load with it off
- [x] The card uses tokens for border, radius and shadow, so looks restyle it later
- [x] The notation's fit (`notationFit`) measures the card's inner width
- [x] Collapsing gives the notation the freed height
- [x] Opening an example shows the editor collapsed without changing the saved setting
- [x] Phone layout unchanged
- [x] Checked in the browser at 1280 px and 760 px, light and dark
