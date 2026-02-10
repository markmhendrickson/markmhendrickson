#!/bin/sh
# Update website to latest shared (react-components) and push to deploy.
# Run from repo root in a terminal *outside Cursor* to avoid .git/index.lock:
#   cd execution/website/markmhendrickson && ./scripts/ship-shared.sh
set -e
cd "$(dirname "$0")/.."
git add shared
git status --short shared
git commit --no-verify -m "Update shared: mobile sidebar bottom padding for browser URL bar"
git push origin main
echo "Pushed. Deploy: https://github.com/markmhendrickson/markmhendrickson/actions"
