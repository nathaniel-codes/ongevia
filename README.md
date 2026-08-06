# Ongevia

Instagram comment-to-DM automation. Phone OTP login, Swahilies wallet top-ups, platform admin, self-hosted on your VPS.

Someone comments a keyword on your reel → they get a private reply through the official Meta API.

## Stack

- Next.js web app + BullMQ worker
- PostgreSQL + Redis
- Beem Africa SMS (OTP)
- Swahilies mobile money (wallet)
- Deployed on your VPS (not Vercel)

## Quick start (local)

```bash
cd ongevia
npm install
cp .env.example .env   # fill secrets
docker compose up -d   # Postgres + Redis
npm run db:migrate
npm run seed:admin
npm run dev            # http://localhost:3010
npm run worker         # second terminal
```

## Production (VPS)

See [docs/setup.md](docs/setup.md). Summary:

1. Install Node 22, Postgres, Redis, nginx
2. Clone this repo to `/opt/ongevia`
3. Put secrets in `/etc/ongevia/.env`
4. Enable `ongevia-web` and `ongevia-worker` systemd units
5. Push to `main` → GitHub Action SSHs in and redeploys

Public URL (current): `http://104.219.236.43:3010`

## Admin

- URL: `/admin/login`
- Email + password from `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- Users, payments, global action logs, impersonation

## User auth

Phone number + Beem SMS OTP. No email signup for end users.
