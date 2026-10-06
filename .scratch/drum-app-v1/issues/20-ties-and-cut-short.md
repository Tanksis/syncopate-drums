# 20: Ties and cut short

**What to build:** T toggles a tie into the current beat. That lets the drummer enter quarters, dotted quarters, syncopated quarters and notes held across a bar line. A tie is allowed only when the beat starts with a hit and the previous beat ends with a note. A tied-into beat shows ⌒ on its beat box and a drawn tie in the notation, and the tied continuation isn't struck. Typing a new figure keeps the tie if the new figure starts with a hit.

`.` toggles "cut short" on the current beat: its last note ends early, with a rest after it. Typing a new figure clears cut short. The speller merges held notes into dotted values where legal.

See [spec.md](../spec.md): Ties and the auto-speller, including the exact cut-short lengths.

**Blocked by:** 19 (Triplet beat figures)

**Status:** ready-for-agent

- [ ] T toggles the tie with the legality rules (no tie from a rest; the exercise's last note can't be tied forward). Ties may cross bar lines and triplet beats
- [ ] Re-entering a figure keeps the tie if the figure starts with a hit; entering a figure clears cut short
- [ ] Cut short ends the last note at an eighth if it starts on 1 or & of a straight beat, at a sixteenth otherwise, and at one triplet eighth in a triplet beat, with a rest after it
- [ ] The speller merges held notes into dotted values where legal (`q~e` → `q.`); e.g. four figures with a tie into beat 3 spell as `♩ ♪ ♩. ♪` (tested)
- [ ] Round-trip tests cover all 22 figures with tie/cut combinations, including ties across bar lines and triplet beats
- [ ] The beat strip shows ⌒ on tied-into beats; the notation draws ties and dots
- [ ] `schedule` doesn't strike tied continuations (tested)
