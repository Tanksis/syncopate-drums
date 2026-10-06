# Grid editor interaction

Type: prototype
Status: resolved
Blocked by: 03

## Question

How should the **grid editor** feel for entering a *Syncopation* line fast on a laptop? A rough throwaway UI that answers:

- How the grid switches between a sixteenth grid and a triplet grid (per beat? per bar?) and how quarters, dotted notes and ties are entered on it.
- Mouse vs. keyboard entry (can a whole line be typed?), adding/removing bars, copying a bar.
- How sticking overrides are set on a note.
- How the notation view mirrors edits live.

Decide the interaction model with the user by trying it on real lines from the book.

## Answer

Decided with the user after trying the [prototype](../prototypes/05-grid-editor/index.html) (2026-10-05). The user liked all three variants at first, then chose **C (beat figures) as the only editor**.

- **Entry is by beat figure, one beat at a time.** The user picks a **beat figure** for the current beat from a palette, and the selection moves to the next beat on its own, so a bar takes four keystrokes. There's no step grid (A) and no typed line (B) in v1.
- **Each figure carries its own subdivision.** Straight figures sit on a sixteenth grid and triplet figures on a triplet grid, so the question of switching the grid per beat or per bar doesn't come up.
- **Notes longer than a beat** come from a tie into the beat: the previous note holds through the figure's first note (prototype key: **T**). Quarters, dotted quarters, syncopated quarters (eighth, quarter, eighth) and ties across a bar line are all entered this way.
- **Spelling is always automatic.** The app decides how hits and holds are written as notes, rests, dots and ties (e.g. a quarter tied to an eighth is written as a dotted quarter). The prototype's spelling rules are the starting point and can be tuned during implementation. The user accepted that the notation may sometimes differ from how the book prints a figure. The stored model is still the symbolic one from **Exercise data model and sticking rules**; the editor writes it through the auto-speller.
- **The palette has to cover every one-beat figure the book uses**, since there's no other way to enter a beat. Choosing the figures and their keys is a new ticket, **Beat figure palette**.
- **Starting point for keys and mouse** (from the prototype, to be confirmed in the palette ticket): a key per figure, ←/→ to move between beats, Backspace for a rest and step back, Ctrl+D to duplicate a bar, Ctrl+Enter to add a bar, and clicking a beat box or a note to move there.
- **Live mirroring**: the notation view re-renders on every edit, with the current beat's notes highlighted and the current bar shaded.
- **Deferred**: how sticking overrides are set (the prototype cycles auto → R → L on a note click). See the map's Not yet specified.

## Comments

- 2026-10-05: Prototype built: [grid editor variants](../prototypes/05-grid-editor/index.html) (double-click to open; `vexflow.js` next to it is VexFlow 5.0.0, so it works offline). Three structurally different editors on one page, switchable with the bottom bar or `?variant=A|B|C` (Alt+←/→): **A Step grid** (mouse-first, per-beat 8ths/16ths/triplets, drag to hold), **B Typed line** (shorthand text such as `q e q e q | re e q q. e`), **C Beat figures** (one key per beat from a palette of 16 one-beat figures, with a tie toggle). All three edit one in-memory exercise, and the notation view mirrors every edit. Clicking a note cycles its sticking override. `?sample=0..3` loads a test line. Finding so far: the grid variants (A, C) re-spell what they're given (`q~ e` → `q.`), so a grid can't keep a spelling the user typed. Waiting on the user's session with real lines from the book.
