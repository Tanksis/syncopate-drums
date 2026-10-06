# Alternate sticking and looping

Type: grilling
Status: resolved
Blocked by: (none)

## Question

How does alternate sticking behave when an exercise loops?

- With an odd number of notes, does alternation restart from the lead hand on each loop repeat, or carry on (so the hands flip every other pass)? If it carries on, what does the notation view print?
- When the loop range is narrowed to some bars, is sticking computed from the start of the exercise (as printed) or from the start of the loop range?
- Does natural sticking need any rule here? (Triplet runs alternate across bar lines; what happens at the loop seam?)

## Answer

Decided with the user in a grilling session (2026-10-06). The user accepted every recommendation.

**Principle: sticking is a property of the exercise, not of the playback pass.** It is computed once over the whole exercise and printed; what's printed is always what's played. The loop seam carries nothing.

- **Loop repeats (odd note count)**: every pass restarts as printed. With 7 notes under alternate sticking, lead R (`R L R L R L R`), the seam gives a double (R → R). To practise the other hand, flip the lead hand in the sidebar.
- **Narrowed loop range**: sticking stays as printed, computed from the start of the exercise. Clicking bar numbers never changes the R/L. Looping bars 3–4 jumps back to bar 3's printed hand.
- **Natural sticking**: no special rule. A triplet run crossing into the loop's first bar keeps its printed sticking (continuing from the bar before), even though that bar isn't played.
- Overrides follow automatically: they're on the printed notes, so they apply on every pass.
- **Out of scope**: a "swap hands each pass" practice option (lead hand flips at every repeat).
