#!/bin/bash
# Simple dev server for markmhendrickson.com website
# Usage: ./dev-server.sh [port]

PORT=${1:-8000}
echo "Starting dev server on http://localhost:$PORT"
echo "Press Ctrl+C to stop"
cd "$(dirname "$0")"
python3 -m http.server $PORT
