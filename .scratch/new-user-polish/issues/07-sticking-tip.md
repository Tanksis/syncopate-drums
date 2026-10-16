# 07: A one-time tip that sticking is off

**What to build:** Finding 8. New exercises still start with sticking off (#50). The first time a note is added to an ordinary exercise whose sticking is off, while `stickingTipSeen` is false, a dismissible line under the staff says: "Sticking is off. Turn it on in Settings › Sticking to see R and L under the notes." It sets `stickingTipSeen` when dismissed or once sticking is turned on. See [spec](../spec.md), story 12.

**Blocked by:** none

**Status:** ready-for-agent

- [ ] `DeviceSettings.stickingTipSeen`, validated, with tests
- [ ] Shown once, never on an example, never with sticking on
- [ ] Dismissing it or turning sticking on hides it for good
- [ ] The wording points at the right place on the phone too (Settings › Sticking tab)
