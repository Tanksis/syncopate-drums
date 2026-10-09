# 02: Beat card menu, with Tie over the barline

**What to build:** A ⋯ button on each beat card opens a menu: switch to triplets or sixteenths, rest the beat (both rows), and, on a bar's first beat other than the exercise's, "Tie over the barline". It replaces right-click for the grid switch. See [spec](../spec.md) stories 6–9.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Core: resting a given bar and beat rests both rows, as one undo step. Tested
- [ ] Core: tie over the barline toggles the tie into a given bar's first beat. It's refused on the exercise's first beat, when that beat's downbeat has no hit, or when the previous beat ends in a rest. A function says whether a beat offers it. Tested
- [ ] The ⋯ button sits in the beat card's header. The popover shows the item for the other grid, "Rest the beat", and the tie item (ticked when tied) only where the core offers it
- [ ] The menu closes on a choice, `Esc`, or a click or tap outside, and doesn't keep the editor's keys afterwards
- [ ] Right-click on a beat card no longer switches the grid
- [ ] Hidden on an example
- [ ] Checked in the browser with real mouse events at 1280 px: each item, including a tie over the barline that shows on the staff
