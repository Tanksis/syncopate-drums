# Browser audio engine and drum sounds

Type: research
Status: resolved
Blocked by: (none)

## Question

How should the web app schedule sound so the click, the exercise and the groove layer stay sample-accurate and in time for play-along on a Windows laptop with headphones?

- Web Audio lookahead scheduling written by us vs. Tone.js (Transport, swing support, looping) vs. other libraries. Trade-offs, licences, maintenance.
- How swing feel is best implemented (offsetting off-beat eighths by a swing amount) and how it interacts with triplets and sixteenths.
- Tempo or loop-range changes while playing; the count-in; separate volumes for click / exercise / groove layer.
- Keeping a visual playhead/note highlight in sync with audio (AudioContext.currentTime, outputLatency/baseLatency, requestAnimationFrame).
- Output latency realities on Windows browsers (Chrome/Edge/Firefox) and whether it matters for play-along when the user's own kit is heard directly.
- Sources of good drum samples (snare, bass drum, ride, ride bell, hi-hat closed/foot, click) with licences that allow a possible future public app.

Answer with a recommendation plus the facts the **Swing and groove playback check** and **Tech stack** tickets need.

## Answer

Write our own small lookahead scheduler on raw Web Audio: a Worker timer every ~25 ms schedules `AudioBufferSourceNode.start(when)` for notes in the next ~100 ms. Don't use Tone.js's Transport. Its sine-shaped swing moves eighth triplets and moves sixteenths unevenly, so we'd have to compute swing ourselves anyway; keep Tone.js (MIT, active) as the fallback.

- Swing is a piecewise-linear warp of binary-grid positions per beat, with ratio 50% (straight), 66.7% (triplet) or 75% (dotted). Triplet-grid notes are not warped.
- Use three GainNodes (click / exercise / groove) feeding a master gain.
- Highlight notes in rAF against `getOutputTimestamp()` ("audible now"), plus a calibration offset.
- Constant output latency on Windows (10 ms default WASAPI buffers) doesn't hurt play-along with wired headphones; avoid Bluetooth.
- Samples: Virtuosity Drums (CC0) has kick, snare, ride, ride bell and hi-hat closed/pedal. Synthesize the click.

Details: [Browser audio engine research](../../../docs/research/browser-audio-engine.md)
