# 34: Installable offline PWA

**What to build:** The drummer can install Syncopate! from the browser as a PWA. It opens and plays with no network connection, with the drum samples cached.

See [spec.md](../spec.md): PWA via `vite-plugin-pwa`, samples precached, service-worker scope `/syncopate-drums/`.

**Blocked by:** 17 (Play the exercise with click and count-in)

**Status:** needs-info (deferred 2026-10-07)

- [ ] `vite-plugin-pwa` generates a manifest (name Syncopate!, with an icon) and a service worker scoped to `/syncopate-drums/`
- [ ] The app shell and all drum samples are precached
- [ ] Installed from the Pages URL, the app launches and plays back offline
- [ ] A new deploy updates the installed app without losing the exercise library

## Comments

- Deferred on 2026-10-07 at the user's request. They have considerations and user-experience points to discuss before it is built. Revisit after that discussion.
- 2026-10-07: stays deferred until the user feels the app is ready to install; nothing to build before then.
