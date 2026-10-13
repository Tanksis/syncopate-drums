# Spec: Library and play polish

Status: ready-for-agent

Source: the user's feedback on 2026-10-13, after kick-fills 05 (hi-hat foot) shipped. Their choices are given below. Vocabulary follows [`CONTEXT.md`](../../CONTEXT.md).

## Problem Statement

- **Busy Library buttons.** The Library tab opens with eight text buttons in four rows (New, New from pattern, Duplicate, Delete, Import, Export all, New folder, plus the filter). Other apps use a short row of icons and menus.
- **Unsorted lists.** Names with numbers sort as text, so "Syncopation 34" comes before "Syncopation 4". Exercises are listed by when they were opened, not by name.
- **Hard-to-read fills with the hi-hat foot.** With the hi-hat foot setting on, a linear fill such as `RLRK` turns from one voice into two. The kicks drop into the feet part as dotted-eighth-and-sixteenth rhythms beside the foot.
- **Play is in an awkward spot.** On desktop the play button sits in the middle of the header, away from the music.

## Solution

1. **Library toolbar:** one row above the filter:
   - a **+** menu (New, New from pattern…, New folder);
   - icon buttons for Duplicate and Delete;
   - a **⋯** menu (Import…, Export all).
2. **Natural A–Z order:** folders and exercises are sorted by name, ignoring case, with numbers in order.
3. **The hi-hat foot is written under the fill:** the setting no longer changes a bar's voicing ([ADR 0012](../../docs/adr/0012-hi-hat-foot-ostinato-under-the-fill.md)).
4. **Play on the staff (desktop):** a round ▶/■ button at the top left of the notation, by bar 1, replaces the header's Play. The phone keeps its bottom transport bar.

## User Stories

### Library toolbar

1. As a drummer, I want the Library's actions in one tidy row of icons and menus, so that the sidebar is calm and the list gets the room.
2. As a drummer, I want New, New from pattern and New folder under one **+**, so that every way to make something is in one place.
3. As a drummer, I want Duplicate and Delete as icon buttons with tooltips, so that the actions I use on the open exercise are one click away.
4. As a drummer, I want Import and Export all under **⋯**, so that the actions I rarely use stay out of the way.
5. As a drummer on the phone, I want the same row with finger-sized targets, so that it works on the iPhone.

### Order

6. As a drummer, I want folders in natural A–Z order ("Syncopation 4" before "Syncopation 34"), so that I can find a page.
7. As a drummer, I want the exercises in each folder, and those in no folder, in natural A–Z order, so that a book's exercises are in sequence.

### Hi-hat foot under the fill

8. As a drummer, I want a fill such as `RLRK` to keep its one-voice look when I turn the hi-hat foot on, so that I read one rhythm.
9. As a drummer, I want the foot under the fill's stems where it lands on the fill's notes, and in its own stems-down part where it doesn't, so that the ostinato reads apart from the fill.
10. As a drummer, I want grooves to look as they do now, so that nothing I liked changes.

### Play on the staff

11. As a drummer on desktop, I want the play button at the top left of the music, by bar 1, so that it's where my eyes are.
12. As a drummer, I want it to stay visible when the notation scrolls, so that I can always stop.

## Implementation Decisions

### Exercise core (the test seam)

- **Natural order:**
  - `foldersByName` and `libraryView` compare names with `localeCompare(…, { sensitivity: 'base', numeric: true })`.
  - `libraryView` sorts the exercises in each folder, and the loose ones, by that order too.
  - Folder name matching on import (`fileIntoFolders`) keeps comparing without `numeric`, so "Page 01" and "Page 1" stay different folders.
- **Hi-hat foot voicing (ADR 0012):**
  - `staffParts` picks each bar's voicing from the rows and the preset's hits only.
  - It then places the setting's hits:
    - In a one-voice bar where every setting hit lands on a struck hands chord, they join those chords.
    - Otherwise, in a one-voice bar, the bar gets a feet part of just the setting's hits, with rests.
    - In a two-voice bar, they join the feet part.
  - The preset's own hi-hat foot (with the setting off) counts as now.
  - `grooveHitsByTick` may need to tell the setting's hits apart from the preset's, for example with a flag on `GrooveHit` or a separate list.

### App

- **Icons:** inline SVG components in `src/components/icons.tsx`, stroked in `currentColor`. No icon dependency.
- **Library toolbar:**
  - Each icon button has an `aria-label` and a `title`. Delete is disabled on an example, as now.
  - The menus use the shared `Menu` from `src/components/Menu.tsx`. Import… opens the file picker as the Import button does now.
  - The filter takes the full width under the toolbar.
  - The import status line and the selection bar are unchanged.
- **Play on the staff:**
  - In the desktop layout, the header's Play goes. A round button (▶, ■ while playing) is pinned to the top left of the notation area, next to bar 1's number when the staff is scrolled to the top. It stays in place as the staff scrolls.
  - It has the same title, `aria-label` and behaviour as today's Play: from the count-in, Ctrl+Space. Space pauses as now.
  - It must not cover bar 1's number or the loop click on it.
  - The `PhoneLayout`'s `TransportBar` is unchanged.

## Testing Decisions

- **One seam: the exercise core's public interface**, as before. For example:
  - "folders named Syncopation 34, syncopation 4 and Alpha list as Alpha, syncopation 4, Syncopation 34";
  - "a folder's exercises list A–Z with numbers in order";
  - "`RLRK` with the hi-hat foot on quarters is one voice, with the foot in the hands chords on each beat";
  - "a one-voice fill with a rest on beat 2 and the foot on quarters has a feet part of the foot alone";
  - "the jazz groove with the setting on 2 & 4 is written as with the setting off".
- **Not tested automatically:** the toolbar, the menus and the play button. These are checked in the browser with real pointer events at 1280 px, and the toolbar also at 390 × 844 (touch).

## Out of Scope

- Moving the BPM, count-in or loop readout out of the header.
- A play button on the staff on the phone.
- Reordering exercises by hand.

## Further Notes

The tickets are in `issues/`, and all four can start at once.
