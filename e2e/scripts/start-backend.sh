#!/usr/bin/env bash
# Starts an isolated backend for the E2E suite: fresh local database, migrated and seeded,
# listening on :5051. Never touches the Neon/production database.
set -euo pipefail
cd "$(dirname "$0")/../../../yowflow_backend"
LOG="../yowflow_frontend/e2e/.artifacts/backend.log"
mkdir -p "$(dirname "$LOG")"
: > "$LOG"

export DATABASE_URL="postgresql://${USER}@localhost:5432/yowflow_e2e?schema=public"
export DATABASE_URL_UNPOOLED="$DATABASE_URL"
export TEST_DATABASE_URL="$DATABASE_URL"
export NODE_ENV=development
export PORT=5051
export APP_URL="http://localhost:3002"
export COOKIE_SECURE=false
export SEED_DEMO_DATA=true
export SEED_ORG_NAME="E2E Studio" SEED_ORG_SLUG="e2e-studio"
export SEED_ADMIN_EMAIL="owner@e2e.test" SEED_ADMIN_PASSWORD="E2eOwner#2026"
unset RAZORPAY_KEY_ID RAZORPAY_KEY_SECRET

dropdb --if-exists yowflow_e2e
createdb yowflow_e2e
npx prisma migrate deploy >/dev/null
npx tsx prisma/seed.ts >/dev/null 2>&1
echo "e2e backend ready (seeded)" >> "$LOG"
exec npx tsx src/server.ts 2>&1 | tee -a "$LOG"
