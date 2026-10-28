# 09: The roll rudiments (4-15)

**What to build:** Add rudiments 4-15: multiple bounce roll, triple stroke roll, double stroke open roll, and the five- to seventeen-stroke rolls. They use doubles with accented releases as the PAS chart does, the triple stroke roll in 8th triplets. It also adds 35, the single dragadiddle, left from ticket 07: its drag is a double on the note's own hand (`RR L R R`, accented on the first). With them all 40 are in, and none is "coming soon". See [spec](../spec.md), story 12.

**Blocked by:** 04, 08

**Status:** done

- [x] The twelve, unit-tested like 04's
- [x] No rudiment is "coming soon"; the "coming soon" code removed
- [x] Each checked in a close-up screenshot

## Comments

- 2026-10-28: Done. Notes:
  - The text form gained the roll strokes, after the accent and before the grace hands: `/` a double, `z` a buzz.
  - The stroke rolls' doubles are slashed eighths (two sixteenths each), the release accented: on the beat for the five, nine, thirteen and seventeen, on its & for the eleven and fifteen. Those with an odd number of doubles (5, 7, 11, 15) alternate, so take two cycles; the rest repeat from the right. Each is in the meter its cycle fills: the nine, ten and eleven in 3/4, the seventeen in two bars of 3/4 with a beat's rest (eight doubles and the release are five beats).
  - The triple stroke and seven stroke rolls are in triplet eighths, as the singles four and seven are: the chart's sixteenth triplets.
  - The multiple bounce roll is buzzed sixteenths, and the double stroke open roll slashed eighths throughout.
  - The single dragadiddle is the paradiddle with its first sixteenth an accented double: `>/RLRR >/LRLL`.
  - The family headings now count their rudiments, not "N / M built".
