# Prototype: as written / as played (never merge)

**Question:** with swing, a pattern or the feet on, the staff shows the line as played, and the line as written (straight, the exercise alone) is gone. How should the app show both?

**Variants** (`?variant=`, Alt+←/→ or the pill at the bottom; open an example with a pattern, such as jazz comping):

- **A** (dropped in the first round): both staves on each line, always.
- **B**: an "As written" toggle adds the written staff under the played one, drawn small (70%, like an ossia), with the playhead on both.
- **C**: Written | Played switch, one staff at a time, each at its own height.
- **D**: a one-line written cue under the played staff, with its room always kept.
- **E**: Written | Played switch, each line kept at the taller version's height and the bars at the wider one's width, so switching moves nothing.

**Verdict (2026-10-19): E, on desktop and phone.** The user wants the notation never to shift. D's one-line cue confuses comping (snare and kick on one line). B was close but moves every line after the first. Then:

- The choice is remembered device-wide, and Played shows first.
- The sticking is printed in both views.
- The switch only shows when the line is played differently from how it is written.

Measured headlessly: switching in E moves no bar number, at 1440 × 900 and 390 × 844.

The spec is `.scratch/as-written/spec.md` on `main`.
