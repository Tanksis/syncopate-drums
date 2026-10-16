# 04: A pencil for renaming

**What to build:** Finding 3, as `?rename=pencil` on `prototype/new-user-polish`. The open exercise's name in the header (and the phone's equivalent) gets a small pencil icon inside the same button, mute until hover, when it takes the accent colour. The Library's exercise rows and folders show the same pencil on hover (and while focused), which starts the same in-place rename as the double-click. An example's name stays fixed, with no pencil. No ⋯ menu. See [spec](../spec.md), stories 6–7.

**Blocked by:** none

**Status:** done (merged in PR #132, 2026-10-16)

- [x] Pencil beside an ordinary exercise's name; none on an example
- [x] A pencil on hover in every exercise row and folder, starting the same rename as the double-click
- [x] Keyboard: the pencils are reachable by Tab, and Escape cancels the rename
- [x] Checked at 390 × 844 and 1280 with real mouse events

## Comments

- 2026-10-16: The user wants to see this mocked or prototyped before agreeing to it. It waits for the `prototype/new-user-polish` verdict.
- 2026-10-16: Prototype verdict (`prototype/new-user-polish`, commit 53472b9): the pencil (over the field look and a ⋯ menu).
- 2026-10-16: Done in PR #132. Choices the ticket left open:
  - The pencil is the shared 16 px icon. The prototype's was 14 px.
  - On a touch screen, the Library's pencils stay invisible because nothing hovers, like the folder's ×. The header pencil always shows.
  - When a rename ends, focus doesn't go back to the pencil. The header rename already behaved this way.
