# Browser Audio Engine and Drum Sounds

Researched: 2026-10-05. Scope: how the web app should schedule the click, the exercise and the groove layer so they stay sample-accurate for play-along on a Windows laptop with headphones; how to implement swing feel; how to keep the note highlight in sync; what output latency to expect; where to get drum samples with licences that allow a later public app. Every claim cites a source. Anything not confirmed from a primary source is marked **(unverified)**.

Vocabulary follows `CONTEXT.md` (Exercise, Bar, Note, Voice, Groove layer, Swing feel, Click, Count-in, Loop range).

---

## TL;DR

**Recommendation: write our own small lookahead scheduler on the raw Web Audio API. Do not use Tone.js's Transport. Apply swing ourselves as a time-warp on grid positions, before scheduling.**

Why:

1. **The core pattern is small and well documented.** A JS timer wakes up every ~25 ms. Each time, it schedules on the audio clock every note that falls within the next ~100 ms (`AudioBufferSourceNode.start(when)`). The audio clock is sample-accurate; the JS timer only has to be roughly on time ([web.dev, Chris Wilson, "A tale of two clocks"](https://web.dev/articles/audio-scheduling)). Tone.js uses the same design with the same numbers: `lookAhead: 0.1`, `updateInterval: 0.05`, a Worker-driven ticker ([Tone.js Context.ts](https://raw.githubusercontent.com/Tonejs/Tone.js/dev/Tone/core/context/Context.ts)). Our version needs one-shot samples, one tempo, one loop range and a count-in. That is a few hundred lines **(unverified estimate)**.
2. **Tone.js's built-in swing is the wrong shape for us.** It shifts every non-downbeat tick by a sine curve ([Transport.ts `_processTick`](https://raw.githubusercontent.com/Tonejs/Tone.js/dev/Tone/core/clock/Transport.ts)). That moves eighth-note triplets, which should stay put under swing feel, and it moves sixteenths unevenly (worked numbers in [Swing](#swing-feel-implementation)). We would have to turn it off and compute swing ourselves anyway. After that, Tone's Transport adds little except a dependency.
3. **We need a pure, testable function from Exercise to timed events.** Swing rules, triplet handling, the count-in, the loop range and sticking-aware highlighting all belong in our domain code. A thin scheduler that consumes `{time, voice, noteId}` keeps that logic out of a library's callback model.
4. **Tone.js is still a good fallback.** It is MIT-licensed and actively maintained. `latest` is 15.1.22 (2025-04-27) and `next` is 15.5.57 (published 2026-10-04) ([npm registry](https://registry.npmjs.org/tone); [GitHub commits API](https://api.github.com/repos/Tonejs/Tone.js/commits?per_page=3)). If our scheduler turns out fiddly, use Tone's Transport with `swing = 0` and feed it pre-swung times.

**For the "Swing and groove playback check" prototype:**

- Represent note positions as integer ticks on a grid divisible by both 4 and 3 (e.g. 48 or 96 per quarter), so sixteenths and eighth triplets are exact.
- Swing = a ratio `r` from 0.50 (straight) through 0.667 (triplet swing) to 0.75 (dotted-eighth feel). Map binary-grid positions inside each beat through a piecewise-linear warp. **Triplet-grid positions are not warped.**
- Schedule each sample with `source.start(when)` from a 25 ms Worker timer with a 100 ms lookahead.
- Route sounds into three `GainNode`s (click / exercise / groove) → master → destination.
- Highlight notes by comparing their scheduled time with `getOutputTimestamp()`-based "audible now" in `requestAnimationFrame`.

**For the "Tech stack" ticket:**

- No audio library is required. Plain Web Audio has been fully available in Chrome, Edge and Firefox for years. `outputLatency` is the newest API we use: Chrome/Edge 102, Firefox 70, Safari 18.4 ([MDN browser-compat-data](https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/AudioContext.json)).
- Keep the scheduler framework-agnostic (plain TS module), so the UI framework choice is free.
- Samples: **Virtuosity Drums (CC0)** covers every voice we need (snare, kick, ride, ride bell, hi-hat closed and pedal). Synthesize the click with an `OscillatorNode` so it needs no sample at all.

---

## Comparison

| Option | Licence | Maintenance (checked 2026-10-05) | Scheduling | Swing | Looping / tempo changes | Visual sync helper | Fit |
|---|---|---|---|---|---|---|---|
| **Own lookahead scheduler on Web Audio** | n/a (our code) | n/a | Timer every ~25 ms schedules notes within ~100 ms on the audio clock ([web.dev](https://web.dev/articles/audio-scheduling)) | Whatever we define (see below) | We define it: tempo applies to notes not yet scheduled; loop wraps at the range end | Note queue + rAF, as in the web.dev article ([web.dev](https://web.dev/articles/audio-scheduling)); add output-latency correction ourselves | **Recommended.** Full control of swing/triplets, easy to unit-test. |
| **Tone.js** (Transport + Player/Sampler) | MIT ([repo](https://github.com/Tonejs/Tone.js)) | Active: commits and `next` release 15.5.57 on 2026-10-04; `latest` 15.1.22 from 2025-04-27 ([npm](https://registry.npmjs.org/tone), [commits](https://api.github.com/repos/Tonejs/Tone.js/commits?per_page=3)) | Same design: `lookAhead` 0.1 s, `updateInterval` 0.05 s, Worker clock by default, `latencyHint: "interactive"` ([Context.ts](https://raw.githubusercontent.com/Tonejs/Tone.js/dev/Tone/core/context/Context.ts)) | `Transport.swing` 0–1 plus `swingSubdivision` (default `8n`), sine-shaped offset on every non-downbeat tick ([Transport.ts](https://raw.githubusercontent.com/Tonejs/Tone.js/dev/Tone/core/clock/Transport.ts)) | `loop`/`loopStart`/`loopEnd`; on reaching `loopEnd` it resets ticks to `loopStart` ([Transport.ts](https://raw.githubusercontent.com/Tonejs/Tone.js/dev/Tone/core/clock/Transport.ts)). Tempo is an automatable signal; ticks are computed by integrating it, so ramps work ([TickSource.ts](https://raw.githubusercontent.com/Tonejs/Tone.js/dev/Tone/core/clock/TickSource.ts)) | `Tone.Draw` runs callbacks in rAF against `context.currentTime` (anticipation 8 ms, expiration 250 ms). It does **not** correct for `outputLatency` ([Draw.ts](https://raw.githubusercontent.com/Tonejs/Tone.js/dev/Tone/core/util/Draw.ts)) | Good fallback. Its swing distorts triplets, so we would disable it. Tempo ramps help the "tempo ramp" stretch goal. |
| **WAAClock** | MIT ([repo](https://github.com/sebpiq/WAAClock)) | Latest npm version 0.5.5; low activity ([npm](https://registry.npmjs.org/waaclock)) **(activity level unverified)** | Callback scheduler on the audio clock ([repo](https://github.com/sebpiq/WAAClock)) | None | Manual | None | Not worth a dependency; our own scheduler is about the same size. |

---

## Swing feel implementation

### What Tone.js does (and why we should not copy it)

The relevant code in `Transport._processTick` is ([Transport.ts](https://raw.githubusercontent.com/Tonejs/Tone.js/dev/Tone/core/clock/Transport.ts)):

```ts
if (this._swingAmount > 0 &&
    ticks % this._ppq !== 0 &&                 // not on a downbeat
    ticks % (this._swingTicks * 2) !== 0) {
  const progress = (ticks % (this._swingTicks * 2)) / (this._swingTicks * 2);
  const amount = Math.sin(progress * Math.PI) * this._swingAmount;
  tickTime += new TicksClass(this.context, (this._swingTicks * 2) / 3).toSeconds() * amount;
}
```

Defaults: `ppq: 192`, `swing: 0`, `swingSubdivision: "8n"`, so `_swingTicks = 96` and the swing period is one quarter, i.e. 192 ticks (same file). The maximum offset is one third of a quarter, multiplied by `sin(π·progress)`. Worked consequences (my arithmetic from that code):

| Note position in the beat | Straight tick | Shift at `swing = 0.5` | Result | What a drummer expects with triplet swing |
|---|---|---|---|---|
| Off-beat eighth ("&") | 96 | +32 | 128 (2/3 of the beat) | 128. Correct. |
| 2nd sixteenth ("e") | 48 | +22.6 | 70.6 | 64 (half of the long eighth) |
| 4th sixteenth ("a") | 144 | +22.6 | 166.6 | 160 (half of the short eighth) |
| 2nd triplet eighth | 64 | +27.7 | 91.7 | 64 (unchanged) |
| 3rd triplet eighth | 128 | +27.7 | 155.7 | 128 (unchanged) |

So `swing = 0.5` gives triplet swing. `swing = 1` puts the "&" at 160/192 (a 5:1 ratio), beyond a dotted-eighth feel. The doc comment says "1 equal to the note + half the subdivision", which does not match the code (same file). Triplets are pulled off their positions, which breaks *Syncopation*-style exercises that mix triplets with swung eighths.

### Recommended model

- **Grid**: store each Note's position as integer ticks per bar with a tick resolution divisible by 12 per quarter (e.g. 48). Then sixteenths (12), eighths (24) and eighth triplets (16) are all exact. Ties and dots only affect notation, because drum samples are one-shots.
- **Swing amount**: expose a ratio `r` = the length of the first eighth as a fraction of the beat. 50% is straight, 66.7% is triplet swing, 75% is the dotted-eighth/sixteenth feel. The equivalent Tone value would be `swing = 3·(r − 0.5)` (derived from the code above).
- **Warp for binary-grid notes** (position `x` in [0, 1) within the beat):
  - `x < 0.5`: `x' = x · (r / 0.5)`
  - `x ≥ 0.5`: `x' = r + (x − 0.5) · ((1 − r) / 0.5)`

  The "&" goes to `r`. The "e" goes to the middle of the long eighth, and the "a" to the middle of the short eighth. Downbeats stay fixed.
- **Triplet-grid notes are not warped.** Under swing feel, notated triplets keep their triplet positions; at `r = 2/3` the third triplet coincides with the swung "&", which is what players expect. This is a musical convention, not something a spec defines **(unverified as a rule; check with the user in the prototype)**.
- **Sixteenths under swing**: the warp above "swings the eighths and subdivides proportionally". Some players prefer sixteenths left straight in a swung-eighth context. The prototype should let the user A/B this **(open question for the Swing and groove playback check)**.
- **Scope**: per the map, swing applies to the exercise *and* the groove layer with one amount. The Click stays on the quarter notes, which the warp never moves.
- Compute swung times in the pure `exercise → events` function. The scheduler only sees seconds.

---

## Scheduler design notes

- **Clock**: `AudioContext.currentTime` is advanced by the rendering thread in render-quantum increments and only increases ([Web Audio API spec](https://webaudio.github.io/web-audio-api/)). Render quanta are 128 frames by default (`renderSizeHint: "default"`) (same spec). Schedule everything as absolute context times.
- **Sources**: one new `AudioBufferSourceNode` per note. A source node "represents a one-shot sound, and cannot be started more than once" ([spec](https://webaudio.github.io/web-audio-api/#dom-audioscheduledsourcenode-start)). If `when` is earlier than `currentTime`, "the sound will play immediately" (same section). So a late scheduler pass produces a late note, not a skipped one. Log these as glitches.
- **Timer**: run the 25 ms tick in a Web Worker (Tone does this by default ([Context.ts](https://raw.githubusercontent.com/Tonejs/Tone.js/dev/Tone/core/context/Context.ts))). Chrome throttles timers in hidden pages, but pages that "made noises in the past 30 seconds" get only minimal throttling ([Chrome 88 timer throttling](https://developer.chrome.com/blog/timer-throttling-in-chrome-88)). A Worker timer is cheap insurance **(that Worker timers escape page throttling is unverified)**.
- **Tempo changes while playing**: keep musical position (bar, tick) as the source of truth. Convert to seconds incrementally from the last scheduled note. A BPM change then affects only notes not yet scheduled, so it takes effect within one lookahead window (≤100 ms). If we later want ramps (tempo-ramp stretch goal), integrate tempo over ticks the way Tone's TickSource does ([TickSource.ts](https://raw.githubusercontent.com/Tonejs/Tone.js/dev/Tone/core/clock/TickSource.ts)).
- **Loop range changes while playing**: apply the new range at the next wrap. If the playhead is already past the new end, wrap now. Notes already scheduled inside the lookahead window must be cancelled with `stop()` (keep references until they fire) **(design suggestion)**.
- **Count-in**: schedule one bar of clicks starting at `t0`, then the exercise at `t0 + barDuration`. It is the same scheduler with negative bar indices. Re-play the count-in only on start, not on each loop.
- **Volumes**: `click`, `exercise` and `groove` `GainNode`s → `master` → `destination`. "Mute exercise" sets its gain to 0. Change gains with `setTargetAtTime` to avoid zipper noise **(standard practice, unverified source)**. `GainNode` defaults to gain 1.0 ([spec](https://webaudio.github.io/web-audio-api/)).
- **Starting audio**: AudioContext playback outside a user-input handler is subject to autoplay rules. In Firefox, audio contexts can only play after sticky activation by default ([MDN autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)). Create or `resume()` the context in the Play button's click handler.
- **Click sound**: synthesize it (short `OscillatorNode` burst, higher pitch for beat 1). No licence question and a crisp onset. Pre-rendered CC0 clicks also exist: a mathematically generated Ardour/MuseScore metronome set ([MuseScore forum](https://musescore.org/en/node/320431)).
- **Sample prep**: trim leading silence so each sample's onset is at frame 0. Use WAV or FLAC; MP3 adds encoder delay at the start that some decoders do not remove **(unverified per browser)**.

---

## Visual sync approach

- `getOutputTimestamp()` returns `contextTime`, "the time of the sample frame which is currently being rendered by the audio output device", and `performanceTime`, the matching moment on the `performance.now()` clock ([spec](https://webaudio.github.io/web-audio-api/)). It is supported since Chrome/Edge 57 and Firefox 70 ([BCD](https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/AudioContext.json)).
- Each animation frame, compute what the user is hearing right now:

  ```js
  const ts = ctx.getOutputTimestamp();
  const audibleNow = ts.contextTime + (performance.now() - ts.performanceTime) / 1000;
  // highlight the latest note with scheduledTime <= audibleNow
  ```

  If `ts.contextTime` is 0 (before rendering starts), fall back to `ctx.currentTime - ctx.outputLatency - ctx.baseLatency`. `baseLatency` is the processing latency from the destination node to the audio subsystem; `outputLatency` is the estimate from handing a buffer to the OS until the device plays it ([spec](https://webaudio.github.io/web-audio-api/)).
- Keep a queue of `{time, noteId}` pushed by the scheduler and drained in rAF, as in the web.dev pattern ([web.dev](https://web.dev/articles/audio-scheduling)). Tone's `Draw` does the same but compares against `currentTime` only, so its highlight runs early by the output latency ([Draw.ts](https://raw.githubusercontent.com/Tonejs/Tone.js/dev/Tone/core/util/Draw.ts)).
- Add a user calibration offset (ms) in settings. It covers display latency and devices that report latency wrongly. Firefox, for example, reports a fixed ~80 ms on Windows when `resistFingerprinting` is on ([Bugzilla 1564422](https://bugzilla.mozilla.org/show_bug.cgi?id=1564422)). An independent test found Firefox's `outputLatency` "implausibly low" on macOS in 2021 ([jefftk, Browser Audio Latency](https://www.jefftk.com/p/browser-audio-latency)).

---

## Latency notes (Windows)

- **What matters for play-along**: the user hears the click and groove *output latency* late, then plays along with what they hear, and hears their own e-kit through its module directly. A constant output delay therefore does not make them play "out of time" against the app. It only shifts everything by a constant. It does matter for (a) the visual highlight, handled above; (b) future MIDI timing feedback (out of scope for v1); (c) jitter, which must be zero, and the audio-clock scheduling guarantees that **(reasoning, not a sourced measurement)**.
- **Windows audio stack**: by default every application renders with 10 ms buffers. Smaller buffers need the app to opt in through `IAudioClient3` and a driver that supports it. Since Windows 10 the audio engine itself adds about 1.3 ms ([Microsoft Learn, Low Latency Audio](https://learn.microsoft.com/en-us/windows-hardware/drivers/audio/low-latency-audio)). The inbox HDAudio driver supports 128–480-sample buffers (2.66–10 ms at 48 kHz) (same page).
- **Chrome on Windows**: the audio output tries to open at the native hardware buffer size. It allows either exactly the minimum buffer size via `IAudioClient3` or multiples of the default buffer via the older API ([Chromium audio_latency.cc](https://chromium.googlesource.com/chromium/src/+/main/media/base/audio_latency.cc)). Use `latencyHint: "interactive"` (the default: "lowest audio output latency possible without glitching" ([spec](https://webaudio.github.io/web-audio-api/))).
- **Typical numbers**: I found no current primary measurements for Chrome/Edge/Firefox output latency on Windows. Expect roughly 10–40 ms on wired headphones/built-in audio **(unverified)**. Bluetooth headphones add much more, often 100–300 ms **(unverified)**; Mozilla notes A/V sync is off with Bluetooth when latency is faked ([Bugzilla 1564422](https://bugzilla.mozilla.org/show_bug.cgi?id=1564422)). Recommend **wired headphones** or routing laptop audio into the e-kit module's aux input. The prototype should log `baseLatency` and `outputLatency` on the user's machine.
- **Output device selection**: `AudioContext.setSinkId` exists in Chrome/Edge 110+ but not in Firefox or Safari ([BCD](https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/AudioContext.json)). Not needed for v1; use the OS default device.

---

## Sample sources

| Source | Licence | Voices we need | Notes |
|---|---|---|---|
| **Virtuosity Drums** (Versilian Studios + Karoryfer) | **CC0** ("you can do whatever you want with these sounds (even make commercial software)") ([product page](https://versilian-studios.com/virtuosity-drums/), [GitHub](https://github.com/sfzinstruments/virtuosity_drums)) | Kick; snare (center, rimshot, cross-stick, …); hi-hat closed, open, **pedal**; **ride and ride bell**; flat ride; crash ([product page](https://versilian-studios.com/virtuosity-drums/)) | Jazz club "house kit" played with sticks; a good match for jazz-ride grooves. 1.1 GB with six mic positions ([product page](https://versilian-studios.com/virtuosity-drums/), [GitHub](https://github.com/sfzinstruments/virtuosity_drums)). We need a handful of one-shots, downmixed and trimmed. No brushes. **Recommended.** |
| **VCSL** (Versilian Community Sample Library) | CC0 ([repo](https://github.com/sgossner/VCSL)) | Has membranophone/idiophone folders; drum-kit coverage not confirmed ([repo](https://github.com/sgossner/VCSL)) **(unverified)** | Possible source of a woodblock/click. |
| **DRSKit** (DrumGizmo) | CC BY 4.0; attribution required ([kit page](https://drumgizmo.org/wiki/doku.php?id=kits:drskit)) | Kick, snare, hi-hat, ride (a Paiste 602 thin crash used as ride); no ride bell or pedal hat listed (same page) | 13 mic channels. Rock-oriented, weaker fit. |
| **AVL Drumkits** (Black Pearl jazz kit) | CC BY-SA 3.0 ([repo](https://github.com/studiorack/avl-drumkits)) | Full kits, piece list not confirmed **(unverified)** | ShareAlike on the samples complicates redistribution in a public app. Avoid unless needed. |
| **Synthesized click** | n/a | Click (accented + normal) | `OscillatorNode` burst; or the CC0 Ardour/MuseScore metronome samples ([MuseScore forum](https://musescore.org/en/node/320431)). |

---

## Risks

- **Triplet/swing semantics**: the "triplets are not swung" and "sixteenths swing proportionally" rules are my reading of musical practice, not a spec. Validate them by ear in the Swing and groove playback check.
- **Output-latency reporting** is inconsistent across browsers and hardware (see the Firefox notes above), so the highlight may need the manual calibration offset.
- **Main-thread stalls longer than the lookahead** (100 ms), e.g. heavy notation re-rendering during playback, cause late notes because past-due `start()` plays immediately ([spec](https://webaudio.github.io/web-audio-api/#dom-audioscheduledsourcenode-start)). Mitigate with the Worker timer, a larger lookahead (at the cost of slower tempo/loop response), and not re-rendering notation on every frame.
- **Bluetooth headphones** add large, variable latency **(unverified magnitude)**. Document "use wired".
- **Rolling our own scheduler** means owning edge cases: cancelling scheduled notes on stop or loop change, and tempo change at a loop boundary. Tone.js is the fallback if this grows.

---

## Sources

- W3C Web Audio API 1.1, Editor's Draft (9 Sep 2026): https://webaudio.github.io/web-audio-api/ (currentTime, start(when), AudioTimestamp, getOutputTimestamp, baseLatency/outputLatency, latencyHint, renderSizeHint)
- MDN browser-compat-data, AudioContext: https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/AudioContext.json
- MDN outputLatency: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/outputLatency
- MDN getOutputTimestamp: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/getOutputTimestamp
- MDN Autoplay guide: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay
- Chris Wilson, "A tale of two clocks" (web.dev, 2013): https://web.dev/articles/audio-scheduling
- Chrome 88 timer throttling: https://developer.chrome.com/blog/timer-throttling-in-chrome-88
- Chromium `media/base/audio_latency.cc`: https://chromium.googlesource.com/chromium/src/+/main/media/base/audio_latency.cc
- Mozilla Bugzilla 1564422: https://bugzilla.mozilla.org/show_bug.cgi?id=1564422
- Microsoft Learn, Low Latency Audio: https://learn.microsoft.com/en-us/windows-hardware/drivers/audio/low-latency-audio
- jefftk, Browser Audio Latency (2021): https://www.jefftk.com/p/browser-audio-latency
- Tone.js repo: https://github.com/Tonejs/Tone.js ; Transport.ts: https://raw.githubusercontent.com/Tonejs/Tone.js/dev/Tone/core/clock/Transport.ts ; Context.ts: https://raw.githubusercontent.com/Tonejs/Tone.js/dev/Tone/core/context/Context.ts ; Draw.ts: https://raw.githubusercontent.com/Tonejs/Tone.js/dev/Tone/core/util/Draw.ts ; TickSource.ts: https://raw.githubusercontent.com/Tonejs/Tone.js/dev/Tone/core/clock/TickSource.ts
- npm registry, tone: https://registry.npmjs.org/tone ; waaclock: https://registry.npmjs.org/waaclock
- WAAClock: https://github.com/sebpiq/WAAClock
- Virtuosity Drums: https://versilian-studios.com/virtuosity-drums/ ; https://github.com/sfzinstruments/virtuosity_drums
- VCSL: https://github.com/sgossner/VCSL
- DrumGizmo DRSKit: https://drumgizmo.org/wiki/doku.php?id=kits:drskit
- AVL Drumkits: https://github.com/studiorack/avl-drumkits
- CC0 metronome samples (MuseScore forum): https://musescore.org/en/node/320431
