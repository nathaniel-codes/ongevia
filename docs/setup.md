# Ongevia setup (VPS)

## Architecture

- **Web:** Next.js on port `3010` (or whichever free port you pick)
- **Worker:** `npm run worker` (DMs + payment polling every 5s + comment reconciler)
- **Postgres 16** and **Redis 7** on localhost
- **nginx** optional reverse proxy on port 80

Do **not** use Vercel or Railway for this deployment.

## 1. Port check

SSH to the VPS and list listeners:

```bash
ss -tlnp
```

Preferred ports: `3010` (app), `5432` (Postgres, localhost), `6379` (Redis, localhost), `80` (nginx if free).

## 2. Install packages (Ubuntu 22.04)

```bash
apt update
apt install -y curl git nginx redis-server
# Node 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
# Postgres 16
apt install -y postgresql postgresql-contrib
```

Create DB:

```bash
sudo -u postgres psql -c "CREATE USER ongevia WITH PASSWORD 'STRONG_DB_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE ongevia OWNER ongevia;"
```

## 3. App deploy path

```bash
mkdir -p /opt/ongevia /etc/ongevia
git clone <YOUR_GITHUB_REPO_URL> /opt/ongevia
cd /opt/ongevia
# if repo root contains ongevia/ subfolder:
# cd /opt/ongevia/ongevia
cp /etc/ongevia/.env .env   # or symlink
npm ci
npx prisma migrate deploy
npm run build
npm run seed:admin
```

## 4. Environment (`/etc/ongevia/.env`)

Copy from `.env.example`. Required:

- `NEXTAUTH_URL=http://104.219.236.43:3010`
- `NEXTAUTH_SECRET`, `CRON_SECRET`, `ENCRYPTION_KEY` (64 hex), `WEBHOOK_VERIFY_TOKEN`
- `DATABASE_URL`, `REDIS_URL`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- Beem + Swahilies keys
- Meta Instagram secrets when ready

Generate secrets:

```bash
openssl rand -base64 32   # NEXTAUTH_SECRET / CRON_SECRET
openssl rand -hex 32      # ENCRYPTION_KEY
```

## 5. systemd

Install units from `deploy/systemd/`:

```bash
cp deploy/systemd/*.service /etc/systemd/system/
cp deploy/systemd/*.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now ongevia-web ongevia-worker
systemctl enable --now ongevia-cron-refresh.timer ongevia-cron-reel.timer ongevia-cron-followers.timer
```

Health check: `curl http://127.0.0.1:3010/api/health`

## 6. GitHub auto-deploy

1. Add repo secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_APP_DIR`
2. Workflow `.github/workflows/deploy.yml` runs on push to `main`
3. It SSHs in, `git pull`, `npm ci`, migrate, build, restart services

## 7. Meta app

Follow the Instagram Login / webhook steps carefully. Use your public URL for OAuth redirect and webhook callback:

- OAuth: `http://104.219.236.43:3010/api/instagram/callback`
- Webhook: `http://104.219.236.43:3010/api/webhook`

Meta often requires **HTTPS**. When you add a domain + TLS, update `NEXTAUTH_URL` and Meta console URLs. Do not invent Meta UI steps; if a screen differs, screenshot it.

## Phone auth

Users request OTP → Beem SMS → verify → session. Invitations use phone numbers.

## Payments

Wallet top-up: Swahilies code 104, worker polls code 103 every 5 seconds until paid/expired (~3 min). Credits unlock DM sends.

## Logs

- User: `/activity` and `/logs` (DM logs)
- Admin: `/admin/logs` (all `ActionLog` rows)
