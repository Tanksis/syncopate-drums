# 04: Swing written as triplets

**What to build:** With swing on, a beat whose only hits are the downbeat and the & is written as a triplet with the & on "let", in both rows and the groove (ADR 0006). With swing off, nothing changes. See [spec](../spec.md) stories 25–29.

**Blocked by:** None. Easiest after 02, since staff parts then have both rows.

**Status:** done (merged in PR #34, 2026-10-08)

- [x] Staff parts take whether swing is on (swing amount above 50%)
- [x] With swing on, a sixteenth-grid beat whose sources only hit on the downbeat and the & is respelled on the triplet grid, with holds mapped to the nearest triplet position. Tested: the jazz ride's beat 2 is a triplet group (ride, rest, ride)
- [x] If any source in a beat has an e or an a, that beat stays on sixteenths for every source. Tested
- [x] Beats with only a downbeat, and beats entered on the triplet grid, are written as entered. Tested
- [x] Swing off gives exactly the current notation. Tested
- [x] The beat cards and playback are unchanged
- [x] Checked by eye against the Groove Scribe screenshot (jazz ride, snare quarters, hi-hat foot on 2 & 4), headless with real mouse clicks; accents are out of scope

## Comments

- Where the spec was silent: a note on a swung downbeat holds one triplet position where its part strikes on the let, so beat 2 reads chord, rest, ride as in Groove Scribe rather than a triplet quarter and eighth. A beat with an & and no downbeat is swung too. Both are recorded in ADR 0006.
- A part writes a swung beat as a triplet group only if it has a note off the downbeat there, so the hi-hat foot alone in the feet part stays a quarter.
- Drawing: a triplet group's beam now runs over a middle rest, and the sticking row moves below the feet part's triplet bracket, which used to collide with it. Both changes also apply with swing off, to triplets entered by hand.
- The by-ear check is left to the user (playback is unchanged).
