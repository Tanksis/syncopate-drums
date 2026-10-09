# 02: Beat card menu, with Tie over the barline

**What to build:** A ⋯ button on each beat card opens a menu: switch to triplets or sixteenths, rest the beat (both rows), and, on a bar's first beat other than the exercise's, "Tie over the barline". It replaces right-click for the grid switch. See [spec](../spec.md) stories 6–9.

**Blocked by:** 01

**Status:** done

- [x] Core: resting a given bar and beat rests both rows, as one undo step. Tested
- [x] Core: tie over the barline toggles the tie into a given bar's first beat. It's refused on the exercise's first beat, when that beat's downbeat has no hit, or when the previous beat ends in a rest. A function says whether a beat offers it. Tested
- [x] The ⋯ button sits in the beat card's header. The popover shows the item for the other grid, "Rest the beat", and the tie item (ticked when tied) only where the core offers it
- [x] The menu closes on a choice, `Esc`, or a click or tap outside, and doesn't keep the editor's keys afterwards
- [x] Right-click on a beat card no longer switches the grid
- [x] Hidden on an example
- [x] Checked in the browser with real mouse events at 1280 px: each item, including a tie over the barline that shows on the staff

**Decided while building:** a tie is stored per row, so the command is `tieOverBarline` with a bar and a row, and the menu shows one item per row the core offers it in ("Tie snare over the barline", "Tie kick over the barline"). A tie leaves a beat put on triplets on the triplet grid. The card's 16ths | trip switch stays beside the ⋯ button. The menu is a shared `Menu` component in `src/components/`, for ticket 04's bar menu to reuse.
