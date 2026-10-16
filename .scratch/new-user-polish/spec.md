# Spec: New-user polish

Status: ready-for-agent for tickets 01–04, 06 and 08–11. Tickets 05 (row labels, bigger controls) and 07 (the sticking tip) are wontfix. Prototype verdict 2026-10-16: the beat count is the corner one.

Source: the user's goal on 2026-10-16: before accounts, sync, a public library or iOS, the app should be easy to understand for a new user, and polished and complete. Inputs:
- A walk-through of the app as a first-time user on desktop (Chrome) and an emulated iPhone 13 (WebKit) found ten problems, numbered 1–10 below. The user confirmed all ten.
- The beat count is variant **B ("Count")** from the beat-flash prototype (branch `prototype/beat-flash`, commit `218fd96`, never merged). The user found A (edge glow) and C (screen flash) too distracting.
- The settings headings and the sidebar's names come from the settings-redesign prototype's verdict (branch `prototype/groove-settings`, commit `bb5d7e8`, never merged). The rest of that verdict (the Time group, the Pattern picker, Feet, the swing chips, filtering by time signature) goes in the `time-signatures` spec.

Vocabulary follows [`CONTEXT.md`](../../CONTEXT.md).

## Problem Statement

A drummer who opens Syncopate! for the first time lands on an example, with no welcome and no obvious way to make an exercise of their own. On the phone the only button on an example says **Copy**, which reads like copy-to-clipboard. Several things work but don't say so: renaming is a double-click with no affordance, the editor's two rows have no names, and sticking is off for new exercises, so a newcomer may never find it. Some controls are small or unlabelled. The settings sidebar's group headings are faint, and its sections are named oddly: "Practice" over a pinned "Settings", with the rail also saying "Settings". Nothing shows the beat while an exercise plays, and there's no help or about page.

## Solution

- **A welcome and a way in:** the first visit opens the first example with a short welcome card that offers **New exercise** and **Browse examples**. The Library's empty state gets a button.
- **Visible affordances:** a pencil beside the exercise's name and on the Library's rows; an empty exercise's hint in the editor; short exercises drawn larger, filling the card.
- **Notation that fits:** the empty-staff hint moves off the staff lines, and a short exercise is drawn larger on a roomy desktop card.
- **Wording and tooltips:** no "Example:" in the Examples tab, sticking modes capitalised, and tooltips on Hi-hat foot, the Loop chip and the Exercise volume.
- **Settings sidebar:** rule-style group headings everywhere, and the sections named **Practice settings** / **Metronome settings** over a folding **General**.
- **Beat count:** a large `1 2 3 4` in the notation card's corner while playing, the current beat enlarged, beat 1 in the accent colour, and a **count-in** label during the count-in.
- **Help + About:** one page with a quick start, the keys, the words the app uses, and an about section.

## User Stories

### First visit

1. As a new user, the first time I open the app I see the first example with a short welcome that says what the app does, and a **New exercise** and a **Browse examples** button.
2. As a new user, **New exercise** gives me an empty exercise in my Library, open and ready to edit, on the phone and the desktop.
3. As a new user, I can dismiss the welcome, and it doesn't come back.
4. *(Dropped: "Edit a copy"; the phone's Copy stays.)*
5. As a user with an empty Library, the Library says so and offers **New exercise**, with a hint that the examples can be copied.

### Finding things

6. As a user, a pencil beside the open exercise's name tells me I can rename it, and clicking either renames it.
7. As a user, every exercise and folder in the Library shows a pencil on hover that renames it, as well as the double-click.
8. *(Dropped: row labels, ticket 05, wontfix.)*
9. *(Dropped: bigger editor controls, ticket 05, wontfix.)*
10. As a user with an empty exercise, a hint at the top of the grid editor tells me to click a square to add a hit, instead of a hint over the staff's lines.
11. As a desktop user with a short exercise, the staff is drawn larger, over more lines if that helps, and centred in the card; I can turn this off in General › Appearance.
12. *(Dropped: the sticking tip, ticket 07, wontfix.)*

### Wording

13. As a user, the Examples tab lists the examples without "Example:" before each one.
14. As a user, the sticking modes read **Natural**, **Alternate** and **Off**.
15. As a user, hovering Hi-hat foot, the Loop chip or the Exercise volume tells me what it does.

### Settings sidebar

16. As a desktop user, each settings group starts with a hairline and a heading in the ink colour; the first group of a section has no hairline.
17. As a desktop user, the sidebar's top reads **Practice settings** or **Metronome settings**, its pinned bottom section reads **General** and folds, and the collapsed rail reads **Settings**.

### Beat count

18. As a drummer, while an exercise plays, a large count in the notation card's corner shows each beat of the bar, with the current beat enlarged and beat 1 in the accent colour.
19. As a drummer, during the count-in the count shows **count-in** beside it.
20. As a drummer, I can turn the beat count off in General › Appearance, on this device.
21. As a phone user, the count is smaller and still clear of the staff.
22. As a user who prefers reduced motion, the current beat changes colour without growing.

### Help and About

23. As a user, a **?** button in the desktop header and **Help** in the phone's menu open a Help page.
24. As a user, Help gives a three-step quick start, the keyboard keys, and short definitions of the app's words: exercise, bar, snare row, kick row, sticking, groove, hi-hat foot, swing, loop and count-in.
25. As a user, About says what Syncopate! is, that my exercises stay on this device, how to export them, and credits VexFlow and the app's other open-source parts.

## Implementation Decisions

### Exercise core (the test seam)

- `DeviceSettings` gains:
  - `welcomeDismissed: boolean` (default false);
  - `beatCount: boolean` (default true);
  - `fitNotation: boolean` (default true).
  `deviceSettingsFrom` validates all three. Device settings are never exported, so no schema bump.
- A pure `beatCountAt(position)` (in `src/core/`, beside the timeline) maps a playback position to `{ countIn: boolean, beat: number, beats: number }`. `beats` comes from the bar, which is `BEATS_PER_BAR` today, so the time-signatures work only changes it there.
- The examples' list shows `exampleTitle(example)`, the name without its `Example: ` prefix. The stored name and Copy to Library keep their present behaviour.

### App

- **Welcome:** a card over the notation view's paper, shown while `welcomeDismissed` is false and an example is open. It has a title, one sentence, **New exercise** (primary), **Browse examples** (opens the Examples tab, or the phone's Library sheet on it) and ✕. Either button or ✕ sets `welcomeDismissed`. The store's existing new-exercise action does New exercise.
- **Library empty state:** "No exercises yet." stays, followed by a **New exercise** button and the line "Or copy one from Examples.", Examples a link to that tab.
- **Selection bar** (ticket 11): Export and Delete in place of Export selected and Delete selected; Move to… as a `SelectMenu`-styled button opening a `Menu`, not a native `<select>`.
- **Rename:** `ExerciseName` gets a small pencil icon after the name, mute until hover, part of the same button. The Library's exercise rows and folders show the same pencil on hover and focus, starting the in-place rename.
- **Empty-exercise hint:** leaves the staff for a tinted line at the top of the grid editor: "↓ Click a square to add a hit: the top row is the snare, the bottom row the kick." ("Tap" on a phone). Not on examples.
- **Short exercises:** today `notationFit` already scales up to 1.6 without adding lines. With `fitNotation` on, on desktop, it may go up to 2.4 and break onto more lines, balanced (4 bars as 2 + 2), and the staff is centred vertically in the card. The switch is a row in General › Appearance. A zoom control is out of scope.
- **Wording:** `Choice` labels the sticking modes Natural / Alternate / Off (the values stay lowercase). Tooltips:
  - Hi-hat foot: "The hi-hat pedal played under every bar".
  - The Loop chip (all bars): "Click a bar number to loop it, Shift+click to extend". It has this already when idle, so check it shows in every state.
  - The Exercise volume: "How loud the exercise's own notes play".
