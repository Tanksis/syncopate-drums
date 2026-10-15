# 06: Keep playing on the phone

**What to build:** The screen stays awake while the metronome plays (the Wake Lock API, released on stop and re-taken when the page becomes visible again), and the audio session is set to playback where the browser supports it, so the iPhone's silent switch doesn't mute it. See [spec](../spec.md) stories 14–15.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Wake Lock while playing, released on stop, re-requested on `visibilitychange`
- [ ] `navigator.audioSession.type = 'playback'` where supported, set from the Play gesture
- [ ] Nothing breaks where neither API exists
- [ ] Left to the user: checked on their iPhone (screen stays on; heard with the silent switch on)
