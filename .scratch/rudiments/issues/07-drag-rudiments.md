# 07: The drag rudiments (31-40)

**What to build:** Add rudiments 31-40: drag, single and double drag tap, Lesson 25, single dragadiddle, drag paradiddle #1 and #2, and the single, double and triple ratamacue. See [spec](../spec.md), story 12.

**Blocked by:** 04, 05

**Status:** done

- [x] Nine of the ten, unit-tested like 04's; the single dragadiddle moved to 09 (see Comments)
- [x] The Drags rows are no longer "coming soon", but for the single dragadiddle
- [x] Each checked in a close-up screenshot

## Comments

- 2026-10-28: Done, from the Vic Firth 40 rudiments sheet (the PAS chart's notation). Notes:
  - **The single dragadiddle waits for the roll strokes.** On the chart its drag is a double stroke of the note's own hand, one slash on the stem (`RR L R R`), not grace notes of the other hand. So it stays "coming soon" and moves to ticket 09, after 08 adds the double.
  - The text form gained `~`: first in a beat, it ties the hit before into that beat (`setBeat` reads a leading `~` the same way, never tying on from a rest). The double drag tap needs it. That rudiment is a dotted eighth, a sixteenth and an eighth, in 6/8 on the chart. It's written in 3/4 sixteenths, as the flam drag is, so the second half's dotted eighth is tied over beat 3. Drag paradiddle #1 (an eighth and four sixteenths, 6/8 on the chart) is in 3/4 sixteenths too.
  - The ratamacues' sixteenth triplets are in triplet eighths, so every note is twice as long, as in the single stroke four: the single is one bar of 4/4, the double two bars of 3/4, and the triple two bars of 4/4.
  - The drag is in alternating quarters without accents, as charted. Drag paradiddle #2 has its one accent on the first note, as the chart shows; some descriptions accent the second note too.
