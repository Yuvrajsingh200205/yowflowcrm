#!/usr/bin/env bash
# Rebuilds and restarts the E2E frontend (production build on :3002) after code changes.
cd "$(dirname "$0")/../.."
for pid in $(lsof -nP -tiTCP:3002 -sTCP:LISTEN 2>/dev/null); do kill "$pid" 2>/dev/null; done
export NEXT_DIST_DIR=.next-e2e API_PROXY_TARGET=http://localhost:5051 NEXT_PUBLIC_API_URL=/api/v1
npx next build --webpack && exec npx next start -p 3002
