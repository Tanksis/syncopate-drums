# 7. New exercises start straight

Date: 2026-10-08

Status: accepted (reverses the v1 default of 66.7% swing in the [drum-app-v1 spec](../../.scratch/drum-app-v1/spec.md), story 12)

v1 started every exercise at 66.7% swing, since most *Syncopation* practice is over a jazz feel. With [ADR 0006](0006-swing-written-as-triplets.md), swing on also changes the notation: a beat of downbeat-and-& is written as a triplet. A new exercise then showed any & as a triplet, with no groove on, before the user had checked the line against the book. That is the opposite of ADR 0006's workflow: enter the line straight, then turn swing on.

So new exercises start at 50% (straight). Picking a jazz groove preset on a straight exercise turns swing to 66.7%, because a jazz ride is never played straight and the user would otherwise need a second step. Picking a jazz preset leaves any other swing amount alone, and the other presets never change swing.

## Consequences

- Stored exercises keep their swing; there is no migration.
- The notation of a new exercise is the book's until the user picks a feel or a jazz groove.
- Swing is the one practice setting a groove choice can change, and only from straight.
