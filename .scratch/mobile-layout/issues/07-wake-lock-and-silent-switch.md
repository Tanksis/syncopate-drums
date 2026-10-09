# 07: Keep the screen awake, and play on silent

**What to build:** The screen stays awake while playing and for a minute after playback stops or pauses. On iOS, sound plays with the silent switch on. See [spec](../spec.md) stories 23–25.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] A screen wake lock is requested when playback starts and released one minute after it stops or pauses. Starting again within the minute keeps it
- [ ] It's requested again when the page becomes visible while playing. A refusal or a missing API is ignored
- [ ] `navigator.audioSession.type = 'playback'` is set, where it exists, before the audio context starts
- [ ] Checked in the browser that playback causes no errors where the APIs are missing. The user checks the music-stand and silent-switch behaviour on their iPhone
