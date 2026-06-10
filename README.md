# Group Attendance Reminder

Reminds a study group at **21:00** on class days and submits their attendance with one tap.
Android ships as a native app; iPhone uses the web/PWA build of the same codebase.

## Monorepo layout (npm workspaces)

| Package | Role |
| --- | --- |
| `app/` | Expo app (Android + web/PWA) — Expo Router, Zustand, TanStack Query, MMKV |
| `api/` | Express REST API, deployed as a Vercel Function |
| `worker/` | Home-PC `node-cron` scheduler (outbound-only) that triggers the 21:00 dispatch |
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
