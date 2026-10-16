# 15. Compound time is the triplet grid, written in eighths

Date: 2026-10-16

Status: accepted

Exercises can be in 6/8 and 12/8 as well as 4/4, 3/4 and 2/4 (the `time-signatures` spec). A compound beat is a dotted quarter of three eighths, and it is counted and clicked in dotted quarters. Two ways to model it were considered:

- **A grid of its own**: three eighths or six sixteenths to the beat, with its own beat figures in the speller and its own notation path.
- **The triplet grid**: a beat stays `TICKS_PER_BEAT` (12) ticks long, and its three eighths fall on the triplet grid's ticks 0, 4 and 8. Only the editor and the notation know the beat is compound.

The user chose the triplet grid on 2026-10-16. Playback, the speller, sticking and the schedule already handle a triplet beat, and as the BPM counts the beat, a 6/8 bar at 60 sounds exactly like a 2/4 bar of triplets at 60. What changes is only how it reads.

## Consequences

- In compound time every beat is on the triplet grid. Its card has no 16ths | trip switch, and a pattern fill lays its steps on the eighths.
- The notation writes each value half as long again, with no "3": a triplet eighth is an eighth, a triplet quarter a quarter, and a whole beat a dotted quarter. The beams go by the dotted quarter, and a note held past a beat is cut at the beat line and tied, so no value crosses it.
- Nothing is swung in compound time. Its eighths are already a long-short feel, and notated triplets were never swung ([ADR 0006](0006-swing-written-as-triplets.md)).
- Moving between simple and compound time keeps each beat's downbeat and clears the rest of the beat, as a grid switch does.
- There are no sixteenths inside a compound beat. Adding them would need the grid of its own after all.
