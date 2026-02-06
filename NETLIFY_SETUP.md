# Netlify Deployment Setup

Newsletter subscription and survey update are implemented as Netlify serverless functions. Subscribers are stored in Netlify Blobs.

## Prerequisites

1. Netlify account
2. Resend account (or SendGrid/Mailgun) for confirmation emails
3. Domain verification for newsletter@markmhendrickson.com

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
| `EMAIL_DELIVERY_API_KEY` | Yes | Resend API key (re_xxx) |
| `NEWSLETTER_FROM_EMAIL` | No | Default: newsletter@markmhendrickson.com |
| `NEWSLETTER_NAME` | No | Default: Mark Hendrickson Newsletter |
| `VITE_GA_MEASUREMENT_ID` | No | For analytics (if used in build) |

### 3. DNS

Point markmhendrickson.com to the Netlify site (Netlify provides DNS or use CNAME).

### 4. Email DNS (Resend)

Add SPF, DKIM, and DMARC records for markmhendrickson.com as provided by Resend.

## API Endpoints

- `POST /api/newsletter/subscribe` — Subscribe with email (optional survey)
- `POST /api/newsletter/update-survey` — Update survey for existing subscriber

Redirects in `netlify.toml` rewrite these URLs to the corresponding Netlify functions.

## Local Development

Run the site with `cd react-app && npm run dev`. The newsletter form posts to `/api/newsletter/subscribe`, which will 404 locally unless you run Netlify Dev:

```bash
npm install -g netlify-cli
netlify dev
```

This runs the site and functions locally.
