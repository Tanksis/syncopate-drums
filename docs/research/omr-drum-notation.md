# OMR for Drum Notation: Feasibility and v1 Recommendation

Researched: 2026-10-05. Scope: Can the app photograph a bar from Ted Reed's *Syncopation* and turn it into structured bars for sticking, metronome playback and a swing ride/hi-hat overlay? Every claim cites a source. Anything not confirmed from a primary source is marked **(unverified)**.

---

## TL;DR

**Recommendation: leave camera/photo import out of v1.** Build v1 around a fast manual rhythm-entry grid (eighths, quarters, triplets, rests, ties). Run photo import as a **separate, time-boxed spike** and only ship it in v1.x if the spike passes a measured accuracy bar.

Why:

1. **No off-the-shelf OMR reliably handles drum notation from phone photos, and none can be embedded easily.**
   - **Audiveris** has had drum support since 5.3 ([docs](https://audiveris.github.io/audiveris/_pages/guides/specific/drums/)). But its tracker shows open problems right now: cross noteheads are under-detected, sometimes "fewer than half the crosses" ([#1059](https://github.com/Audiveris/audiveris/issues/1059), opened 2026-09-23). About half of drum charts fail at the LINKS step after a recent change ([#1100](https://github.com/Audiveris/audiveris/issues/1100), opened 2026-10-01). Single-line snippets break its scale detection ([discussion #672](https://github.com/Audiveris/audiveris/discussions/672)).
   - **homr** is built for photos and actively maintained, but it only reads treble and bass clefs ([README](https://github.com/liebharc/homr)).
   - **oemer** crashes on drum scores, and its maintainer closed the drum request as "not planned" ([#77](https://github.com/BreezeWhite/oemer/issues/77), [#83](https://github.com/BreezeWhite/oemer/issues/83)).
   - **Soundslice** has the strongest percussion scanner I found ([scanner page](https://soundslice.com/sheet-music-scanner)). But it explicitly has **no API** for it ([data API docs](https://www.soundslice.com/help/data-api/)).
2. **Our input is the easy case for OMR, but nothing is tuned for it.** It is one monophonic rhythm line with a small symbol set: notes, rests, beams, triplet brackets, ties, dots. We only need *onsets and durations*, not pitch. That makes a narrow custom reader, or a vision-LLM prompt with a strict JSON schema, plausible. The evidence is thin, though:
   - Published LLM benchmarks show poor general sheet-music reading. GPT-4o scored 4.0% on a note-recognition task in MusiXQA ([arXiv 2506.23009](https://arxiv.org/html/2506.23009v3)).
   - No published evaluation tests current Claude models on rhythm-only reading. We would have to measure it ourselves.
3. **Licensing and runtime weigh against embedding.** Audiveris and homr are AGPL-3.0. Audiveris is Java desktop software, and homr is a Python pipeline. Running either on a server triggers AGPL's network-use clause. Neither runs on iOS today. An Android port of homr exists and takes about 30 s per page on-device ([Andromr](https://github.com/aicelen/Andromr)).

**Prototype order for the spike:**

1. **Vision-LLM (Claude API) photo → rhythm JSON.** This is the cheapest to try: a few hundred lines of code, any platform, and it outputs our domain model directly. Validate it on a 30-photo test set (see the [LLM section](#vision-llm-alternative)).
2. **homr as a baseline on the same test set.** If *Syncopation*'s exercises are printed on a standard 5-line staff with a treble-style clef **(unverified; check the physical book)**, a pitched OMR can read the rhythm and we can ignore the pitch. If they use a percussion clef, homr is likely out.
3. **Audiveris CLI with drum switches** as a third data point. Expect friction given the open issues.

**Platform implications:**

- Any photo import in the near term needs **a network call** (LLM API) or **a server/desktop process** (Audiveris/homr). Fully on-device iOS OMR is not available off the shelf.
- If v1 has no photo import, platform choice is driven by **rendering and audio timing** instead. The best free drum-capable renderers are web/JS: VexFlow, OpenSheetMusicDisplay, alphaTab. That favours web, or a web-tech shell (Tauri/Electron/Capacitor), unless native iOS audio latency becomes the deciding factor.

---

## Comparison table

| Tool | Type / License | Maintenance (as checked 2026-10-05) | Output | Runtime | Third-party API? | Drum / percussion handling | Phone photos |
|---|---|---|---|---|---|---|---|
| **Audiveris** | OSS, AGPL-3.0 ([repo](https://github.com/Audiveris/audiveris)) | Active: 5.11.0 released 2026-07-11 ([releases API](https://api.github.com/repos/Audiveris/audiveris/releases?per_page=5)) | MusicXML 4.0, `.omr` project XML ([repo](https://github.com/Audiveris/audiveris)) | Java desktop (Win/macOS/Linux installers with bundled JRE) ([repo](https://github.com/Audiveris/audiveris)) | CLI/batch mode is used in issue reports ([#1059](https://github.com/Audiveris/audiveris/issues/1059)). No hosted API. | Supported since 5.3: percussion clef, 1-line and 5-line staves, cross/diamond/etc. heads, but must be switched on per book ([drums guide](https://audiveris.github.io/audiveris/_pages/guides/specific/drums/)). Open bugs on cross heads and crashes ([#1059](https://github.com/Audiveris/audiveris/issues/1059), [#1100](https://github.com/Audiveris/audiveris/issues/1100)). | Targets scanned full pages. Snippets and low resolution fail ([#672](https://github.com/Audiveris/audiveris/discussions/672)). |
| **homr** | OSS, AGPL-3.0 ([PyPI](https://pypi.org/pypi/homr/json)) | Very active: commits 2026-10-04, v0.7.0 on 2026-06-26 ([commits](https://api.github.com/repos/liebharc/homr/commits?per_page=3), [PyPI](https://pypi.org/pypi/homr/json)) | MusicXML ([repo](https://github.com/liebharc/homr)) | Python 3.11/3.12, CPU/CUDA/ROCm ([README](https://raw.githubusercontent.com/liebharc/homr/main/README.md)). Android port Andromr runs on-device ([Andromr](https://github.com/aicelen/Andromr)). | No. Library/CLI plus a web demo, homr.site ([README](https://raw.githubusercontent.com/liebharc/homr/main/README.md)) | Treble and bass clef only. No percussion mentioned ([repo](https://github.com/liebharc/homr)). No drum issues found in the tracker ([issue search](https://api.github.com/search/issues?q=repo:liebharc/homr+percussion+OR+drum)). | Designed for camera pictures ([repo](https://github.com/liebharc/homr)) |
| **oemer** | OSS, MIT ([PyPI](https://pypi.org/pypi/oemer/json)) | Stale: v0.1.8 on 2024-11-16; last commits are README edits from 2025-04 ([PyPI](https://pypi.org/pypi/oemer/json), [commits](https://api.github.com/repos/BreezeWhite/oemer/commits?per_page=3)) | MusicXML ([repo](https://github.com/BreezeWhite/oemer)) | Python, ONNX Runtime by default ([repo](https://github.com/BreezeWhite/oemer)) | No | Fails. Crash on a drum score ([#77](https://github.com/BreezeWhite/oemer/issues/77)). Drum support closed as "not planned" ([#83](https://github.com/BreezeWhite/oemer/issues/83)). | Claims to handle skewed phone photos ([repo](https://github.com/BreezeWhite/oemer)) |
| **LEGATO** (research model) | Model weights MIT, gated download on Hugging Face ([HF](https://huggingface.co/guangyangmusic/legato)) | ICLR 2026 paper ([ICLR](https://iclr.cc/virtual/2026/poster/10009474)) | ABC notation ([HF](https://huggingface.co/guangyangmusic/legato)) | GPU, about 20 GB+ VRAM at full precision ([HF](https://huggingface.co/guangyangmusic/legato)) | No | Not mentioned. Trained mainly on synthetic typeset data ([HF](https://huggingface.co/guangyangmusic/legato)). | May degrade on low-quality scans ([HF](https://huggingface.co/guangyangmusic/legato)) |
| **Soundslice scanner** | Commercial SaaS ([scanner](https://soundslice.com/sheet-music-scanner)) | Active: percussion scanner improvements 2025-05-02 ([blog](https://www.soundslice.com/blog/288/tons-of-percussion-improvements/)) | MusicXML/MIDI export from the UI ([scanner](https://soundslice.com/sheet-music-scanner)) | Web | **No.** "Our PDF/image upload scanner does not have an API" ([data API](https://www.soundslice.com/help/data-api/)) | Best evidence found: detects percussion clefs, percussion noteheads, single-line percussion, and L/R stickings ([scanner](https://soundslice.com/sheet-music-scanner), [blog](https://www.soundslice.com/blog/288/tons-of-percussion-improvements/)) | Yes: JPG/PNG/HEIC etc., tolerant of bad lighting ([scanner](https://soundslice.com/sheet-music-scanner)) |
| **PlayScore 2 / ReadScoreLib** | Commercial app. The OMR library "ReadScoreLib" is offered under licence to developers ([SeeScore](https://www.seescore.co.uk/?p=6), per search snippet; licence terms **unverified**) | Active app (date **unverified**) | MusicXML, MIDI ([features](https://www.playscore.co/features/)) | App: iOS/Android/Windows ([features](https://www.playscore.co/features/)). ReadScoreLib "cross-platform" (**unverified**) | Possibly, via ReadScoreLib licence. Price and terms **unverified**. | "Percussion and drums – Playback and MusicXML" ([features](https://www.playscore.co/features/)). Single-line staves not mentioned. | Yes (camera app) |
| **Newzik Maestria** | Commercial ([Maestria](https://newzik.com/en/maestria)) | Newzik OMR 2.8.0 released 2024-10-23 ([support](https://support.newzik.com/en/support/solutions/articles/77000574465-newzik-omr-2-8-0)) | MusicXML, MIDI ([Maestria](https://newzik.com/en/maestria)) | iOS app, web ([Maestria](https://newzik.com/en/maestria)) | The site nav lists "Our OMR API" ([Maestria](https://newzik.com/en/maestria)). Docs, pricing and access **unverified**. | No percussion mention found. Pitched as best at classical notation (**unverified** marketing). | Photos supported ([Maestria](https://newzik.com/en/maestria)) |
| **SmartScore (Musitek)** | Commercial desktop | **unverified** | **unverified** (MusicXML likely) | Win/macOS desktop | None found ([help](https://www.musitek.com/smartscore-online-help/songbook/drums_and_percussion/drum_track.php?os=win)) | Attempts to read percussion staves with fewer than 5 lines and a box clef ([help](https://www.musitek.com/smartscore-online-help/songbook/drums_and_percussion/drum_track.php?os=win)) | **unverified** |
| **ScanScore** | Commercial desktop/app | **unverified** | **unverified** | **unverified** | None found | No primary-source evidence found | **unverified** |
| **Vision LLM (Claude API)** | Commercial API ([vision docs](https://platform.claude.com/docs/en/build-with-claude/vision)) | n/a | Whatever schema we prompt for, e.g. rhythm JSON | Network call from any client, or via our server | Yes | Untested for drum notation. General sheet-music reading by MLLMs is weak in published benchmarks ([MusiXQA](https://arxiv.org/html/2506.23009v3)). | Yes. JPEG/PNG/GIF/WebP, up to 8000×8000 px ([vision docs](https://platform.claude.com/docs/en/build-with-claude/vision)). |

---

## Per-tool details

### Audiveris

- **What it is:** The most mature open-source OMR engine. AGPL-3.0, Java, with desktop installers that bundle a JRE. It exports MusicXML 4.0 ([repo](https://github.com/Audiveris/audiveris)). Releases are frequent: 5.9.0 (2025-12-10) through 5.11.0 (2026-07-11). Recent release notes fix percussion-clef NPEs ([releases API](https://api.github.com/repos/Audiveris/audiveris/releases?per_page=5)).
- **Drum support:** Added in 5.3 ([drums guide](https://audiveris.github.io/audiveris/_pages/guides/specific/drums/)):
  - percussion clef
  - 1-line and 5-line unpitched staves
  - head motifs: oval, cross, diamond, triangle, circle, small
  - open/half-open/closed signs
  - a configurable `drum-set.xml` mapping
  - The switches "1-line percussion staves" and "5-line unpitched percussion staves" **must be enabled** per book (or via CLI constants).
- **Evidence of current quality (thin, but recent and negative):**
  - Cross heads score far below ovals, and "fewer than half the crosses" are detected on some engravings. Open ([#1059](https://github.com/Audiveris/audiveris/issues/1059), 2026-09-23).
  - About half of drum charts fail at the LINKS step after PR #1065, with an NPE. Open ([#1100](https://github.com/Audiveris/audiveris/issues/1100), 2026-10-01).
  - Clefless 5-line staves were not treated as drums. A fix was proposed ([#1061](https://github.com/Audiveris/audiveris/issues/1061), [PR #1062](https://github.com/Audiveris/audiveris/pull/1062)).
  - A single-line drum snippet failed at the SCALE step: "With an interline value of 9 pixels, either this sheet contains no staves, or the picture resolution is too low (try 300 DPI)". The maintainer said snippets are an edge case because Audiveris targets full sheets ([discussion #672](https://github.com/Audiveris/audiveris/discussions/672), 2023).
- **Fit for us:** Poor for phone photos of a single bar. It might work on a flat, high-resolution scan of a full *Syncopation* page with switches set (**unverified**). Integration would mean a desktop sidecar or a server, and AGPL obligations apply.

### homr

- **What it is:** AGPL-3.0 Python OMR built for camera photos. The pipeline is UNet segmentation, then staff detection, then a transformer symbol recogniser, then a MusicXML writer ([repo](https://github.com/liebharc/homr)). It is very actively developed: commits on 2026-10-04 and 0.7.0 on PyPI on 2026-06-26 ([commits](https://api.github.com/repos/liebharc/homr/commits?per_page=3), [PyPI](https://pypi.org/pypi/homr/json)).
- **Scope limitation:** It "focuses on pitch and rhythm information on the bass or treble clef, neglecting dynamics, articulation, double sharps/flats, and other musical symbols" ([repo](https://github.com/liebharc/homr)). No percussion support is documented, and an issue search for "percussion OR drum" returned nothing relevant ([search](https://api.github.com/search/issues?q=repo:liebharc/homr+percussion+OR+drum)).
- **Mobile evidence:** Andromr (AGPL-3.0) runs homr fully on-device on Android. It uses LiteRT for segmentation and the encoder, ONNX Runtime for the decoder, and takes about 30 s per page ([Andromr](https://github.com/aicelen/Andromr)). This suggests an iOS port with Core ML or ONNX Runtime is *technically* possible, but it would be substantial work (**unverified**; no iOS port found).
- **Fit for us:** This is the best open-source candidate *if* the source staff looks like a treble staff, so that rhythm survives and pitch is discarded. Whether *Syncopation* uses a percussion clef or another clef is **unverified**. Check the physical book before testing.

### oemer

- MIT license, Python with ONNX Runtime, outputs MusicXML. It claims to handle skewed phone photos ([repo](https://github.com/BreezeWhite/oemer)).
- It is effectively unmaintained: last release 0.1.8 (2024-11-16), and recent commits are README-only ([PyPI](https://pypi.org/pypi/oemer/json), [commits](https://api.github.com/repos/BreezeWhite/oemer/commits?per_page=3)).
- **Drums:** It crashed with an `IndexError` on a drum score ([#77](https://github.com/BreezeWhite/oemer/issues/77), open). A request to read drum notation was closed "not planned" ([#83](https://github.com/BreezeWhite/oemer/issues/83)).
- **Fit:** Not recommended.

### LEGATO (research)

- An end-to-end OMR model that outputs ABC notation. It reuses the Llama 3.2 11B Vision encoder and has a trained decoder. Weights are MIT-licensed but gated on Hugging Face, and it needs about 20 GB+ GPU memory at full precision ([HF](https://huggingface.co/guangyangmusic/legato), [ICLR 2026](https://iclr.cc/virtual/2026/poster/10009474)).
- It is trained mainly on synthetic typeset data. Percussion is not mentioned.
- **Fit:** Server-only research code. Interesting as a future fine-tuning base, not for v1.

### RhythmForm dataset (research, drum-specific)

- A dataset of 150,000 synthetic drum scores (PDF, PNG, MusicXML and "Symbolic Music Text") generated by a Markov chain. It is explicitly intended to train a transformer that converts images of drum scores to digital notation (per search-result snippet of the [EIDF catalogue entry](https://catalogue.eidf.ac.uk/dataset/37386d4f-92b4-4390-b11a-bed220cbc54c); the page returned HTTP 502 when fetched, so **license, authors and any released model are unverified**).
- **Fit:** This is the only drum-specific OMR training resource found. It is relevant if we ever train a custom reader. No public trained model was found.

### Soundslice scanner

- It detects percussion clefs, percussion noteheads and single-line percussion. Since 2025-05 it also imports "L"/"R" stickings and offers "Convert to percussion" ([scanner](https://soundslice.com/sheet-music-scanner), [blog 2025-05-02](https://www.soundslice.com/blog/288/tons-of-percussion-improvements/)).
- It accepts photos (JPG/PNG/HEIC/WEBP...) and claims tolerance for wavy staves and bad lighting. When uncertain, it asks the user. Exports MusicXML ([scanner](https://soundslice.com/sheet-music-scanner)).
- **No API for scanning:** "This does *not* support our PDF/image scan feature; our PDF/image upload scanner does not have an API." Notation upload accepts only MusicXML/Guitar Pro/PowerTab/TuxGuitar ([data API](https://www.soundslice.com/help/data-api/)).
- **Fit:** It cannot be integrated. It is useful as a **benchmark/oracle**: run our test photos through it manually to see what "good" looks like. Users could also scan there and import MusicXML into our app, if we support MusicXML import.

### PlayScore 2 / ReadScoreLib

- The PlayScore 2 app lists "Percussion and drums – Playback and MusicXML" and runs on iOS, Android and Windows ([features](https://www.playscore.co/features/)).
- The OMR engine "ReadScoreLib" is described as a cross-platform OMR library that generates MIDI and MusicXML from an image and "is available under licence to developers". This comes from a search snippet of [seescore.co.uk](https://www.seescore.co.uk/?p=6). The fetched page itself only described the SeeScoreLib *renderer* SDK for iOS/macOS/Android/Windows, so **ReadScoreLib terms, pricing, on-device support and drum quality are unverified**.
- **Fit:** This is the only commercial lead that might offer **on-device iOS OMR with drum support**. It is worth one email if photo import becomes a priority.

### Newzik Maestria

- An AI OMR that turns photos/PDFs into "LiveScores" with MusicXML/MIDI export, on iOS and web. The site navigation lists "Our OMR API" ([Maestria](https://newzik.com/en/maestria)). The guessed API URL returned 404, so **API docs, pricing and percussion support are unverified**. No percussion mention was found.

### SmartScore, ScanScore

- **SmartScore** help says it "will attempt to correctly 'read' percussion parts (usually containing less than the usual 5 staff lines) whose 'clef' is normally a rectangular box" ([Musitek help](https://www.musitek.com/smartscore-online-help/songbook/drums_and_percussion/drum_track.php?os=win)). I found no SDK or API.
- **ScanScore:** No primary-source information on percussion or an API was found (**unverified**).

---

## Vision-LLM alternative

### How it would work

The app sends a cropped photo of one or more bars to a multimodal model. The prompt asks for strict JSON in our own domain model. Example: `{"timeSignature":"4/4","bars":[{"events":[{"type":"note","duration":"8th","tuplet":null,"tiedToNext":false}, ...]}]}`. The app then validates it: each bar's durations must sum to the time signature, which catches many errors automatically. The user then confirms or edits the result in the same grid editor v1 already needs.

### What the vendor docs establish (Claude API)

From the [vision docs](https://platform.claude.com/docs/en/build-with-claude/vision):

- **Input:** Images are sent as base64, URL, or Files API `file_id`. Formats are JPEG/PNG/GIF/WebP, up to 8000×8000 px and 10 MB per image on the direct API.
- **Token cost:** About `⌈w/28⌉ × ⌈h/28⌉` visual tokens per image. Claude 4.7+ models use a high-resolution tier (max long edge 2576 px, 4784 tokens). Older models use 1568 px / 1568 tokens.
- **Cost examples from the docs:** A 1000×1000 image is about 1,296 tokens. That is about **$1.30 per 1,000 images** on Claude Haiku 4.5 ($1/M input) and about **$6.48 per 1,000 images** on Claude Opus 5 ($5/M input). Output tokens for the JSON and the prompt text add to this. Check the current output pricing at [claude.com/pricing](https://claude.com/pricing). Practical takeaway: about a cent or less per scan, so cost is not the blocker. Accuracy is.
- **Documented limitations relevant here:**
  - It "might hallucinate or make mistakes when interpreting low-quality, rotated, or very small images".
  - Spatial outputs are approximate.
  - Counting "might not always be precisely accurate, especially with large numbers of small objects". Counting beams, flags and triplet groups is exactly this kind of task.

### Published evidence on LLMs reading notation (thin, mostly negative, none on Claude)

- **MusiXQA:**
  - On an OMR note-recognition task, GPT-4o zero-shot reached **4.0%** GPT-judged accuracy.
  - Open baselines scored 0.4%.
  - A fine-tuned Phi-3 reached 68.4%.
  - No Claude or Gemini models were evaluated. Images are synthetic MusiXTeX renders, not photos ([arXiv 2506.23009](https://arxiv.org/html/2506.23009v3)).
- **MuseAgent-1:** Reports that GPT-4o, Gemini 2.0 and Qwen models struggle with precise score interpretation ([arXiv 2601.11968](https://www.arxiv.org/pdf/2601.11968)).
- **SSMR-Bench:** Synthesizes sheet-music questions in visual form for evaluation and RL. I could not extract its per-model visual rhythm numbers ([arXiv 2509.04059](https://arxiv.org/pdf/2509.04059v1.pdf)) (**unverified**).
- **Caveat:** These benchmarks test pitched, often polyphonic notation and are 1 to 2 model generations old. Our task is much narrower: one line, rhythm only, about 8 to 16 events per bar. **How current models do on it is unknown and must be measured.** Do not assume it works.

### Tradeoffs

- **Pros:**
  - Tiny implementation.
  - Platform-agnostic.
  - Outputs our domain model directly, with no MusicXML parsing.
  - Can be told the book's conventions, e.g. "all notes are snare; ignore pitch."
  - Improves as models improve.
- **Cons:**
  - Needs a network connection. Calling from a client means either shipping an API key (no) or running a small proxy server with auth and rate limits.
  - Per-call cost.
  - Latency of seconds (**unverified** exact figure).
  - Non-deterministic.
  - Plausible-looking wrong answers. Mitigate with the bar-sum check, a confirm/edit UI, and optionally two passes or a self-consistency vote.
  - Privacy: photos of copyrighted pages go to a third party. Per the [docs FAQ](https://platform.claude.com/docs/en/build-with-claude/vision), Anthropic does not train on uploaded images.

### How to validate cheaply (recommended spike, about 1 to 2 days)

1. **Test set:** 30 phone photos of *Syncopation* bars/lines, all from your own copy:
   - 10 straight eighth/quarter lines
   - 10 with triplets and ties
   - 5 with rests and dotted notes
   - 5 deliberately bad photos: angled, dim, partial
2. **Ground truth:** Hand-write the expected JSON for each, using the same schema the app will use.
3. **Harness:** A script that sends each photo with a fixed prompt and JSON schema, then scores:
   - **bar exact-match rate** (the main metric)
   - **event-level edit distance** over (duration, rest/note, tuplet, tie) tokens
   - **bar-sum validity rate**
   - **latency and cost per call**
4. **Compare:** Two or three models, e.g. a Haiku-class and an Opus-class model. Also try homr, and Audiveris if its clef handling applies, on the same photos. Soundslice can serve as a manual oracle.
5. **Go/no-go bar (suggested):** at least 90% bar exact-match on good photos, and failures that are *detectable* (bar-sum check or obvious) rather than silent. If it misses, keep manual entry and revisit when models improve.

---

## Rendering and playback libraries (brief)

| Library | License | Drum notation | Playback | Platforms |
|---|---|---|---|---|
| VexFlow 5 | MIT ([repo](https://github.com/vexflow/vexflow)) | Renders notation and tabs. Percussion clef / x-head specifics not confirmed in the README (**unverified**; believed supported). | None | Browser, Node (Canvas/SVG) |
| OpenSheetMusicDisplay | BSD-3 ([repo](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay)) | Renders MusicXML via VexFlow. Percussion detail **unverified**. | Free version: none. Playback is early access for sponsors. | Browser, Node. Native React Native/Android/iOS modules for sponsors only. |
| alphaTab | MPL-2.0 (**unverified**) | Drum notation and drum tabs ([docs](https://www.alphatab.net/docs/guides/percussion)) | Built-in SoundFont synth ([docs](https://www.alphatab.net/docs/guides/percussion)) | Web (JS), .NET, Android. iOS native not mentioned. |

**Implication:** The strongest free drum-rendering and playback stack is web-based. A native iOS app would need its own renderer (or a WebView) and its own audio scheduling. Our needs (one snare line plus a ride/hi-hat overlay) are simple enough that a custom renderer is also feasible.

---

## Open questions and risks

1. **How is *Syncopation* engraved?** Is it a percussion clef or a treble clef with snare on one line/space? Are there beams across beats, and how are triplets marked? This decides whether pitched OMR (homr) is usable at all. **Unverified. Check the physical book.**
2. **Copyright.** *Syncopation* is a commercial Alfred publication. The app must not bundle its exercises. Letting users photograph their own copy for personal practice is probably fine, but this is **unverified legal territory**. Sending page photos to a third-party API adds a further consideration.
3. **AGPL exposure.** Embedding or serving Audiveris or homr would require releasing our app's source under AGPL. Andromr shows the pattern of an AGPL app. Decide early whether the app will be open source.
4. **Server requirement.** Every viable photo path (LLM, Audiveris, homr) currently implies a backend or desktop sidecar unless we invest in an on-device port. This affects hosting cost, auth, and offline use.
5. **Audiveris drum regressions** are being filed and fixed right now (Sept/Oct 2026). Quality may change quickly in either direction. Re-check before deciding.
6. **ReadScoreLib and Newzik API** terms are unknown. These are the only possible on-device/commercial routes with any drum claim (PlayScore). One inquiry each would close this gap.
7. **LLM accuracy is unmeasured** for this narrow task. The spike above is the cheapest way to find out.
8. **Comping exercises** (snare and bass drum on two lines, or with ride cymbal written) are harder than single-line reading. Scope photo import to single-line rhythms first.

---

## Sources

**Audiveris**
- Repo and license: https://github.com/Audiveris/audiveris
- Releases (API): https://api.github.com/repos/Audiveris/audiveris/releases?per_page=5
- Drums guide: https://audiveris.github.io/audiveris/_pages/guides/specific/drums/
- Issue #1059 (cross heads): https://github.com/Audiveris/audiveris/issues/1059
- Issue #1100 (LINKS failures): https://github.com/Audiveris/audiveris/issues/1100
- Issue #1061: https://github.com/Audiveris/audiveris/issues/1061
- PR #1062: https://github.com/Audiveris/audiveris/pull/1062
- Discussion #672 (single-line snippet): https://github.com/Audiveris/audiveris/discussions/672

**homr and Andromr**
- homr repo: https://github.com/liebharc/homr
- homr README: https://raw.githubusercontent.com/liebharc/homr/main/README.md
- homr commits: https://api.github.com/repos/liebharc/homr/commits?per_page=3
- homr on PyPI: https://pypi.org/pypi/homr/json
- homr issue search: https://api.github.com/search/issues?q=repo:liebharc/homr+percussion+OR+drum
- Andromr: https://github.com/aicelen/Andromr

**oemer**
- Repo: https://github.com/BreezeWhite/oemer
- PyPI: https://pypi.org/pypi/oemer/json
- Commits: https://api.github.com/repos/BreezeWhite/oemer/commits?per_page=3
- Issue #77: https://github.com/BreezeWhite/oemer/issues/77
- Issue #83: https://github.com/BreezeWhite/oemer/issues/83

**Research models and datasets**
- LEGATO on Hugging Face: https://huggingface.co/guangyangmusic/legato
- LEGATO at ICLR 2026: https://iclr.cc/virtual/2026/poster/10009474
- RhythmForm dataset: https://catalogue.eidf.ac.uk/dataset/37386d4f-92b4-4390-b11a-bed220cbc54c (fetch failed; search snippet only)

**Commercial OMR**
- Soundslice scanner: https://soundslice.com/sheet-music-scanner
- Soundslice percussion improvements blog: https://www.soundslice.com/blog/288/tons-of-percussion-improvements/
- Soundslice data API: https://www.soundslice.com/help/data-api/
- PlayScore 2 features: https://www.playscore.co/features/
- SeeScore / ReadScoreLib: https://www.seescore.co.uk/?p=6
- Newzik Maestria: https://newzik.com/en/maestria
- Newzik OMR 2.8.0: https://support.newzik.com/en/support/solutions/articles/77000574465-newzik-omr-2-8-0
- SmartScore help: https://www.musitek.com/smartscore-online-help/songbook/drums_and_percussion/drum_track.php?os=win

**Vision LLMs**
- Claude vision docs: https://platform.claude.com/docs/en/build-with-claude/vision
- Claude pricing: https://claude.com/pricing
- MusiXQA: https://arxiv.org/html/2506.23009v3
- MuseAgent-1: https://www.arxiv.org/pdf/2601.11968
- SSMR-Bench: https://arxiv.org/pdf/2509.04059v1.pdf

**Rendering and playback**
- VexFlow: https://github.com/vexflow/vexflow
- OpenSheetMusicDisplay: https://github.com/opensheetmusicdisplay/opensheetmusicdisplay
- alphaTab percussion guide: https://www.alphatab.net/docs/guides/percussion
