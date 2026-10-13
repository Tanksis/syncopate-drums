# 11. Notation: linear fills in one voice

Date: 2026-10-13

Status: accepted (refines [ADR 0004](0004-one-voice-when-feet-play-with-hands.md))

After pattern fills shipped, the user filled bars with `RLKK` and with `RLK` on triplets. ADR 0004 wrote them in two voices, since the kicks play without the hands: the snare stems up, the kicks stems down with their own rests. Each snare note held until the snare's next hit, so `RLKK` read as a sixteenth and a dotted eighth over two sixteenth kicks, and `RLK` as a triplet eighth and quarter. The user asked for running sixteenths (and triplet eighths) on one set of stems, as kick fills are printed. Under the hi-hat eighths groove the same fill came out right, because the hi-hat put a hand on every kick.

Weinberg's guidelines (quoted in ADR 0004) already say fills are best in one voice. A linear fill, where no two limbs strike together, is the clearest case: the feet have no rhythm of their own to show, and a second voice only splits one stream of notes in two.

So a bar is also one voice when the hands and the feet both play in it and **no** foot hit lands with a hand hit. A bar where some feet play with the hands and some don't (a kick ostinato under a figure, a fill under a jazz ride and its hi-hat foot) stays two voices.

## Consequences

- A bar of snare and kick that never strike together is one voice, even where the kick keeps time, such as quarters under off-beat snares. Groove Scribe writes those in one voice too.
- A kick row alone, with no hands in the bar, stays in the feet part as before.
