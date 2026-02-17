# Netlify Deployment Setup

Newsletter subscription and survey update are implemented as Netlify serverless functions. Subscribers are stored in Netlify Blobs.

## Prerequisites

1. Netlify account
2. SendGrid account for confirmation emails
3. Domain verification for sender email (SendGrid)

## Deployment Steps

### 1. Connect Repository

- In Netlify: Add new site from Git
- Connect the ateles repository (or markmhendrickson submodule if deployed separately)
- If using ateles repo: set **Base directory** to `execution/website/markmhendrickson`
- Build command: `npm run build` (runs `cd react-app && npm ci && npm run build:ci`)
- Publish directory: `react-app/dist`

### 2. Environment Variables

Set in Netlify: Site settings → Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SENDGRID_API_KEY` | Yes | SendGrid API key |
| `SENDGRID_SENDER_EMAIL` | Yes | Verified sender email (e.g. newsletter@markmhendrickson.com) |
| `NEWSLETTER_ADMIN_API_KEY` | Yes | Auth for GET /api/newsletter/subscribers (Bearer token) |
| `NEWSLETTER_NAME` | No | Default: Mark Hendrickson Newsletter |
| `VITE_GA_MEASUREMENT_ID` | No | For analytics (if used in build) |
| `USE_LOCAL_NEWSLETTER_STORAGE` | No | Set to `1` to use local JSON file instead of Blobs (dev) |
| `NEWSLETTER_DB_PATH` | No | Path to local JSON (default: data/newsletter_subscribers.json) |

### 3. DNS

Point markmhendrickson.com to the Netlify site (Netlify provides DNS or use CNAME).

### 4. Email DNS (SendGrid)

Add SPF, DKIM, and DMARC records for your sender domain as provided by SendGrid Domain Authentication.

## API Endpoints

- `POST /api/newsletter/subscribe` — Subscribe with email (optional survey)
- `POST /api/newsletter/update-survey` — Update survey for existing subscriber
- `GET /api/newsletter/subscribers` — List subscribers (requires `Authorization: Bearer <NEWSLETTER_ADMIN_API_KEY>`)

Redirects in `netlify.toml` rewrite these URLs to the corresponding Netlify functions.

## Local Development

Two options for local newsletter development:

**Option A: Netlify Dev** (full Netlify emulation, Blobs or local storage via env)

```bash
npm install -g netlify-cli
netlify dev
```

Set `USE_LOCAL_NEWSLETTER_STORAGE=1` in `.env` to persist subscribers to a local JSON file instead of Blobs. Data is stored at `NEWSLETTER_DB_PATH` (default: `data/newsletter_subscribers.json`).

**Option B: Vite + dev API** (no Netlify CLI, local JSON only)

```bash
cd react-app
npm run dev:full
```

Runs Vite and a local newsletter API server. The API uses `data/newsletter_subscribers.json` for storage. Configure `NEWSLETTER_DEV_API_PORT` (default: 3456) and `NEWSLETTER_DB_PATH` if needed.

To run only the dev API (e.g. with `npm run dev` in another terminal):

```bash
npm run dev:api
```

## newsletter_send.py: Production Sends

To send newsletters to production subscribers (stored in Netlify Blobs), set:

- `NEWSLETTER_SUBSCRIBERS_API_URL` — e.g. `https://markmhendrickson.com/api/newsletter/subscribers`
- `NEWSLETTER_ADMIN_API_KEY` — Same value as Netlify `NEWSLETTER_ADMIN_API_KEY`

Or pass `--subscribers-api-url` when running the script.
