# 05: Hi-hat foot

**What to build:** A hi-hat foot practice setting (Off / On 1 / Quarters / 2 & 4 / &s) in the Settings sidebar's Groove section. It plays and is written in every bar with any groove, replacing the groove's own hi-hat foot. See [spec](../spec.md) stories 24–30 and [ADR 0010](../../../docs/adr/0010-hi-hat-foot-is-a-practice-setting.md).

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Core: `hihatFoot` practice setting, `'off'` by default; the schema version goes up and stored and imported exercises migrate to `'off'`; export carries it (tested)
- [x] Core: with the setting on, the schedule and staff parts take the groove's hits without its hi-hat foot, plus the setting's hits (`hihatPedal`, groove volume) (tested, with and without the jazz groove)
- [x] It is written in the feet part by the ADR 0004 rules
- [x] The control in the Groove section, on desktop and in the phone's Settings; changeable on examples but not kept
- [x] Checked in the browser at 1280 px and 390 × 844; the by-ear check is left to the user
