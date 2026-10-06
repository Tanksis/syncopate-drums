# Tech stack and storage

Type: grilling
Status: resolved
Blocked by: 01, 02

## Question

What is the web app built with, and where do exercises live?

- UI framework (React / Svelte / Solid / vanilla) and build tooling, given the chosen rendering library and audio engine.
- Local storage for exercises (localStorage vs. IndexedDB) given "each device keeps its own" and a future export/import.
- Hosting: run locally only, or a static host so the laptop just opens a URL? Offline/PWA needed?
- Testing approach for the timing and sticking logic (it must be testable without audio).
- Anything that would block a future public app (licences, AGPL avoidance).

## Answer

Settled in a grilling session (2026-10-05).

- **Language and build**: TypeScript, Vite, single-page app (no SSR, no meta-framework).
- **UI**: React, with **Zustand** for app state so the scheduler and the playback highlight loop can read the exercise and settings outside React (`getState`, `subscribe`). VexFlow draws into its own SVG, and the highlight styles its elements directly in a rAF loop, outside React rendering.
- **Storage**: IndexedDB through `idb`, behind a small repository interface. Call `navigator.storage.persist()`. Each stored exercise carries a schema version for future migrations. Export/import will be JSON of the same model (format still to be decided; see the map).
- **Hosting**: a static host plus a PWA (`vite-plugin-pwa`) so it opens as an installed, offline-capable app window with the samples cached. **Which host** (GitHub Pages vs. Cloudflare/Netlify) is deferred. Note: IndexedDB is per origin, so localhost and the hosted URL keep separate exercise lists.
- **Testing**: timing and sticking live in pure modules (model → ticks → sticking; model + tempo + swing → scheduled event list) with no Web Audio or DOM. They're unit-tested with Vitest using *Syncopation*-style examples. No end-to-end tests in v1; audio and highlighting are checked by ear and eye.
- **Licences**: everything chosen so far is MIT or CC0, so nothing blocks a future public app. No ADR: these choices are easy to reverse, and sync is already out of scope.
