# 04: Swing written as triplets

**What to build:** With swing on, a beat whose only hits are the downbeat and the & is written as a triplet with the & on "let", in both rows and the groove (ADR 0006). With swing off, nothing changes. See [spec](../spec.md) stories 25–29.

**Blocked by:** None. Easiest after 02, since staff parts then have both rows.

**Status:** ready-for-agent

- [ ] Staff parts take whether swing is on (swing amount above 50%)
- [ ] With swing on, a sixteenth-grid beat whose sources only hit on the downbeat and the & is respelled on the triplet grid, with holds mapped to the nearest triplet position. Tested: the jazz ride's beat 2 is a triplet group (ride, rest, ride)
- [ ] If any source in a beat has an e or an a, that beat stays on sixteenths for every source. Tested
- [ ] Beats with only a downbeat, and beats entered on the triplet grid, are written as entered. Tested
- [ ] Swing off gives exactly the current notation. Tested
- [ ] The beat cards and playback are unchanged
- [ ] Checked by eye against the Groove Scribe screenshot (jazz ride, snare quarters, hi-hat foot on 2 & 4)
