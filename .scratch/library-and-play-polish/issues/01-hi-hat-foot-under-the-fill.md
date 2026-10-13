# 01: Hi-hat foot under the fill

**What to build:** The hi-hat foot setting no longer changes a bar's voicing. A fill such as `RLRK` stays one voice, with the foot under the fill's stems, or in a feet part of its own where it doesn't land on the fill's notes. See [spec](../spec.md) stories 8–10 and [ADR 0012](../../../docs/adr/0012-hi-hat-foot-ostinato-under-the-fill.md).

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Core: `RLRK` with the foot on quarters, On 1, 2 & 4 and &s is one voice, with the foot in the hands chords (tested)
- [ ] Core: a one-voice fill with a rest on beat 2 and the foot on quarters has a feet part of the foot alone, with the fill unchanged above it (tested)
- [ ] Core: grooves are written as before: the jazz groove with the setting on 2 & 4 matches the setting off, and a two-voice bar puts the foot in the feet part (tested)
- [ ] Checked in the browser at 1280 px
