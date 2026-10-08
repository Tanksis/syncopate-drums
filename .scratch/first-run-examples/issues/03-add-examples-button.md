# 03: Add examples button

**What to build:** An "Add examples" button in the library sidebar that adds a fresh copy of the example set on top of the list and opens the first. See [spec](../spec.md) stories 9 and 11.

**Blocked by:** 02

**Status:** wontfix

- [ ] The library sidebar has an "Add examples" button, styled like Import and Export all, with `keepFocus`
- [ ] It adds a fresh set (new ids) on top of the list, stores it straight away, opens the first example, and sets `examplesAdded`
- [ ] Pressing it twice gives two independent copies; editing one leaves the other unchanged
- [ ] The examples can be renamed, duplicated, exported and deleted like any exercise
- [ ] Checked in the browser with real mouse clicks

## Comments

- 2026-10-08: Dropped. The examples become built in and read-only, in their own sidebar tab ([library-tabs-and-folders spec](../../library-tabs-and-folders/spec.md), [ADR 0008](../../../docs/adr/0008-examples-are-built-in-and-read-only.md)), so there's nothing to add back.
