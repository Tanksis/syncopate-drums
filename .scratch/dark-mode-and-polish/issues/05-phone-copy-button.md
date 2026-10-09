# 05: Phone Copy button

**What to build:** On the phone, an example has no read-only notice. Instead, its transport bar shows Copy where Edit would be. See [spec](../spec.md) stories 16–17.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Below 640 px, `ExampleNotice` isn't shown. From 640 px up it is unchanged
- [ ] On an example, the transport bar shows a **Copy** button (aria-label "Copy to Library") in Edit's place. Tapping it copies the example and opens the copy, and the button becomes Edit
- [ ] Checked in Playwright WebKit at 390 × 844 with touch, and at 1280 px for no change
