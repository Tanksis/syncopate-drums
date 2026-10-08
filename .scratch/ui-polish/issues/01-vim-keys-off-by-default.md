# 01: Vim keys off by default

**What to build:** A new device starts with vim keys off. A device that already stored the setting keeps it. See [spec](../spec.md) stories 13–14.

**Blocked by:** None (can start immediately)

**Status:** done (merged in PR #47, 2026-10-08)

- [x] `DEFAULT_DEVICE_SETTINGS.vimKeys` is `false`. Tested: the defaults have vim keys off. Stored settings are merged over the defaults (`repository.ts`), so a stored `vimKeys: true` is kept
- [x] The editor header's `vim on/off` switch and the settings sidebar show off on a fresh profile, and the editor is in Insert mode with no Normal mode
- [x] Checked in the browser on a fresh profile, and on one with vim keys stored on

## Comments

Checked headless: a fresh profile shows `vim off` and no mode line, and a stored `on` survives a reload.
