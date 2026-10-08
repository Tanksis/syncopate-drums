# 02: Copy an example to the Library

**What to build:** A Copy to Library button in the example notice, which makes an ordinary exercise from the open example and opens it in the Library tab. Duplicate on an example does the same. See [spec](../spec.md) stories 9–10.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] `copyExample(example, { id, now, folderId })`: a new id, the name without "Example: ", and the example's notes, sticking and current practice settings. Tested: the copy has a new id, no prefix, the slowed BPM it was copied at, and `isExample` is false for it
- [ ] Copy to Library and Duplicate both store the copy at the top of the Library, open it, and switch to the Library tab
- [ ] The copy is fully editable and autosaves. The example it came from is unchanged
- [ ] Checked in the browser with real mouse clicks
