# Roadmap

What's planned beyond the open specs. Each item becomes a spec and tickets when it's picked up.

## In progress

- **Ghost notes:** a softer dynamic beside the accent, entered with the tool palette: [spec](ghost-notes/spec.md), two tickets. Asked for on 2026-10-26, grilled on 2026-10-30.

## Done

- **The 40 rudiments and their note marks:** [spec](rudiments/spec.md). All 40 in on 2026-10-28 (#168).

## Launch readiness (v1.0.0), waiting on the user's answers

1. Do accounts and sync come before the launch, or does v1.0.0 ship with everything stored on the device?
2. A custom domain changes the site's origin, so IndexedDB data at `tanksis.github.io` won't follow. It needs an export-and-import hand-over.
3. Browsers can clear storage even though `persist()` is requested (Safari's eviction after inactivity), so consider a backup reminder.
4. Test on real devices: iOS Safari audio (the silent switch, the tap before sound), Android Chrome, Firefox and desktop Safari.
5. The repo has no licence. Check the "Syncopate!" name and domain, and add a credits note (samples CC0, fonts OFL, VexFlow MIT) and a privacy line.
6. `index.html` needs a description and a share preview. Add a way to send feedback, and error reporting.
7. A fresh-eyes test with two or three drummers.

## Parked

- **A native iOS metronome app.** The user practises with Pro Metronome on the phone and with Syncopate! on the laptop. A wrapper around the web code keeps Web Audio's limits on iOS, so a reliable lock-screen metronome needs native Swift audio. That means a second codebase, plus a Mac or a cloud build service and the Apple developer account. Parked on 2026-10-26.
