#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/ongevia}"
cd "$APP_DIR"

echo "[deploy] pulling…"
git fetch --all
git reset --hard origin/main

# Support monorepo layout where app lives in ./ongevia
if [[ -f package.json ]]; then
  ROOT="."
elif [[ -f ongevia/package.json ]]; then
  ROOT="ongevia"
else
  echo "package.json not found"
  exit 1
fi

cd "$ROOT"
ln -sfn /etc/ongevia/.env .env

echo "[deploy] npm ci…"
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build

systemctl restart ongevia-web ongevia-worker
systemctl --no-pager --full status ongevia-web ongevia-worker | head -40
echo "[deploy] done"
