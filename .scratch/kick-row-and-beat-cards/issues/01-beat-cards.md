# 01: Beat cards

**What to build:** Replace the beat strip's small boxes with beat cards (variant B of `prototype/editor-panel`), for the snare row only. Each card shows the beat number large in its corner, a labelled 16ths | trip switch, and big cells with count labels underneath. Each bar gets a header with its number and a visible delete. Bars are laid out one per row. No model change. See [spec](../spec.md) stories 1–10.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] Each beat is a card: the beat number large in its corner, a 16ths | trip segmented switch (right-click still switches), cells about 40px tall, and count labels (1 e & a / 1 trip let) with the beat number in bold
- [x] Cells show a filled hit, a hold bar (running on across card and bar edges when tied), or a faint ghost hit on hover
- [x] Each bar has a header with its number and an always-visible delete; there's one bar per row and the cards share the width
- [x] The cursor card is outlined; loop-range and selected bars are shaded as now; the ⌒ mark and the figure keycap show on the card
- [x] Click toggles a hit, and drag sets a hold across cards and bars, one undo step each, as now
- [x] `keepFocus` is on every control, so the keyboard and vim flow don't regress
- [x] Checked in the browser with real mouse clicks and drags, at full width and at about 1100px
