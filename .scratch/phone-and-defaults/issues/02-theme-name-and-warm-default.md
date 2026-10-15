# 02: "Theme", with Warm the default

**What to build:** Appearance's Look menu is labelled Theme, and the light-only hint reads "‹Theme› is light only" as before. Warm is the default for a new device, and the launch script falls back to Warm. CONTEXT.md names it Theme. See [spec](../spec.md) 2.

**As built:** only the label and the default change; the code, the stored key and the launch-script mirror keep `look`. A device that already saved settings keeps its look (Studio, if never changed); a new one starts in Warm.

**Status:** done

- [x] The menu reads Theme
- [x] A fresh device starts in Warm, with no Studio frame at launch
