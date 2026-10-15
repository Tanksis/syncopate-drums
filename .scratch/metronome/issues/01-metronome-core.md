# 01: Metronome core

**What to build:** `src/core/metronome.ts`: the metronome settings and defaults, `withTimeSignature`, `cycleLevel`, the 12 subdivision patterns, `metronomeSchedule`, `tapTempo` and `tempoName`. `DeviceSettings` gains `screen` and `metronome`. See [spec](../spec.md), Implementation Decisions › Exercise core, and stories 4–10.

**Blocked by:** none

**Status:** done (merged in PR #97, 2026-10-15)

- [x] `MetronomeSettings`, `BeatLevel`, the subdivision ids and patterns, and the defaults (92 BPM, 4/4, Accent-Normal-Normal-Normal, quarters, Wood block)
- [x] `withTimeSignature` resets the levels; `cycleLevel` goes Accent → Normal → Soft → Off → Accent
- [x] `metronomeSchedule` returns the `ScheduleResult` shape, loops forever, and keeps beat length at `60 / bpm` for every note value
- [x] `tapTempo` and `tempoName`
- [x] `DeviceSettings.screen` and `DeviceSettings.metronome`; `deviceSettingsFrom` validates them
- [x] Tests for all of the above (see spec, Testing Decisions)
