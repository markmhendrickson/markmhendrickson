#!/usr/bin/env bash
# Build the dev site with all draft posts visible.
# Uses VITE_SHOW_DRAFTS=true to bypass the published filter in the React code.
# Usage: bash scripts/build-dev.sh
# Then deploy: netlify deploy --dir=react-app/dist --site=markmhendrickson-dev --prod
set -euo pipefail

SITE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=== Dev build: including draft posts ==="
cd "$SITE_DIR/react-app"

SKIP_WEBSITE_CACHE_REGEN=1 VITE_SHOW_DRAFTS=true npx vite build

echo "/* /index.html 200" > dist/_redirects

# Copy private posts so browser can fetch /cache/posts.private.json at runtime
mkdir -p dist/cache
cp cache/posts.private.json dist/cache/posts.private.json

echo "=== Dev build complete. Deploy with: ==="
echo "netlify deploy --dir=react-app/dist --site=markmhendrickson-dev --prod"
