# Umami analytics (markmhendrickson.com)

The Vite build injects Umami **only** when env vars are set—**no hardcoded IDs** in the repo.

| Variable | When | Description |
|----------|------|----------------|
| `VITE_UMAMI_SCRIPT_URL` | Always (to enable tracking) | Full URL to `script.js` (e.g. `https://cloud.umami.is/script.js`) |
| `VITE_UMAMI_WEBSITE_ID_DEV` | `vite dev` | Website ID for local / dev (e.g. Umami site with domain `localhost`) |
| `VITE_UMAMI_WEBSITE_ID_PROD` | `vite build`, `vite build --mode production` | Website ID for production (`markmhendrickson.com`) |

All three must be set for the matching command to inject the script: dev needs **script URL + DEV id**; production builds need **script URL + PROD id**.

Pageviews use `data-auto-track="false"` plus `UmamiRouteTracker` for SPA navigations. Custom events use `trackUmamiEvent` in code.

Copy `react-app/umami.env.template` to `react-app/.env.local` (or export vars in CI) and fill in UUIDs from the Umami dashboard.

---

## Option A — Umami Cloud (hosted, no VPS)

[Umami Cloud](https://umami.is/docs/cloud) — [signup](https://cloud.umami.is/signup), [pricing](https://umami.is/pricing).

1. Add websites in the dashboard (e.g. prod `markmhendrickson.com`, dev `localhost`).
2. Set env:
   - `VITE_UMAMI_SCRIPT_URL=https://cloud.umami.is/script.js`
   - `VITE_UMAMI_WEBSITE_ID_DEV` = UUID of the dev website
   - `VITE_UMAMI_WEBSITE_ID_PROD` = UUID of the prod website

3. Neotoma (or other repos): same `VITE_UMAMI_SCRIPT_URL`; use that product’s own Umami websites and set **their** `VITE_UMAMI_WEBSITE_ID_*` in **that** project’s env.

---

## Option B — Self-hosted

Use **`umami_infra`** (`../umami_infra`) or your own host. Then:

| Variable | Example |
|----------|---------|
| `VITE_UMAMI_SCRIPT_URL` | `https://stats.markmhendrickson.com/script.js` |
| `VITE_UMAMI_WEBSITE_ID_DEV` / `VITE_UMAMI_WEBSITE_ID_PROD` | UUIDs from your instance |

If script and API origins differ, you may need `data-host-url`; extend `react-app/vite.config.ts` per [Umami tracker configuration](https://umami.is/docs/tracker-configuration).

---

## CI / Netlify / GitHub Actions

- **Production deploy:** set `VITE_UMAMI_SCRIPT_URL` and `VITE_UMAMI_WEBSITE_ID_PROD` (DEV optional for the build artifact).
- **Local dev:** set all three in `.env.local` (see `react-app/umami.env.template`).

This repo’s GitHub Pages workflow passes `VITE_UMAMI_SCRIPT_URL` and `VITE_UMAMI_WEBSITE_ID_PROD` from repository secrets.

---

## References

- [Umami Cloud overview](https://umami.is/docs/cloud)
- [Collect data / script](https://umami.is/docs/collect-data)
- [Tracker functions](https://umami.is/docs/tracker-functions)
- [Self-host install](https://umami.is/docs/install)
