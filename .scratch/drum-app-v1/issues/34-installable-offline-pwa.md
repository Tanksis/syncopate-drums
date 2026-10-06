# 34: Installable offline PWA

**What to build:** The drummer can install Syncopate! from the browser as a PWA. It opens and plays with no network connection, with the drum samples cached.

See [spec.md](../spec.md): PWA via `vite-plugin-pwa`, samples precached, service-worker scope `/syncopate-drums/`.

**Blocked by:** 17 (Play the exercise with click and count-in)

**Status:** ready-for-agent

- [ ] `vite-plugin-pwa` generates a manifest (name Syncopate!, with an icon) and a service worker scoped to `/syncopate-drums/`
- [ ] The app shell and all drum samples are precached
- [ ] Installed from the Pages URL, the app launches and plays back offline
- [ ] A new deploy updates the installed app without losing the exercise library
