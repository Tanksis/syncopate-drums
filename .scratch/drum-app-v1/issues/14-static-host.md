# Static host

Type: grilling
Status: resolved
Blocked by: (none)

## Question

Where is the PWA hosted, and how does it get deployed?

- GitHub Pages (the repo is now on GitHub at `Tanksis/syncopate-drums`) vs. Cloudflare Pages or Netlify.
- Deploy trigger (every push to `main`, or manual), and the URL the app lives at (repo subpath vs. custom domain), since the PWA's base path and service-worker scope depend on it.

## Answer

Decided with the user in a grilling session (2026-10-06). The user accepted every recommendation.

- **Host**: GitHub Pages, for now. A move to another host can come later if the app grows.
- **Deploy**: a GitHub Actions workflow on every push to `main`. It runs the Vitest suite first, and a failing test blocks the deploy.
- **URL**: the default subpath, `https://tanksis.github.io/syncopate-drums/`, with no custom domain. Vite's `base` and the service-worker scope are set to `/syncopate-drums/`. If the app later moves to a custom domain, exercises won't follow automatically (IndexedDB is tied to the address); move them with JSON export/import.
- **Using the app on more than one computer** (e.g. laptop and personal PC): out of scope here. Each device keeps its own exercises, per the existing "Sync between devices / accounts" out-of-scope entry; export/import moves them by hand.
