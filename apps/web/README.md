# qlbmUI Web

Real frontend app for qlbmUI.

Stack:

- Svelte
- Vite
- DataViewer embed for QLBM preview

## Current scope

The first scaffold includes:

- helper connection flow
- run dashboard using the local helper API
- readable setup editor shell
- embedded QLBM setup preview

## Cloudflare Pages

This frontend can be deployed as a static site on Cloudflare Pages.

Recommended Pages settings:

- Root directory: `apps/web`
- Build command: `npm run build`
- Build output directory: `dist`

This app is still a browser UI for a local Python helper. Deploying the web app to Cloudflare does **not**
deploy `apps/local-helper`. Users still need a reachable helper service for runs, logs, and artifacts.

Files included for Cloudflare:

- `wrangler.toml`
  - Pages build output configuration
- `public/_redirects`
  - SPA fallback to `index.html`
- `public/_headers`
  - basic security headers and immutable asset caching
