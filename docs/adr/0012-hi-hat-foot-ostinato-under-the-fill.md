# 12. Notation: the hi-hat foot setting is written under the fill

Date: 2026-10-13

Status: accepted (refines [ADR 0004](0004-one-voice-when-feet-play-with-hands.md) and [ADR 0011](0011-linear-fills-in-one-voice.md)), narrowed 2026-10-17: once patterns lost their own hi-hat foot ([ADR 0010](0010-hi-hat-foot-is-a-practice-setting.md)'s note), the jazz ride's 2 & 4 became the setting. So that a jazz groove keeps the voicing it had, the setting is an ostinato kept out of the voicing only with no pattern on. Under a pattern it counts like the groove's other hits, as the jazz preset's own foot did.

The hi-hat foot setting ([ADR 0010](0010-hi-hat-foot-is-a-practice-setting.md)) shipped with its hits counted like any other foot hit when a bar picks its voicing. Under a linear fill such as `RLRK` that turned every bar from one voice into two. The kicks dropped into the feet part beside the hi-hat foot and read as dotted-eighth-and-sixteenth rhythms, so the drummer read two rhythms where they play one fill. The user found it much harder to read. Under a groove the foot looked right, because it lands on the ride or hi-hat's stems.

Weinberg's guidelines (quoted in ADR 0004) write an ostinato under a freer figure in two voices, with the figure kept intact above it. The hi-hat foot setting is that ostinato.

So the setting's hits no longer take part in choosing the voicing:

1. Each bar picks one voice or two from the exercise's rows and the groove preset's hits only, by ADR 0004 and 0011, as if the setting were off. A preset's own hi-hat foot, which is part of the groove, still counts, even when the setting replaces it (so the jazz groove picks the same voicing whatever the setting).
2. The setting's hits then go where they're clearest:
   - In a bar of one voice, or of the hands alone, if every one of them lands on a struck chord of the hands part, as heard (a foot on the & of a triplet beat lands on none), they join those chords.
   - Otherwise, in a bar of one voice or of the hands alone, the bar gets a feet part holding only the setting's hits, stems down with their rests. The fill stays as it was above it.
   - In a bar of two voices, they join the feet part as before.

## Consequences

- `RLRK` with the foot on quarters, On 1, 2 & 4 or the &s stays one voice, with the foot under the fill's stems.
- A fill that rests on beat 2, with the foot on quarters, gets a feet part of the foot alone under the one-voice fill.
- Grooves look as they did. A jazz groove with the setting on quarters hangs the foot on the ride's stems, as with its own 2 & 4.
