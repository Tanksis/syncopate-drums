# 6. Swung eighths are written as triplets

Date: 2026-10-07

Status: accepted (reverses "showing swing in the notation" being out of scope in the [notation-and-entry spec](../../.scratch/notation-and-entry/spec.md), story 55)

The app wrote swing as plain eighths, as the *Syncopation* book and most jazz charts do. The swing mockup (branch `prototype/swing-notation`) tried a swing marking, swung noteheads and a timing lane, and none were wanted. After that, the user compared the jazz groove with Groove Scribe, which writes the ride as a quarter and then a triplet with its middle eighth a rest. They want that look: enter the line as the book prints it with swing off, then turn swing on and see the line the way it's played.

So when the **swing feel is on** (swing amount above 50%), the notation writes each sixteenth-grid beat whose only hits are the downbeat and the & (nothing on the e or the a) on the triplet grid. The & goes on the beat's last triplet position ("let"). This applies to both rows of the exercise and to the groove layer. A beat that is only a downbeat stays a quarter or eighth, as before. A beat with an e or an a is written as entered.

## Consequences

- This is notation only. The stored exercise and the beat cards are unchanged: the & stays on the sixteenth grid where it was entered. Playback still uses the swing amount, so at 66.7% what's written matches what's heard, and at other amounts the triplet is the nearest written form.
- With swing off, the notation is exactly as entered.
- A beat entered on the triplet grid is never swung, as before.
- Holds keep working through the rewrite. A note held to the end of a swung beat ends on the triplet's last position, or ties on as before.
