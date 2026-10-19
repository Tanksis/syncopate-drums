# 16. The line as written or as played, one staff at a time, at a fixed height

Date: 2026-10-19

Status: accepted

With swing, a pattern or the feet on, the notation shows an exercise **as played**: swung onto the triplet grid ([ADR 0006](0006-swing-written-as-triplets.md)), with the groove layer and the feet. The line **as written**, the exercise alone and straight as it is on the page, is gone. A drummer reading a book's line (Syncopation, p. 34) wants to read it as the page has it and hear it as played. Five ways to show both were prototyped (branch `prototype/as-written`, never merged):

- **Both staves always**: a written staff above the played one on every line. This doubles the height, so a laptop shows one pair at a time.
- **A toggle that adds a staff**: "As written" adds a written staff, drawn small, under the played one, with the playhead on both. It came close, but every line after the first moves down when it is turned on.
- **A one-line cue**: the written rhythm on one line under the played staff, with its room always kept. Nothing moves, but snare and kick share the line, which confuses comping.
- **A switch**: Written | Played, one staff at a time, each at its own height. Switching moves every line.
- **A switch at a fixed height**: as above, but each line is laid out to fit either version. It takes the taller one's height and the wider bar width, so switching moves nothing.

The user chose the switch at a fixed height on 2026-10-19, for the desktop and the phone. The notation should never shift under the drummer's eyes.

## Consequences

- The notation lays each line out for both versions, even while only one is drawn. The written version alone leaves some space, because the line is sized for the played one with its triplets and feet.
- The choice is a device setting, so one choice reads a whole folder of book lines. It starts on Played: what you see is what you hear.
- The switch shows only when the exercise is played differently from how it is written: swing, a pattern or a foot is on.
- The sticking belongs to the exercise's notes, which both versions have, so it is printed in either one.
- In the written version, the playhead marks the moment being heard. A hit the written line has no note for (a ride, a foot) is placed between the written notes around it, in proportion.
