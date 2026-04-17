# qlbmUI

This repository is split into separate applications so the local helper and the web frontend
do not share source layout or tooling concerns.

## Layout

- `apps/local-helper`
  - Python localhost orchestration service
  - accepts generated scripts
  - runs `qlbm`
  - exposes run status and artifacts over HTTP

- `apps/web`
  - real frontend
  - planned stack: `Svelte + Vite + vtk.js`

## Hosting

The web frontend under `apps/web` can be hosted on Cloudflare Pages as a static site.

Important limitation:

- `apps/local-helper` is a separate Python localhost orchestration service
- hosting `apps/web` on Cloudflare does not host the helper
- the deployed UI still needs a reachable helper endpoint to create runs and fetch artifacts
