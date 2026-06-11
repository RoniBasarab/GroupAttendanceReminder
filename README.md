# Group Attendance Reminder

Reminds a study group at **19:00** on class days and submits their attendance with one tap.
Android ships as a native app; iPhone uses the web/PWA build of the same codebase.

## Monorepo layout (npm workspaces)

| Package | Role |
| --- | --- |
| `app/` | Expo app (Android + web/PWA) — Expo Router, Zustand, TanStack Query, MMKV |
| `api/` | Express REST API, deployed as a Vercel Function |
| `worker/` | Home-PC `node-cron` scheduler (outbound-only) that triggers the 19:00 dispatch |
| `core/` | Shared TypeScript: domain types, DB client (`@gar/core/db`), form configs |

## Prerequisites

- Node.js 20+ and npm 10+

## Setup

```bash
npm install
cp .env.example .env   # then fill in values (placeholders are fine to start)
```

## Run locally

```bash
npm run app            # Expo app (press w for web, a for Android)
npm run dev:api        # API at http://localhost:3001  (health: /api/health)
npm run dev:worker     # scheduler (stays running)
npm run worker:tick    # run one dispatch immediately, then exit (for testing)
npm run typecheck      # typecheck every workspace
```

## Database (Drizzle + Supabase)

Schema: `core/src/db/schema.ts`. Migrations are generated into `core/drizzle/`.

```bash
npm run db:generate    # schema -> SQL migration (offline, no DB needed)
npm run db:migrate     # apply migrations (needs a real DATABASE_URL)
npm run db:push        # push schema directly (dev convenience)
npm run db:studio      # browse data
```

`db:generate` runs without a database. `db:migrate` / `db:push` / `db:studio` need a real
Supabase `DATABASE_URL` (Shared Pooler, transaction mode) in `.env`. The Google Form configs
are stored in the `form_configs` table — not in the repo.

## Running the worker on the always-on PC

The worker only makes outbound calls (reads Supabase, sends push/email), so it needs **no
inbound network access**.

```bash
npm run start -w @gar/worker      # foreground
```

To keep it alive across reboots, use a process manager (optional):

```bash
npm i -g pm2
pm2 start "npm run start -w @gar/worker" --name gar-worker
pm2 save && pm2 startup           # restart on boot
# restart after a code change / machine restart:
pm2 restart gar-worker
```

Or run it from a terminal / Windows Task Scheduler at logon.

## Deploying the API (Vercel)

The Express app is Vercel-ready (zero-config): `api/src/index.ts` exports the app as default.

- Create a Vercel project from this repo with **Root Directory = `api`**.
- Vercel detects the npm workspace and installs from the repo root (so `@gar/core` resolves).
- Set env vars (`DATABASE_URL`, etc.) in the Vercel project settings.
- The whole Express app becomes one Vercel Function; routes work as defined (e.g. `/api/health`).