- **Group headings:** `SettingGroup`, and the Metronome's compact `TimeSignature` / `SubdivisionGrid` headings, become the rule style from the prototype:
  - the frame is `border-t border-line pt-3`, and a group that is first in its section drops the border;
  - the heading is `font-display text-[13px] font-bold tracking-wider text-ink` with the theme's heading caps and case.
  `PanelHeading` stays as it is for section labels (EXERCISES and the like). Do this with one `SettingGroup` (or a `GroupHeading` beside `PanelHeading`), not per call site.
- **Sidebar names:** the top `SidebarHeading` reads `Practice settings` / `Metronome settings`, and its `sidebarName` stays `Settings`. `SharedSettings`'s heading becomes **General**, and its fold and its labels ("Fold General", "Open General") follow.
- **Beat count:** a `BeatCount` component in the notation view's top-right corner, reading the playhead on each animation frame as the prototype's `useBeats` does, but through `beatCountAt`. It renders `beats` numbers, not a fixed four. Sizes: `text-3xl` on desktop and `text-2xl` on a phone. It's `aria-hidden` and `pointer-events-none`. The notation's top-right padding grows while it shows, so it never covers the staff. Its switch is a row in General › Appearance (desktop) and in the phone's Theme tab.
- **Help + About:** a full-screen `HelpPage` (the phone's `FullScreenHeading` pattern; a dialog-sized panel on desktop) with Help and About sections. The keys reuse `keyHelp.ts` and the Metronome's keys. Add `?` to the header beside the existing controls; on the phone, a **Help** item in the ☰ menu. No routing: it is app state, like the sheets.
- Add **Beat count** to `CONTEXT.md` under Practice.

## Testing Decisions

- Unit tests:
  - `beatCountAt`: a count-in position, each beat of a bar, a position that falls between beats, and the last beat before the loop wraps.
  - `deviceSettingsFrom` for the three new fields (valid, missing, junk).
  - `notationFit` growing: the cap, the balanced lines, and no growth when off.
  - `exampleTitle`.
- Every screen is checked in the browser at 390 × 844, at 1280 with both sidebars open and at 1440, in light and dark, Warm and Studio, with real mouse events (see the memory on real-mouse checks).
- First-visit checks start from a cleared IndexedDB.
- How the beat count feels against the audio is left to the user's eye and ear.

## Out of Scope

- The Groove/Time redesign: the Pattern picker, Feet, the time signature, the swing chips (which also fixes finding 9's cramped swing presets) and the jazz pattern's visible swing change with Undo (finding 7). These are in the `time-signatures` spec.
- Snare/Kick row labels and bigger editor controls (ticket 05; the user kept today's on 2026-10-16).
- Changing new exercises to start with sticking on (the user kept #50's choice), and any tip about sticking being off (ticket 07; the user declined it on 2026-10-16).
- A guided tour or tooltips that walk through the app.
- A speed trainer, share-by-link, gap click, print/PDF, a practice log.
- Accounts, sync, the public library, iOS.

## Further Notes

- The first new-user test didn't cover audio by ear on a real iPhone, the 1280 px desktop layout or editing in the phone sheet. Cover the last two in this spec's browser checks.
- The welcome's wording, the hint's wording and the Help page's text are drafts; the user may rewrite them in review.
- The prototype that settled tickets 03–06 and 09 is on the `prototype/new-user-polish` branch (never merged); its verdict commit is 53472b9.
