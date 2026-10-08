# 05: Folders in export and import

**What to build:** Exported exercises carry their folder's name, and import files them into a folder of that name, made if it's missing. See [spec](../spec.md) story 21.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] The export file lists the folders of the exported exercises. Device settings (collapsed folders, the tab) are not exported
- [ ] Import matches a folder by name, ignoring case, or creates it. Tested: importing into a library with "syncopation p.38" files "Syncopation p.38" exercises there, without a second folder
- [ ] A v2 export imports with every exercise in no folder. Tested
- [ ] Checked in the browser: export a folder's exercises, delete them and the folder, import, and they're back in the folder
