# Swing and groove playback check

Type: prototype
Status: resolved
Blocked by: 02

## Question

Does the planned playback *sound right* to the user? A rough throwaway page using the approach from **Browser audio engine and drum sounds** that plays a hard-coded *Syncopation*-style comping line with:

- each groove preset (jazz ride + hi-hat 2 & 4; + feathered bass drum; straight hi-hat eighths),
- swing feel on/off with an adjustable amount,
- click with accented beat 1, count-in, separate volumes (including muting the exercise),
- tempos from about 60 to 250 BPM.

Also check by ear the two assumptions flagged in the audio research: triplet-grid notes are not warped by swing, and sixteenths are warped proportionally (A/B against straight sixteenths). Log `baseLatency`/`outputLatency` on the user's laptop.

Decide by listening (with the user, on the laptop + headphones): the default swing amount, whether the swing ratio should change with tempo, and whether the sample choices and the approach are good enough to commit to.

## Answer

Decided by listening on the laptop with headphones (2026-10-05), using the [prototype](../prototypes/04-swing-groove-playback/index.html).

- **Default swing amount: 66.7% (triplet swing).** The setting is the amount at slow and medium tempos.
- **Swing gets straighter as the tempo rises, always.** This applies whenever swing feel is on, with no toggle. The prototype's curve: the full amount up to 120 BPM, easing linearly to straight (50%) at 320 BPM (66.7% → about 62% at 180 and 56% at 250). The breakpoints can be tuned during implementation.
- **Triplets stay in place under swing.** Triplet-grid notes are never warped; at 66.7% the third triplet coincides with the swung "&".
- **Sixteenths swing proportionally.** Every binary-grid note goes through the same per-beat warp ("e" halfway through the long eighth, "a" halfway through the short one). No setting.
- **Samples: Virtuosity Drums (CC0) is good enough to commit to**, including the overhead-mic ride, hi-hat pedal/closed, snare and feathered bass drum, with a synthesized click. The ride and hi-hat were a little quiet, so the groove layer's **default level is raised** to sit level with the snare (exact gains tuned during implementation; the volume sliders are unchanged).
- **Approach confirmed**: our own lookahead scheduler, count-in, accented beat 1, and separate click/exercise/groove volumes with exercise mute all worked as intended. The user reported the latency log looked fine; the exact numbers weren't recorded.

## Comments

- 2026-10-05: Prototype built: [swing & groove playback check](../prototypes/04-swing-groove-playback/index.html). Open it by double-clicking; `samples.js` holds Virtuosity Drums one-shots (CC0) as base64 FLAC. It has six guided listening scenarios (default groove, triplet A/B, sixteenth A/B, tempo extremes, click/count-in/volumes, kit sound and latency). Waiting on the user's listening session.
- 2026-10-06: Extended by [Screen layout](10-screen-layout.md): swing preset buttons (light 58%, medium 62%, triplet 66.7%, dotted 75%); default unchanged.
