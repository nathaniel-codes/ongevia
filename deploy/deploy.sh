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

echo "[deploy] npm install…"
# Build needs devDependencies (Tailwind/PostCSS). Keep them on the server.
npm install --include=dev
npx prisma generate
npx prisma migrate deploy
npm run build

systemctl restart ongevia-web ongevia-worker
sleep 2
systemctl --no-pager --full status ongevia-web ongevia-worker | head -40
curl -fsS http://127.0.0.1:3010/api/health || true
echo
echo "[deploy] done"
