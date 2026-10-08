# 02: Copy an example to the Library

**What to build:** A Copy to Library button in the example notice, which makes an ordinary exercise from the open example and opens it in the Library tab. Duplicate on an example does the same. See [spec](../spec.md) stories 9–10.

**Blocked by:** 01

**Status:** done (merged in PR #42, 2026-10-08)

- [x] `copyExample(example, { id, now, folderId })`: a new id, the name without "Example: ", and the example's notes, sticking and current practice settings. Tested: the copy has a new id, no prefix, the slowed BPM it was copied at, and `isExample` is false for it
- [x] Copy to Library and Duplicate both store the copy at the top of the Library, open it, and switch to the Library tab
- [x] The copy is fully editable and autosaves. The example it came from is unchanged
- [x] Checked in the browser with real mouse clicks

## Comments

- 2026-10-08: Choices where the spec was silent:
  - `copyExample` takes `{ id, now }` for now. `Exercise` has no `folderId` until ticket 03, which threads it through.
  - `duplicateExercise` itself makes Copy to Library's copy when given an example, so the rule lives in the tested core, and Duplicate and both Copy to Library buttons share one store action.
  - The notice now uses the spec's wording, "Example: read-only. Copy to Library to edit it.", and drops ticket 01's sentence about tempo, loop, groove and swing changes not being kept.
  - The Examples tab's Copy to Library button is disabled while a Library exercise is open.
  - Copying the same example twice gives two exercises with the same name, with no " (copy)" suffix.
