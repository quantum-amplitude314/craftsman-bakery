#!/usr/bin/env sh

set -e

bun --bun run opennextjs-cloudflare build "$@"

app=.next/server/app
assets=.open-next/assets
mkdir -p "$assets/staff"
cp "$app/cancel.html" "$assets/cancel.html"
cp "$app/staff/sign-in.html" "$assets/staff/sign-in.html"
cp "$app/_not-found.html" "$assets/404.html"
