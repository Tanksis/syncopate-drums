# 01: Metronome core

**What to build:** `src/core/metronome.ts`: the metronome settings and defaults, `withTimeSignature`, `cycleLevel`, the 12 subdivision patterns, `metronomeSchedule`, `tapTempo` and `tempoName`. `DeviceSettings` gains `screen` and `metronome`. See [spec](../spec.md), Implementation Decisions › Exercise core, and stories 4–10.

**Blocked by:** none

**Status:** ready-for-agent

- [ ] `MetronomeSettings`, `BeatLevel`, the subdivision ids and patterns, and the defaults (92 BPM, 4/4, Accent-Normal-Normal-Normal, quarters, Wood block)
- [ ] `withTimeSignature` resets the levels; `cycleLevel` goes Accent → Normal → Soft → Off → Accent
- [ ] `metronomeSchedule` returns the `ScheduleResult` shape, loops forever, and keeps beat length at `60 / bpm` for every note value
- [ ] `tapTempo` and `tempoName`
- [ ] `DeviceSettings.screen` and `DeviceSettings.metronome`; `deviceSettingsFrom` validates them
- [ ] Tests for all of the above (see spec, Testing Decisions)
