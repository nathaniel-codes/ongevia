#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/ongevia}"
cd "$APP_DIR"

echo "[deploy] syncing from GitHub…"
git config --global --add safe.directory "$APP_DIR" || true
if [ -d .git ]; then
  git remote set-url origin https://github.com/nathaniel-codes/ongevia.git || true
  git fetch --all
  git reset --hard origin/main
else
  echo "[deploy] no git repo — skipping pull (rsync/manual deploy)"
fi

ln -sfn /etc/ongevia/.env .env
# Load KEY=VALUE without shell expansion (secrets may contain $).
set -a
while IFS= read -r line || [ -n "$line" ]; do
  case "$line" in
    ''|\#*) continue ;;
  esac
  key="${line%%=*}"
  val="${line#*=}"
  if [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
    export "$key=$val"
  fi
done < /etc/ongevia/.env
set +a

echo "[deploy] stopping services for a clean install…"
systemctl stop ongevia-web ongevia-worker 2>/dev/null || true
# Avoid races with leftover next/npm processes
pkill -f "next build" 2>/dev/null || true
pkill -f "npm ci" 2>/dev/null || true
sleep 1

echo "[deploy] npm ci…"
# Build needs devDependencies (Tailwind/PostCSS).
rm -rf node_modules .next
npm ci --include=dev
export PATH="$APP_DIR/node_modules/.bin:$PATH"
npx prisma generate
npx prisma migrate deploy
# Ensure admin + @ongeviadotcom platform account from env (no wipe)
npx tsx scripts/bootstrap-platform.ts || true
npm run build

systemctl start ongevia-web ongevia-worker
sleep 2
systemctl --no-pager --full status ongevia-web ongevia-worker | head -40
curl -fsS http://127.0.0.1:3010/api/health || true
echo
echo "[deploy] done"
