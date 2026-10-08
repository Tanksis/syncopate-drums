# 05: Folders in export and import

**What to build:** Exported exercises carry their folder's name, and import files them into a folder of that name, made if it's missing. See [spec](../spec.md) story 21.

**Blocked by:** 03

**Status:** done (merged in PR #45, 2026-10-08)

- [x] The export file lists the folders of the exported exercises. Device settings (collapsed folders, the tab) are not exported
- [x] Import matches a folder by name, ignoring case, or creates it. Tested: importing into a library with "syncopation p.38" files "Syncopation p.38" exercises there, without a second folder
- [x] A v2 export imports with every exercise in no folder. Tested
- [x] Checked in the browser: export a folder's exercises, delete them and the folder, import, and they're back in the folder

## Comments

- 2026-10-08: Choices where the spec was silent:
  - The export lists only the folders its exercises are in, so an empty folder isn't exported.
  - Names match as the sidebar sorts them (`localeCompare`, base sensitivity), so accents are ignored too, and trimmed. A blank folder name in a file matches "New folder".
  - Folders are filed after the replace/keep-both/skip choice, so a skipped exercise makes no folder. With Replace, the exercise takes the file's folder, even if it was filed elsewhere here.
  - A file is refused whole, as damaged, when its `folders` isn't a list of `{ id, name }` or an exercise's `folderId` isn't a string or null. An exercise in a folder the file doesn't list goes in no folder.
  - The browser check ran headless with Playwright.
