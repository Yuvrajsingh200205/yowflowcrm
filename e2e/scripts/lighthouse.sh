#!/usr/bin/env bash
# Runs Lighthouse (mobile + desktop) against the E2E production build and prints category scores.
# Usage: CHROME_PATH=/path/to/chromium e2e/scripts/lighthouse.sh [base-url] [paths...]
BASE="${1:-http://localhost:3002}"; shift || true
PATHS=("${@:-/ /features /pricing /about /contact /login /signup}")
OUT="$(cd "$(dirname "$0")/.." && pwd)/.artifacts/lighthouse"; mkdir -p "$OUT"
for form in mobile desktop; do
  for p in ${PATHS[@]}; do
    name="$(echo "$p" | tr '/' '_')"; [ "$name" = "_" ] && name="_home"
    extra=""; [ "$form" = "desktop" ] && extra="--preset=desktop"
    npx --yes lighthouse@12 "$BASE$p" $extra --chrome-flags="--headless=new --no-sandbox" --only-categories=performance,accessibility,best-practices,seo --output=json --output-path="$OUT/$form$name.json" --quiet >"$OUT/$form$name.log" 2>&1
    node -e "const r=require('$OUT/$form$name.json');const c=r.categories;console.log('$form'.padEnd(8),'$p'.padEnd(11),Object.entries(c).map(([k,v])=>k.slice(0,4)+':'+Math.round(v.score*100)).join('  '))"
  done
done
