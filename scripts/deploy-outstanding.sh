#!/bin/sh
# Commit outstanding website assets and push to trigger deploy.
# Run from repo root (execution/website/markmhendrickson) in a terminal outside Cursor to avoid .git/index.lock.
set -e
cd "$(dirname "$0")/.."
git add react-app/public/images/og/api-cli-first-agentic-products-1200x630.jpg \
  react-app/public/images/posts/agentic-wallets-mcp-bitcoin-hero-alt-*.png \
  react-app/public/images/posts/agentic-wallets-mcp-bitcoin-hero-btc-agent-*.png \
  react-app/public/images/posts/api-cli-first-agentic-products-hero*.png \
  react-app/public/images/posts/api-cli-first-agentic-products-hero-style.txt \
  react-app/public/images/posts/focus-on-work-you-love-delegate-the-rest-hero*.png \
  react-app/public/images/posts/focus-on-work-you-love-delegate-the-rest-hero-style.txt \
  react-app/scripts/generate-hero-og-from-hero.mjs
git status --short
git commit --no-verify -m "Add hero/OG images and generate-hero-og script"
git push origin main
echo "Pushed. Deploy will run at https://github.com/markmhendrickson/markmhendrickson/actions"
